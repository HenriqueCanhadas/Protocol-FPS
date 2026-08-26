"""
Scraper da Playstation Store — PROTOCOL FPS (Sprint 29, todo:214)
store.playstation.com — SPA Next.js/React pesada.

Estrutura confirmada inspecionando a página real (produto de teste, jogo em
pré-venda):
  - JSON-LD único (`Product`, sem lista) com offers.price/priceCurrency —
    NÃO traz `availability` (loja digital: o conceito de "esgotado" não
    existe como em hardware físico; o que existe é disponibilidade
    regional/remoção de catálogo).
  - Sem meta tags og:price/product:price (confirmado vazio).
  - Preço também aparece via `[data-qa="mfeCtaMain#offer0#finalPrice"]`
    (idêntico ao JSON-LD) — CUIDADO: a página lista preços de OUTRAS edições
    do mesmo produto em `[data-qa="mfeUpsell#..."]`; usar só o `mfeCtaMain`
    (produto principal), nunca os `mfeUpsell` (edições alternativas).
  - Botão principal de compra: `[data-qa="mfeCtaMain#cta#action"]`
    (ex.: "Comprar na pré-venda"). Ausência do botão OU texto indicando
    indisponibilidade é o proxy de "esgotado" usado aqui.

Não validado ainda se bloqueia IP de datacenter no CI (ver skill
`scraper-nova-loja`, seção 4) — pendente de rodar no GitHub Actions.
"""
from __future__ import annotations
import json
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

SELETOR_PRECO_PRINCIPAL = "[data-qa='mfeCtaMain#offer0#finalPrice']"
SELETOR_CTA_PRINCIPAL   = "[data-qa='mfeCtaMain#cta#action']"
SELETOR_NOME = "h1"

_INDISPONIVEL_KW = ("indispon", "não disponível", "unavailable", "avise-me", "fora do ar")


class PlaystationScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        try:
            page.wait_for_selector(
                f"{SELETOR_PRECO_PRINCIPAL}, script[type='application/ld+json']",
                timeout=10_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu na Playstation Store — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome, preco = self._extrair_jsonld(page)

        if nome is None:
            nome = self._extrair_nome_fallback(page)
        if preco is None:
            preco = self._extrair_preco_css(page)
        if preco is None:
            preco = self._extrair_preco_js(page)

        esgotado = self._esta_esgotado(page)

        if esgotado:
            logger.info("Produto indisponível na Playstation Store: %s", nome)
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na Playstation Store: %s", url)
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado na Playstation Store: R$ %.2f", preco)
        return DadosProduto(nome=nome or "Nome não encontrado", preco=preco, disponivel=True, url=url)

    # ------------------------------------------------------------------

    def _extrair_jsonld(self, page: Page) -> tuple[str | None, float | None]:
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") != "Product":
                        continue
                    nome = data.get("name")
                    offers = data.get("offers") or {}
                    if isinstance(offers, list):
                        offers = offers[0] if offers else {}
                    preco = offers.get("price")
                    if preco is not None:
                        preco = float(str(preco).replace(",", "."))
                    return nome, preco
                except Exception:
                    continue
        except Exception as exc:
            logger.debug("Erro no JSON-LD da Playstation Store: %s", exc)
        return None, None

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
            el = page.query_selector(SELETOR_PRECO_PRINCIPAL)
            if el:
                return self._limpar_preco(el.inner_text())
        except Exception:
            pass
        return None

    def _extrair_preco_js(self, page: Page) -> float | None:
        try:
            precos_texto = page.evaluate("""() => {
                const el = document.querySelector("[data-qa='mfeCtaMain#offer0#finalPrice']");
                return el ? [el.innerText] : [];
            }""")
            for texto in precos_texto:
                valor = self._limpar_preco(texto)
                if valor and valor > 0:
                    return valor
        except Exception as exc:
            logger.debug("Erro no fallback JS da Playstation Store: %s", exc)
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            el = page.query_selector(SELETOR_CTA_PRINCIPAL)
            if not el:
                return True
            texto = (el.inner_text() or "").lower()
            return any(kw in texto for kw in _INDISPONIVEL_KW)
        except Exception:
            return False
