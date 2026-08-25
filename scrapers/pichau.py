"""
Scraper da Pichau — PROTOCOL FPS

Estrutura confirmada (junho/2025):
  - Next.js com SSR → meta tags chegam no HTML inicial
  - Meta tag: <meta property="product:price:amount" content="R$ 7,899.99">
  - Meta tag: <meta name="twitter:data1" content="R$ 7,899.99">
  - Meta tag: <meta property="product:availability" content="instock">
  - JSON-LD: schema.org/Product com offers.price

Comportamento no CI (GitHub Actions / Azure IP):
  - Cloudflare/bot protection pode interceptar e retornar uma challenge page
  - NÃO fazemos HTTP fallback (sempre dá 403 em datacenter)
  - Detectamos challenge pelo título da página e tentamos aguardar/retry
  - O stealth do base.py ajuda a passar pelo bot protection
"""
from __future__ import annotations

import json
import re
import time
import logging

from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto, IS_CI, TIMEOUT_GOTO, TIMEOUT_NETWORK

logger = logging.getLogger(__name__)

# Sleep após carregamento — maior no CI (Cloudflare challenge leva até 5s)
_SLEEP_POS_LOAD = 5.0 if IS_CI else 1.5

# Retry no CI quando challenge/bloqueio é detectado
# (a Pichau devolve página falsa de "manutenção" para IPs de datacenter;
#  às vezes libera após alguns segundos — vale tentar mais vezes no CI)
_MAX_TENTATIVAS = 3 if IS_CI else 1

# Seletor de disponibilidade
SELETOR_ESGOTADO = ", ".join([
    "button:has-text('Indisponível')",
    "button:has-text('Avise-me')",
    "button:has-text('Esgotado')",
    "[class*='unavailable']",
    "[class*='out-of-stock']",
])


class PichauScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Pichau usa Next.js SSR — as meta tags chegam cedo.
        Aguarda o DOM e depois um sleep fixo para garantir que
        eventuais challenges do Cloudflare tenham tempo de resolver.
        """
        # Aguarda DOM pronto
        try:
            page.wait_for_load_state("domcontentloaded", timeout=TIMEOUT_NETWORK)
        except Exception:
            pass

        # Aguarda a meta tag de preço (confirmação de que é a página do produto)
        # Se for uma challenge page, esse seletor não vai aparecer
        meta_apareceu = False
        try:
            page.wait_for_selector(
                "meta[property='product:price:amount'], meta[name='twitter:data1']",
                timeout=8_000,
            )
            meta_apareceu = True
        except Exception:
            logger.warning("[pichau] Meta tag de preço não apareceu em 8s")

        if not meta_apareceu and IS_CI:
            # Possível challenge — aguarda mais para Cloudflare resolver
            logger.info("[pichau] CI: aguardando %ss (possível challenge)...", _SLEEP_POS_LOAD)
            time.sleep(_SLEEP_POS_LOAD)
        else:
            time.sleep(_SLEEP_POS_LOAD)

    def coletar(self, url: str) -> DadosProduto:
        """
        Override do coletar do base para suportar retry quando challenge detectada.
        """
        from playwright.sync_api import sync_playwright
        from .base import _STEALTH, _BROWSER_ARGS

        for tentativa in range(1, _MAX_TENTATIVAS + 1):
            if tentativa > 1:
                # Delay crescente: 10s, 20s... dá tempo do rate-limit/bloqueio expirar
                espera = 10.0 * (tentativa - 1)
                logger.info(
                    "[pichau] Tentativa %d/%d para %s (aguardando %.0fs)",
                    tentativa, _MAX_TENTATIVAS, url, espera,
                )
                time.sleep(espera)

            try:
                with _STEALTH.use_sync(sync_playwright()) as pw:
                    browser = pw.chromium.launch(
                        headless=self.headless,
                        args=_BROWSER_ARGS,
                    )
                    ctx  = self._criar_contexto(browser)
                    page = ctx.new_page()
                    self._bloquear_midias(page)

                    try:
                        page.goto(url, wait_until="domcontentloaded", timeout=TIMEOUT_GOTO)
                        self._aguardar_preco(page)

                        # Verifica se recebemos uma challenge page
                        titulo = ""
                        try:
                            titulo = page.title()
                        except Exception:
                            pass

                        url_real  = page.url
                        body_snip = ""
                        try:
                            body_snip = page.evaluate(
                                "() => document.body?.innerText?.substring(0, 300) || ''"
                            )
                        except Exception:
                            pass

                        eh_challenge = self._detectar_challenge(titulo, url_real, body_snip)

                        if eh_challenge:
                            logger.warning(
                                "[pichau] Challenge detectada (tentativa %d/%d): título='%s'",
                                tentativa, _MAX_TENTATIVAS, titulo
                            )
                            logger.warning("[pichau] body snippet: %s", body_snip[:200])
                            if tentativa < _MAX_TENTATIVAS:
                                continue  # tenta de novo
                            # Última tentativa — retorna sem dados
                            return DadosProduto(
                                nome="Challenge/Bloqueio Pichau",
                                preco=None,
                                disponivel=False,
                                url=url,
                                encontrado=False,
                            )

                        logger.info("[pichau] Página carregada: '%s'", titulo[:60])
                        return self.extrair_dados(page, url)

                    except Exception as exc:
                        logger.error("[pichau] Erro na tentativa %d: %s", tentativa, exc)
                        try:
                            self._debug_page(page, url, forcado=True)
                        except Exception:
                            pass
                        if tentativa >= _MAX_TENTATIVAS:
                            return DadosProduto(
                                nome="Erro ao coletar",
                                preco=None,
                                disponivel=False,
                                url=url,
                                encontrado=False,
                            )
                    finally:
                        browser.close()

            except Exception as exc:
                logger.error("[pichau] Erro ao inicializar browser (tentativa %d): %s", tentativa, exc)
                if tentativa >= _MAX_TENTATIVAS:
                    return DadosProduto(
                        nome="Erro ao coletar",
                        preco=None,
                        disponivel=False,
                        url=url,
                        encontrado=False,
                    )

        # Não deve chegar aqui
        return DadosProduto(nome="Erro ao coletar", preco=None, disponivel=False, url=url, encontrado=False)

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
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
            logger.warning("[pichau] Preço não encontrado: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("[pichau] preço: R$ %.2f | disponível: %s", preco, disponivel)
        return DadosProduto(nome=nome, preco=preco, disponivel=disponivel, url=url)

    # ------------------------------------------------------------------
    # Extratores
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
            logger.debug("[pichau] Erro ao ler meta %s: %s", seletor, exc)
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
            "span[class*='pix']",
            "div[class*='pix']",
            "[class*='finalPrice']",
            "[class*='productPrice']",
            "span[class*='price']",
            "div[class*='price']",
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
                logger.debug("[pichau] Erro no JS scan: %s", exc)

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
        Normaliza diferentes formatos:
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
            return float(limpo.replace(',', '.'))
        except (ValueError, AttributeError):
            return None