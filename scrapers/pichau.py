"""
Scraper da Pichau — PROTOCOL FPS

Seletores mapeados do HTML da Pichau (maio/2025):
  - Preço:   span[class*='price'] / [data-cy='product-price']
  - Nome:    h1[class*='product-name'] / h1
  - Esgotado: button:has-text('Indisponível') / div[class*='unavailable']
"""
from __future__ import annotations
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

SELETOR_PRECO    = "[data-cy='product-price'], span[class*='price'], div[class*='product-price']"
SELETOR_NOME     = "h1[class*='product-name'], h1[class*='title'], h1"
SELETOR_ESGOTADO = "button:has-text('Indisponível'), [class*='out-of-stock'], button:has-text('Avise-me')"


class PichauScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_selector(SELETOR_PRECO, timeout=10_000)
        except Exception:
            logger.warning("Seletor de preço Pichau não apareceu")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome     = self._extrair_nome(page)
        esgotado = page.query_selector(SELETOR_ESGOTADO) is not None

        if esgotado:
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        preco = self._extrair_preco(page)
        return DadosProduto(
            nome=nome,
            preco=preco,
            disponivel=preco is not None,
            url=url,
        )

    def _extrair_nome(self, page: Page) -> str:
        try:
            el = page.query_selector(SELETOR_NOME)
            return el.inner_text().strip() if el else "Nome não encontrado"
        except Exception:
            return "Nome não encontrado"

    def _extrair_preco(self, page: Page) -> float | None:
        try:
            elementos = page.query_selector_all(SELETOR_PRECO)
            precos = []
            for el in elementos:
                texto = el.inner_text()
                valor = self._limpar_preco(texto)
                if valor and valor > 10:
                    precos.append(valor)
            return min(precos) if precos else None
        except Exception as exc:
            logger.debug("Erro ao extrair preço Pichau: %s", exc)
            return None