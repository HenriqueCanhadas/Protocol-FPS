"""
Scraper da Terabyteshop — PROTOCOL FPS

A Terabyte renderiza preços via JavaScript (não é SSR puro).
O preço é injetado dinamicamente após o carregamento da página.

Estratégia em camadas (da mais para a menos estável):
  1. JSON-LD  — schema.org/Product (mais estável)
  2. Itemprop — microdata HTML
  3. ID/classe específica da Terabyte
  4. JS evaluation — scan do DOM por padrão R$ X.XXX,XX

Comportamento no CI (GitHub Actions / Azure IP):
  - Terabyte tem bot protection que restringe IPs de datacenter
  - O JS que injeta os preços pode não executar em ambiente bloqueado
  - Sleep adaptativo: 2.5s local → 5.0s CI para dar tempo ao JS
  - Debug logging do título da página para detectar challenge
"""
from __future__ import annotations

import json
import re
import time
import logging

from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto, IS_CI, TIMEOUT_GOTO, TIMEOUT_NETWORK, TIMEOUT_SELETOR

logger = logging.getLogger(__name__)

# Sleep após networkidle — JS de preço precisa de mais tempo no CI
_SLEEP_POS_NETWORK = 5.0 if IS_CI else 2.5

# Seletores específicos da Terabyteshop
SELETORES_PRECO = [
    "#product-price",
    "#priceDe",
    ".prod-new-price",
    ".prod-new-price strong",
    "#buy-price",
    ".buy-price",
    "[itemprop='price']",
    "[itemprop='lowPrice']",
    "strong.prod-new-price",
    "p.prod-new-price",
    "span.prod-new-price",
    "[class*='prod-price']",
    "[class*='product-price']",
    "[class*='price-buy']",
]

SELETOR_NOME = ", ".join([
    "h1.prod-name",
    "h1[class*='prod']",
    "h1[class*='title']",
    "h1[itemprop='name']",
    "h1",
])

SELETOR_ESGOTADO = ", ".join([
    ".prod-esgotado",
    "button:has-text('Indisponível')",
    "button:has-text('Avise-me')",
    "button:has-text('Esgotado')",
    ".btn-esgotado",
    "[class*='esgotado']",
    "[class*='unavailable']",
])


class TerabyteScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Terabyte carrega preços via JS após o DOM.
        No CI o servidor pode ser mais lento para responder a IPs de datacenter.
        """
        # 1. Aguarda o JS terminar (networkidle)
        try:
            page.wait_for_load_state("networkidle", timeout=TIMEOUT_NETWORK)
        except Exception:
            try:
                page.wait_for_load_state("load", timeout=10_000)
            except Exception:
                pass

        # 2. Sleep adaptativo (JS de preço precisa de tempo para injetar o valor)
        logger.debug("[terabyte] aguardando %.1fs para JS de preço...", _SLEEP_POS_NETWORK)
        time.sleep(_SLEEP_POS_NETWORK)

        # 3. Tenta aguardar seletor de preço (melhora confiabilidade)
        for seletor in ["#product-price", ".prod-new-price", "[itemprop='price']"]:
            try:
                page.wait_for_selector(seletor, timeout=TIMEOUT_SELETOR)
                logger.debug("[terabyte] Seletor encontrado: %s", seletor)
                return
            except Exception:
                continue

        logger.warning("[terabyte] Seletor de preço não apareceu após %.1fs", _SLEEP_POS_NETWORK)

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        # Log do título para diagnóstico no CI
        titulo = ""
        try:
            titulo = page.title()
            logger.info("[terabyte] título da página: '%s'", titulo[:80])
        except Exception:
            pass

        # Detecta challenge antes de tentar extrair
        body_snip = ""
        try:
            body_snip = page.evaluate(
                "() => document.body?.innerText?.substring(0, 300) || ''"
            )
        except Exception:
            pass

        if self._detectar_challenge(titulo, page.url, body_snip):
            logger.warning(
                "[terabyte] Challenge/bot protection detectada: título='%s'", titulo
            )
            logger.warning("[terabyte] body snippet: %s", body_snip[:200])
            return DadosProduto(
                nome="Challenge/Bloqueio Terabyte",
                preco=None,
                disponivel=False,
                url=url,
                encontrado=False,
            )

        nome = self._extrair_nome(page)

        # Extração em camadas
        preco = self._extrair_preco_jsonld(page)

        if preco is None:
            preco = self._extrair_preco_itemprop(page)

        if preco is None:
            preco = self._extrair_preco_css(page)

        if preco is None:
            preco = self._extrair_preco_js(page)

        esgotado = self._esta_esgotado(page)

        if preco is None:
            logger.warning("[terabyte] Preço não encontrado: %s", url)
            if IS_CI:
                logger.warning("[terabyte] CI Debug - body snippet: %s", body_snip[:300])
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("[terabyte] preço: R$ %.2f | esgotado: %s", preco, esgotado)
        return DadosProduto(
            nome=nome,
            preco=preco,
            disponivel=not esgotado,
            url=url,
        )

    # ------------------------------------------------------------------
    # Extratores
    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page) -> str:
        # JSON-LD primeiro
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") == "Product":
                        nome = data.get("name", "")
                        if nome:
                            return nome.strip()
                except Exception:
                    continue
        except Exception:
            pass
        # Meta og:title
        try:
            el = page.query_selector("meta[property='og:title']")
            if el:
                nome = (el.get_attribute("content") or "").strip()
                if nome:
                    return nome
        except Exception:
            pass
        # CSS
        try:
            el = page.query_selector(SELETOR_NOME)
            return el.inner_text().strip() if el else "Nome não encontrado"
        except Exception:
            return "Nome não encontrado"

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            return page.query_selector(SELETOR_ESGOTADO) is not None
        except Exception:
            return False

    def _extrair_preco_jsonld(self, page: Page) -> float | None:
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") in ("Product", "product"):
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
        except Exception as exc:
            logger.debug("[terabyte] Erro no JSON-LD: %s", exc)
        return None

    def _extrair_preco_itemprop(self, page: Page) -> float | None:
        """Lê microdata itemprop='price'."""
        for seletor in ["[itemprop='price']", "[itemprop='lowPrice']", "meta[itemprop='price']"]:
            try:
                el = page.query_selector(seletor)
                if not el:
                    continue
                val = el.get_attribute("content")
                if val:
                    v = self._limpar_preco_br(val)
                    if v and v > 50:
                        return v
                texto = el.inner_text()
                v = self._limpar_preco_br(texto)
                if v and v > 50:
                    return v
            except Exception:
                continue
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        for seletor in SELETORES_PRECO:
            try:
                for el in page.query_selector_all(seletor):
                    v = self._limpar_preco_br(el.inner_text())
                    if v and v > 50:
                        return v
                    content = el.get_attribute("content")
                    if content:
                        v = self._limpar_preco_br(content)
                        if v and v > 50:
                            return v
            except Exception:
                continue
        return None

    def _extrair_preco_js(self, page: Page) -> float | None:
        """
        Último recurso: scan do DOM via JS buscando textos 'R$ X.XXX,XX'.
        Pega o menor valor para evitar capturar preço parcelado.
        """
        try:
            valores = page.evaluate("""() => {
                const results = [];
                const walker = document.createTreeWalker(
                    document.body, NodeFilter.SHOW_TEXT
                );
                let node;
                while ((node = walker.nextNode())) {
                    const text = node.textContent.trim();
                    const matches = text.match(/R\\$\\s*([\\d.]+,[\\d]{2})/g) || [];
                    for (const m of matches) results.push(m);
                }
                return [...new Set(results)];
            }""")

            precos = []
            for texto in valores:
                v = self._limpar_preco_br(texto)
                if v and v > 100:
                    precos.append(v)

            return min(precos) if precos else None
        except Exception as exc:
            logger.debug("[terabyte] Erro no JS scan: %s", exc)
            return None

    @staticmethod
    def _limpar_preco_br(texto: str) -> float | None:
        """
        Converte para float (formato BR).
        'R$ 9.999,99' → 9999.99
        """
        if not texto:
            return None
        limpo = re.sub(r'[R$\s\xa0]', '', texto).strip()
        if not limpo:
            return None
        try:
            if re.search(r'\d\.\d{3},\d{2}$', limpo):
                return float(limpo.replace('.', '').replace(',', '.'))
            if re.match(r'^\d+,\d{2}$', limpo):
                return float(limpo.replace(',', '.'))
            return float(limpo.replace(',', ''))
        except (ValueError, AttributeError):
            return None