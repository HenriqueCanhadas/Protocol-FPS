"""
Scraper da Terabyteshop — PROTOCOL FPS

A Terabyte renderiza preços via JavaScript (não é SSR puro).
O preço é injetado dinamicamente após o carregamento da página.

Estratégia em camadas (da mais para a menos estável):
  1. JSON-LD  — schema.org/Product (mais estável)
  2. Itemprop — microdata HTML (segundo mais estável)
  3. ID/classe específica da Terabyte (frágil mas necessário como fallback)
  4. JS evaluation — scan do DOM por padrão R$ X.XXX,XX

v2 (junho/2026):
  - Timeout networkidle aumentado para 30s em CI (era 20s)
  - Retry automático de wait_for_selector com 3 seletores prioritários
  - Delay explícito de 2s após networkidle para JS de preço terminar de injetar
  - ScraperBase com stealth já aplicado antes de _aguardar_preco
"""
from __future__ import annotations
import json
import re
import logging
import time
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto, TIMEOUT_NETWORKIDLE, TIMEOUT_SELECTOR

logger = logging.getLogger(__name__)

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
    "button:has-text('INDISPONÍVEL')",
    "button:has-text('ESGOTADO')",
    ".btn-esgotado",
    "[class*='esgotado']",
    "[class*='unavailable']",
])

# Seletores de preço mais prováveis para o wait inicial
_WAIT_SELECTORS = [
    "#product-price",
    ".prod-new-price",
    "[itemprop='price']",
    "script[type='application/ld+json']",
]


class TerabyteScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Terabyte carrega preços via JS após o DOM.
        Em GitHub Actions (datacenter), o JS demora mais para executar.
        Estratégia: networkidle + wait_for_selector + delay de segurança.
        """
        # 1. Aguarda JS terminar completamente
        try:
            page.wait_for_load_state("networkidle", timeout=TIMEOUT_NETWORKIDLE)
        except Exception:
            try:
                page.wait_for_load_state("load", timeout=15_000)
            except Exception:
                pass

        # 2. Tenta aguardar um seletor de preço conhecido
        achou = False
        for seletor in _WAIT_SELECTORS:
            try:
                page.wait_for_selector(seletor, timeout=TIMEOUT_SELECTOR)
                logger.debug("Seletor de preço Terabyte encontrado: %s", seletor)
                achou = True
                break
            except Exception:
                continue

        if not achou:
            logger.warning("Seletor de preço Terabyte não apareceu")

        # 3. Delay de segurança — garante que o JS de preço terminou de injetar
        #    Especialmente importante em CI onde o JS executa mais devagar
        time.sleep(2.5)

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome = self._extrair_nome(page)

        # 1. JSON-LD (mais estável)
        preco = self._extrair_preco_jsonld(page)

        # 2. Itemprop microdata
        if preco is None:
            preco = self._extrair_preco_itemprop(page)

        # 3. Seletores CSS específicos da Terabyte
        if preco is None:
            preco = self._extrair_preco_css(page)

        # 4. JS scan — último recurso
        if preco is None:
            preco = self._extrair_preco_js(page)

        esgotado = self._esta_esgotado(page)

        if preco is None:
            logger.warning("Preço não encontrado na Terabyte: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        logger.info("Terabyte — preço: R$ %.2f | esgotado: %s", preco, esgotado)
        return DadosProduto(
            nome=nome,
            preco=preco,
            disponivel=not esgotado,
            url=url,
        )

    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page) -> str:
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
            logger.debug("Erro no JSON-LD Terabyte: %s", exc)
        return None

    def _extrair_preco_itemprop(self, page: Page) -> float | None:
        seletores = [
            "[itemprop='price']",
            "[itemprop='lowPrice']",
            "meta[itemprop='price']",
        ]
        for seletor in seletores:
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
                elementos = page.query_selector_all(seletor)
                for el in elementos:
                    texto = el.inner_text()
                    v = self._limpar_preco_br(texto)
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
        Último recurso: avalia o DOM via JS buscando textos 'R$ X.XXX,XX'.
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
            logger.debug("Erro no JS scan Terabyte: %s", exc)
            return None

    @staticmethod
    def _limpar_preco_br(texto: str) -> float | None:
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