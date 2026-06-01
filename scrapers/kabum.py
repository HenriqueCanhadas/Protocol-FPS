"""
Scraper da Kabum — PROTOCOL FPS
Herda ScraperBase e implementa a lógica específica do site.

Seletores mapeados inspecionando o HTML da Kabum (maio/2025):
  - Preço principal: span.sc-d79c9b50-0  (classe gerada, pode mudar)
  - Fallback XPath:  //*[@data-smash-price] ou meta og:price
  - Nome:            h1.sc-58cc7d99-0
  - Indisponível:    botão com texto "Avise-me" ou "Esgotado"
"""
from __future__ import annotations
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

# Seletores CSS — atualize aqui se a Kabum mudar o HTML
SELETOR_PRECO_PRINCIPAL = "h4.sc-d79c9b50-0, span[class*='priceCard'], h4[class*='price']"
SELETOR_PRECO_FALLBACK  = "meta[property='product:price:amount']"
SELETOR_NOME            = "h1[class*='product-title'], h1[itemprop='name'], h1"
SELETOR_ESGOTADO        = "button[class*='unavailable'], button:has-text('Avise-me'), button:has-text('Esgotado')"


class KabumScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Tenta aguardar o seletor de preço por até 10 s.
        Se não encontrar, segue em frente — pode estar esgotado.
        """
        try:
            page.wait_for_selector(SELETOR_PRECO_PRINCIPAL, timeout=10_000)
        except Exception:
            logger.warning("Seletor de preço não apareceu — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        # 1. Nome do produto
        nome = self._extrair_nome(page)

        # 2. Verifica esgotamento antes de tentar pegar preço
        esgotado = self._esta_esgotado(page)
        if esgotado:
            logger.info("Produto esgotado na Kabum: %s", nome)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        # 3. Preço — tenta seletor principal, cai no meta tag como fallback
        preco = self._extrair_preco_principal(page)
        if preco is None:
            preco = self._extrair_preco_meta(page)

        if preco is None:
            logger.warning("Preço não encontrado: %s", url)

        return DadosProduto(
            nome=nome,
            preco=preco,
            disponivel=preco is not None,
            url=url,
        )

    # ------------------------------------------------------------------
    # Extratores internos
    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page) -> str:
        try:
            el = page.query_selector(SELETOR_NOME)
            return el.inner_text().strip() if el else "Nome não encontrado"
        except Exception as exc:
            logger.debug("Erro ao extrair nome: %s", exc)
            return "Nome não encontrado"

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            el = page.query_selector(SELETOR_ESGOTADO)
            return el is not None
        except Exception:
            return False

    def _extrair_preco_principal(self, page: Page) -> float | None:
        """
        Percorre todos os candidatos CSS e devolve o menor valor
        numérico encontrado (evita pegar preço parcelado maior).
        """
        try:
            elementos = page.query_selector_all(SELETOR_PRECO_PRINCIPAL)
            precos = []
            for el in elementos:
                texto = el.inner_text()
                if "R$" in texto or any(c.isdigit() for c in texto):
                    valor = self._limpar_preco(texto)
                    if valor and valor > 0:
                        precos.append(valor)
            return min(precos) if precos else None
        except Exception as exc:
            logger.debug("Erro no seletor principal: %s", exc)
            return None

    def _extrair_preco_meta(self, page: Page) -> float | None:
        """Fallback: lê a meta tag og:price:amount — mais estável que o CSS."""
        try:
            el = page.query_selector(SELETOR_PRECO_FALLBACK)
            if el:
                conteudo = el.get_attribute("content")
                return float(conteudo.replace(",", ".")) if conteudo else None
        except Exception as exc:
            logger.debug("Erro no fallback meta: %s", exc)
        return None