"""
Scraper da Pichau — PROTOCOL FPS

Estrutura confirmada inspecionando o HTML (junho/2025):
  - Meta tag: <meta property="product:price:amount" content="R$ 7,899.99">
  - Meta tag: <meta name="twitter:data1" content="R$ 7,899.99">
  - Meta tag: <meta property="product:availability" content="instock">
  - JSON-LD: schema.org/Product com offers.price
  - Preço PIX (à vista): div/span contendo "à vista" + valor

  IMPORTANTE: O site renderiza com Next.js (SSR), então as meta tags
  já vêm no HTML estático — são a fonte mais confiável.
  O scraper antigo pegava R$ 15,00 porque usava seletores CSS genéricos
  que batiam em elementos de frete/outros valores pequenos na página.

Correções v2 (junho/2026):
  - Timeout aumentado de domcontentloaded → networkidle (Pichau hidrata SSR via JS)
  - Fallback HTTP fetch com urllib para contornar bloqueio anti-bot do headless
  - Detecção explícita de bloqueio ("Host not in allowlist", CAPTCHA etc.)
  - Meta og:title como fallback para nome quando og:title falha
"""
from __future__ import annotations
import json
import re
import logging
import urllib.request
import urllib.error
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

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

# Headers realistas para o fallback HTTP
_HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
}


class PichauScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Pichau usa Next.js com SSR — mas a hidratação JS pode demorar.
        Aguarda networkidle para garantir que as meta tags e JSON-LD estejam prontos.
        """
        # Espera o HTML estático + JS de hidratação
        try:
            page.wait_for_load_state("networkidle", timeout=20_000)
        except Exception:
            # Fallback: pelo menos domcontentloaded
            try:
                page.wait_for_load_state("domcontentloaded", timeout=10_000)
            except Exception:
                pass

        # Tenta aguardar meta de preço ou qualquer indicador de produto
        for seletor in [
            "meta[property='product:price:amount']",
            "meta[name='twitter:data1']",
            "script[type='application/ld+json']",
            "h1",
        ]:
            try:
                page.wait_for_selector(seletor, timeout=5_000)
                logger.debug("Seletor Pichau pronto: %s", seletor)
                return
            except Exception:
                continue

        logger.warning("Nenhum seletor Pichau apareceu — tentando prosseguir mesmo assim")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        # Verifica se a página foi bloqueada por anti-bot
        if self._esta_bloqueado(page):
            logger.warning("Pichau: headless bloqueado para %s — tentando fallback HTTP", url)
            return self._coletar_via_http(url)

        nome = self._extrair_nome(page)

        # 1. Meta tag product:price:amount — FONTE PRIMÁRIA (SSR, sempre presente)
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

        # Verifica disponibilidade
        disponivel_meta = self._extrair_disponibilidade_meta(page)
        esgotado_btn   = self._esta_esgotado(page)
        disponivel     = disponivel_meta and not esgotado_btn

        if preco is None:
            logger.warning("Preço não encontrado na Pichau: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        logger.info("Pichau — preço: R$ %.2f | disponível: %s", preco, disponivel)
        return DadosProduto(nome=nome, preco=preco, disponivel=disponivel, url=url)

    # ------------------------------------------------------------------
    # Anti-bot detection & fallback
    # ------------------------------------------------------------------

    def _esta_bloqueado(self, page: Page) -> bool:
        """
        Detecta respostas de bloqueio anti-bot comuns:
        - Corpo vazio ou muito curto
        - Textos típicos de WAF/Cloudflare
        """
        try:
            body_len = page.evaluate("() => document.body.innerText.length")
            if body_len < 200:
                snippet = page.evaluate("() => document.body.innerText.substring(0, 100)")
                kws = ("host not in allowlist", "access denied", "captcha", "just a moment", "forbidden")
                if any(kw in snippet.lower() for kw in kws):
                    logger.debug("Bloqueio detectado: '%s'", snippet)
                    return True
                # Página muito curta sem bloqueio explícito = suspeito
                if body_len < 100:
                    return True
        except Exception:
            pass
        return False

    def _coletar_via_http(self, url: str) -> DadosProduto:
        """
        Fallback: faz requisição HTTP direta para extrair meta tags do SSR.
        Útil quando o headless é bloqueado mas a requisição direta não.
        """
        try:
            req = urllib.request.Request(url, headers=_HTTP_HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode("utf-8", errors="replace")
        except urllib.error.URLError as exc:
            logger.error("Pichau HTTP fallback falhou: %s", exc)
            return DadosProduto(nome="Erro ao coletar", preco=None, disponivel=False, url=url)

        # Extrai meta tags com regex (sem DOM disponível)
        nome       = self._regex_meta(html, r'property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']') \
                  or self._regex_meta(html, r'name=["\']twitter:title["\'][^>]+content=["\']([^"\']+)["\']') \
                  or "Nome não encontrado"
        # Remove " | Pichau" do título
        nome = re.sub(r'\s*\|\s*Pichau.*$', '', nome).strip()

        preco_str  = self._regex_meta(html, r'property=["\']product:price:amount["\'][^>]+content=["\']([^"\']+)["\']') \
                  or self._regex_meta(html, r'name=["\']twitter:data1["\'][^>]+content=["\']([^"\']+)["\']')
        preco      = self._normalizar_preco(preco_str) if preco_str else None

        avail_str  = self._regex_meta(html, r'property=["\']product:availability["\'][^>]+content=["\']([^"\']+)["\']') or ""
        disponivel = "instock" in avail_str.lower() if avail_str else True

        if preco:
            logger.info("Pichau HTTP fallback — preço: R$ %.2f | disponível: %s", preco, disponivel)
        else:
            logger.warning("Pichau HTTP fallback — preço não encontrado para: %s", url)

        return DadosProduto(nome=nome, preco=preco, disponivel=disponivel if preco else False, url=url)

    @staticmethod
    def _regex_meta(html: str, pattern: str) -> str | None:
        """Extrai conteúdo de meta tag usando regex no HTML bruto."""
        # Tenta ordem direta e invertida (content= pode vir antes ou depois de property=)
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        # Tenta a ordem invertida: content= ANTES de property=
        # Ex: <meta content="R$ 7.999,00" property="product:price:amount">
        prop_match = re.search(r'property=["\']([^"\']+)["\']', pattern)
        name_match = re.search(r'name=["\']([^"\']+)["\']', pattern)
        key = (prop_match or name_match)
        if key:
            attr = 'property' if prop_match else 'name'
            inv_pattern = rf'content=["\']([^"\']+)["\'][^>]+{attr}=["\']' + re.escape(key.group(1)) + r'["\']'
            m2 = re.search(inv_pattern, html, re.IGNORECASE)
            if m2:
                return m2.group(1).strip()
        return None

    # ------------------------------------------------------------------
    # Extratores principais
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
        """Último recurso — seletores específicos do Pichau."""
        candidatos = [
            "span[class*='pix']",
            "div[class*='pix']",
            "[class*='finalPrice']",
            "[class*='productPrice']",
            "[class*='price-box']",
            "span[class*='price']",
            "div[class*='price']",
        ]
        precos = []
        for seletor in candidatos:
            try:
                elementos = page.query_selector_all(seletor)
                for el in elementos:
                    texto = el.inner_text()
                    valor = self._normalizar_preco(texto)
                    if valor and valor > 500:
                        precos.append(valor)
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
                logger.debug("Erro no JS scan: %s", exc)

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
        """
        Normaliza diferentes formatos de preço para float.
        'R$ 7,899.99'  → 7899.99
        'R$ 7.899,99'  → 7899.99
        '7899.99'      → 7899.99
        '7.899,99'     → 7899.99
        """
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
            limpo2 = limpo.replace(',', '.')
            return float(limpo2)
        except (ValueError, AttributeError):
            return None