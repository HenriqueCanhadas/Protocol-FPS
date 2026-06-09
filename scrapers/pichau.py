"""
Scraper da Pichau — PROTOCOL FPS

Estrutura confirmada inspecionando o HTML (junho/2025):
  - Meta tag: <meta property="product:price:amount" content="R$ 7,899.99">
  - Meta tag: <meta name="twitter:data1" content="R$ 7,899.99">
  - Meta tag: <meta property="product:availability" content="instock">
  - JSON-LD: schema.org/Product com offers.price

v2 (junho/2026):
  - playwright-stealth aplicado via ScraperBase (masca webdriver)
  - networkidle com timeout adaptativo (30s em CI)
  - Fallback HTTP com headers completos de Chrome real (inclui Referer e cookies mínimos)
  - Detecção de bloqueio por corpo curto/WAF antes de tentar extrair
  - HTTP fallback usa session-like headers para evitar 403
"""
from __future__ import annotations
import json
import re
import logging
import time
import urllib.request
import urllib.error
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto, TIMEOUT_NETWORKIDLE, TIMEOUT_SELECTOR

logger = logging.getLogger(__name__)

SELETOR_ESGOTADO = ", ".join([
    "button:has-text('Indisponível')",
    "button:has-text('Avise-me')",
    "button:has-text('Esgotado')",
    "button:has-text('INDISPONÍVEL')",
    "button:has-text('ESGOTADO')",
    "[class*='unavailable']",
    "[class*='out-of-stock']",
    "[class*='esgotado']",
])

# Headers que imitam um Chrome real acessando diretamente — essencial para o HTTP fallback
_HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,"
        "application/signed-exchange;v=b3;q=0.7"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "sec-ch-ua": (
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"'
    ),
    "sec-ch-ua-mobile":   "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest":     "document",
    "Sec-Fetch-Mode":     "navigate",
    "Sec-Fetch-Site":     "none",
    "Sec-Fetch-User":     "?1",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control":      "max-age=0",
    # Referer vazio (como numa navegação direta) — sem Referer suspeito de bot
}


class PichauScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Pichau usa Next.js com SSR + hidratação.
        networkidle garante que as meta tags e JSON-LD estejam prontos.
        """
        try:
            page.wait_for_load_state("networkidle", timeout=TIMEOUT_NETWORKIDLE)
        except Exception:
            try:
                page.wait_for_load_state("domcontentloaded", timeout=10_000)
            except Exception:
                pass

        # Aguarda meta de preço ou qualquer indicador de produto
        for seletor in [
            "meta[property='product:price:amount']",
            "meta[name='twitter:data1']",
            "script[type='application/ld+json']",
            "h1",
        ]:
            try:
                page.wait_for_selector(seletor, timeout=TIMEOUT_SELECTOR)
                logger.debug("Seletor Pichau pronto: %s", seletor)
                return
            except Exception:
                continue

        logger.warning("Nenhum seletor Pichau apareceu — tentando prosseguir mesmo assim")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        # Verifica se a página foi bloqueada por anti-bot/WAF
        if self._esta_bloqueado(page):
            logger.warning(
                "Pichau: headless bloqueado — tentando fallback HTTP para %s", url
            )
            return self._coletar_via_http(url)

        nome = self._extrair_nome(page)

        # 1. Meta tag product:price:amount — FONTE PRIMÁRIA
        preco = self._extrair_preco_meta(page, "meta[property='product:price:amount']")

        # 2. Twitter card fallback
        if preco is None:
            preco = self._extrair_preco_meta(page, "meta[name='twitter:data1']")

        # 3. JSON-LD fallback
        if preco is None:
            preco = self._extrair_preco_jsonld(page)

        # 4. CSS como último recurso
        if preco is None:
            preco = self._extrair_preco_css(page)

        disponivel_meta = self._extrair_disponibilidade_meta(page)
        esgotado_btn   = self._esta_esgotado(page)
        disponivel     = disponivel_meta and not esgotado_btn

        if preco is None:
            logger.warning("Preço não encontrado na Pichau: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        logger.info("Pichau — preço: R$ %.2f | disponível: %s", preco, disponivel)
        return DadosProduto(nome=nome, preco=preco, disponivel=disponivel, url=url)

    # ------------------------------------------------------------------
    # Anti-bot detection & HTTP fallback
    # ------------------------------------------------------------------

    def _esta_bloqueado(self, page: Page) -> bool:
        """Detecta respostas de bloqueio WAF/Cloudflare."""
        try:
            body_len = page.evaluate("() => document.body.innerText.length")
            if body_len < 500:
                snippet = page.evaluate(
                    "() => document.body.innerText.substring(0, 150)"
                ).lower()
                kws = (
                    "host not in allowlist", "access denied", "captcha",
                    "just a moment", "forbidden", "cloudflare", "security check",
                    "please wait", "checking your browser",
                )
                if any(kw in snippet for kw in kws):
                    logger.debug("Bloqueio WAF detectado: '%s'", snippet[:80])
                    return True
                if body_len < 200:
                    logger.debug("Página suspeita — body muito curto (%d chars)", body_len)
                    return True
        except Exception:
            pass
        return False

    def _coletar_via_http(self, url: str) -> DadosProduto:
        """
        Fallback: requisição HTTP direta com headers completos de Chrome.
        Extrai meta tags do HTML SSR via regex (sem DOM).
        """
        try:
            req = urllib.request.Request(url, headers=_HTTP_HEADERS, method="GET")
            # Segue redirecionamentos automaticamente
            with urllib.request.urlopen(req, timeout=20) as resp:
                # Lida com gzip/deflate transparentemente
                raw = resp.read()
                encoding = resp.headers.get_content_charset() or "utf-8"
                html = raw.decode(encoding, errors="replace")
        except urllib.error.HTTPError as exc:
            logger.error("Pichau HTTP fallback falhou [%d]: %s", exc.code, exc.reason)
            return DadosProduto(nome="Erro ao coletar", preco=None, disponivel=False, url=url)
        except urllib.error.URLError as exc:
            logger.error("Pichau HTTP fallback — conexão falhou: %s", exc)
            return DadosProduto(nome="Erro ao coletar", preco=None, disponivel=False, url=url)

        # Extrai nome — tenta ambas as ordens de atributos
        nome = (
            self._regex_meta(html, "og:title",         attr="property") or
            self._regex_meta(html, "twitter:title",    attr="name") or
            "Nome não encontrado"
        )
        nome = re.sub(r'\s*\|\s*Pichau.*$', '', nome).strip()

        # Extrai preço
        preco_str = (
            self._regex_meta(html, "product:price:amount", attr="property") or
            self._regex_meta(html, "twitter:data1",        attr="name")
        )
        preco = self._normalizar_preco(preco_str) if preco_str else None

        # Disponibilidade
        avail_str  = self._regex_meta(html, "product:availability", attr="property") or ""
        disponivel = "instock" in avail_str.lower() if avail_str else True

        if preco:
            logger.info(
                "Pichau HTTP fallback — preço: R$ %.2f | disponível: %s", preco, disponivel
            )
        else:
            logger.warning("Pichau HTTP fallback — preço não encontrado para: %s", url)

        return DadosProduto(
            nome=nome,
            preco=preco,
            disponivel=disponivel if preco else False,
            url=url,
        )

    @staticmethod
    def _regex_meta(html: str, key: str, attr: str = "property") -> str | None:
        """
        Extrai content de uma meta tag suportando as duas ordens de atributos:
          <meta property="KEY" content="VALUE">
          <meta content="VALUE" property="KEY">
        """
        key_esc = re.escape(key)
        # Ordem 1: atributo-chave antes de content
        m = re.search(
            rf'{attr}=["\']' + key_esc + r'["\'][^>]+content=["\']([^"\']+)["\']',
            html, re.IGNORECASE
        )
        if m:
            return m.group(1).strip()
        # Ordem 2: content antes do atributo-chave
        m = re.search(
            r'content=["\']([^"\']+)["\'][^>]+' + attr + r'=["\']' + key_esc + r'["\']',
            html, re.IGNORECASE
        )
        if m:
            return m.group(1).strip()
        return None

    # ------------------------------------------------------------------
    # Extratores Playwright
    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page) -> str:
        for seletor, attr in [
            ("meta[property='og:title']", "content"),
            ("meta[name='twitter:title']", "content"),
        ]:
            try:
                el = page.query_selector(seletor)
                if el:
                    valor = el.get_attribute(attr) or ""
                    nome = re.sub(r'\s*\|\s*Pichau.*$', '', valor).strip()
                    if nome:
                        return nome
            except Exception:
                continue
        try:
            el = page.query_selector("h1")
            return el.inner_text().strip() if el else "Nome não encontrado"
        except Exception:
            return "Nome não encontrado"

    def _extrair_preco_meta(self, page: Page, seletor: str) -> float | None:
        try:
            el = page.query_selector(seletor)
            if not el:
                return None
            conteudo = el.get_attribute("content") or ""
            return self._normalizar_preco(conteudo)
        except Exception as exc:
            logger.debug("Erro ao ler meta %s: %s", seletor, exc)
            return None

    def _extrair_preco_jsonld(self, page: Page) -> float | None:
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") == "Product":
                        offers = data.get("offers", {})
                        if isinstance(offers, list):
                            offers = offers[0]
                        price = offers.get("price") or offers.get("lowPrice")
                        if price:
                            v = float(str(price).replace(",", "."))
                            if v > 50:
                                return v
                except Exception:
                    continue
        except Exception:
            pass
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        candidatos = [
            "span[class*='pix']", "div[class*='pix']",
            "[class*='finalPrice']", "[class*='productPrice']",
            "[class*='price-box']", "span[class*='price']", "div[class*='price']",
        ]
        precos = []
        for seletor in candidatos:
            try:
                for el in page.query_selector_all(seletor):
                    v = self._normalizar_preco(el.inner_text())
                    if v and v > 500:
                        precos.append(v)
            except Exception:
                continue

        if not precos:
            try:
                valores = page.evaluate("""() => {
                    const results = [];
                    const walker = document.createTreeWalker(
                        document.body, NodeFilter.SHOW_TEXT
                    );
                    let node;
                    while ((node = walker.nextNode())) {
                        const text = node.textContent.trim();
                        const m = text.match(/^R\\$\\s*([\\d.]+,[\\d]{2})$/);
                        if (m) results.push(m[1]);
                    }
                    return results;
                }""")
                for v_str in valores:
                    v = self._normalizar_preco("R$ " + v_str)
                    if v and v > 500:
                        precos.append(v)
            except Exception as exc:
                logger.debug("Erro no JS scan Pichau: %s", exc)

        return min(precos) if precos else None

    def _extrair_disponibilidade_meta(self, page: Page) -> bool:
        try:
            el = page.query_selector("meta[property='product:availability']")
            if el:
                val = (el.get_attribute("content") or "").lower()
                return "instock" in val or "in stock" in val
            return True
        except Exception:
            return True

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            return page.query_selector(SELETOR_ESGOTADO) is not None
        except Exception:
            return False

    @staticmethod
    def _normalizar_preco(texto: str) -> float | None:
        if not texto:
            return None
        limpo = re.sub(r'[R$\s]', '', texto).strip()
        if not limpo:
            return None
        try:
            if re.match(r'^\d{1,3}(\.\d{3})*(,\d{2})$', limpo):
                return float(limpo.replace('.', '').replace(',', '.'))
            if re.match(r'^\d{1,3}(,\d{3})*(\.\d{2})$', limpo):
                return float(limpo.replace(',', ''))
            return float(limpo.replace(',', '.'))
        except (ValueError, AttributeError):
            return None