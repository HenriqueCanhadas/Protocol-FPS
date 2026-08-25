"""
Scraper da Tangle Teezer BR — PROTOCOL FPS (Sprint 29, todo:214)
tangleteezer.com.br — plataforma VTEX (confirmado por classes
`vtex-product-price-*`/`vtex-store-components-*` e URL `/p` no padrão VTEX).

Mesma particularidade da Tuyo (também "múltiplas variantes com preço/
disponibilidade próprios"), mas resolvida de um jeito mais simples: aqui o
`Product` raiz do JSON-LD já tem `sku` da variante selecionada — não
precisa casar por query string da URL como na Tuyo, só achar dentro de
`offers.offers[]` o item cujo `sku` bate com o `sku` do produto raiz.

Estrutura confirmada:
  - JSON-LD `Product` com `sku` da variante atual + `offers` do tipo
    `AggregateOffer` (`lowPrice`/`highPrice` do grupo todo) contendo
    `offers.offers[]`, uma entrada por variante com `sku`/`price`/
    `availability` (schema.org, mesmos valores usados no `_AVAILABILITY_
    ESGOTADO` da Kabum/Tuyo).
  - Sem meta tags de preço.
  - CSS: preço em `[class*='vtex-product-price-1-x-sellingPrice']`; nome
    em `h1`; botão de compra visto disponível diz "COMPRAR".
"""
from __future__ import annotations
import json
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

_AVAILABILITY_ESGOTADO = {
    "https://schema.org/outofstock", "http://schema.org/outofstock",
    "outofstock", "out of stock",
    "https://schema.org/soldout", "http://schema.org/soldout",
    "soldout", "sold out",
}

SELETOR_PRECO = "[class*='vtex-product-price-1-x-sellingPrice']"
SELETOR_NOME  = "h1"


class TangleteezerScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        try:
            page.wait_for_selector(
                f"{SELETOR_PRECO}, script[type='application/ld+json']",
                timeout=10_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu na Tangle Teezer — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome, preco, disponivel_jsonld = self._extrair_jsonld(page)

        if nome is None:
            nome = self._extrair_nome_fallback(page)
        if preco is None:
            preco = self._extrair_preco_css(page)

        esgotado_dom = self._esta_esgotado(page)
        esgotado = esgotado_dom or (disponivel_jsonld is False)

        if esgotado:
            logger.info(
                "Produto esgotado na Tangle Teezer [jsonld_disponivel=%s, dom_esgotado=%s]: %s",
                disponivel_jsonld, esgotado_dom, nome
            )
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na Tangle Teezer: %s", url)
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado na Tangle Teezer: R$ %.2f", preco)
        return DadosProduto(nome=nome or "Nome não encontrado", preco=preco, disponivel=True, url=url)

    # ------------------------------------------------------------------

    def _extrair_jsonld(self, page: Page) -> tuple[str | None, float | None, bool | None]:
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") != "Product":
                        continue

                    sku_atual = data.get("sku")
                    offers = data.get("offers") or {}
                    variantes = offers.get("offers") or []

                    alvo = None
                    if sku_atual:
                        for v in variantes:
                            if str(v.get("sku")) == str(sku_atual):
                                alvo = v
                                break
                    if alvo is None and variantes:
                        alvo = variantes[0]

                    if alvo:
                        preco = alvo.get("price")
                        preco = float(str(preco).replace(",", ".")) if preco else None
                        availability = (alvo.get("availability") or "").lower().strip()
                        disponivel = None if not availability else availability not in _AVAILABILITY_ESGOTADO
                        return data.get("name"), preco, disponivel

                    # Sem AggregateOffer/variantes — Product simples
                    if "price" in offers:
                        preco = float(str(offers["price"]).replace(",", "."))
                        availability = (offers.get("availability") or "").lower().strip()
                        disponivel = None if not availability else availability not in _AVAILABILITY_ESGOTADO
                        return data.get("name"), preco, disponivel

                except Exception:
                    continue
        except Exception as exc:
            logger.debug("Erro no JSON-LD da Tangle Teezer: %s", exc)
        return None, None, None

    def _extrair_nome_fallback(self, page: Page) -> str | None:
        try:
            el = page.query_selector(SELETOR_NOME)
            if el:
                texto = el.inner_text().strip()
                if texto:
                    return texto
        except Exception:
            pass
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        try:
            el = page.query_selector(SELETOR_PRECO)
            if el:
                valor = self._limpar_preco(el.inner_text())
                if valor and valor > 0:
                    return valor
        except Exception:
            pass
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            texto_pagina = page.evaluate("() => document.body.innerText.toLowerCase()")
            for kw in ("produto indisponível", "avise-me quando chegar", "esgotado", "fora de estoque"):
                if kw in texto_pagina:
                    return True
        except Exception:
            pass
        return False
