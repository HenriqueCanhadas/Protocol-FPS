"""
Scraper da Amazon BR — PROTOCOL FPS (Sprint 29, todo:214)
amazon.com.br

**Risco conhecido, já confirmado nesta sprint**: ao inspecionar a página de
teste manualmente (navegador real, sessão comum) para desenhar este
scraper, a Amazon já respondeu com a interstitial anti-bot "Clique no
botão abaixo para continuar comprando" — ou seja, o bloqueio acontece
**mesmo fora de um IP de datacenter/automação**, antes de qualquer teste
com Playwright. Não tentamos clicar/contornar essa interstitial (bypass de
bot-detection está fora do escopo permitido) — os seletores abaixo são
baseados na estrutura pública e estável da Amazon (não confirmados ao vivo
nesta sprint, ver `project/sprint_v4.md`).

Estrutura conhecida (Amazon não expõe JSON-LD de Product de forma
confiável no BR — a ordem abaixo ainda começa por JSON-LD por consistência
com o padrão do projeto, mas a extração real depende de meta/CSS):
  - Nome: `#productTitle`
  - Preço: `.a-price .a-offscreen` (texto acessível oculto, ex. "R$ 123,45");
    fallback `#corePriceDisplay_desktop_feature_div .a-price .a-offscreen`
  - Disponibilidade: `#availability span` — "Em estoque" vs "indisponível"/
    "não disponível"

Seguindo o precedente da Pichau (skill `scraper-nova-loja`): se a Amazon
confirmar bloqueio sistemático de datacenter no CI (3 runs), a decisão
esperada é a mesma — aceitar coleta só local, sem fallback HTTP nem
técnicas mais agressivas de bypass.
"""
from __future__ import annotations
import json
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

# NUNCA combine estes seletores num único `query_selector("a, b, c")` — a
# página da Amazon tem DEZENAS de outros preços (produtos relacionados,
# "compre junto", combos) espalhados pelo DOM; um seletor combinado pega o
# primeiro em ORDEM NO DOM entre a união de todos, não o mais específico
# primeiro. Testar cada seletor em sequência (mais específico → mais amplo)
# e parar no primeiro que casar, cada um isoladamente.
SELETORES_PRECO = [
    "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
    "#apex_desktop .a-price .a-offscreen",
    "#corePrice_feature_div .a-price .a-offscreen",
]
SELETOR_NOME = "#productTitle"
SELETOR_DISPONIBILIDADE = "#availability span, #availability"

_INDISPONIVEL_KW = ("indispon", "não disponível", "atualmente indispon", "esgotado", "fora de estoque")


class AmazonScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        try:
            page.wait_for_selector(
                f"{', '.join(SELETORES_PRECO)}, {SELETOR_NOME}, script[type='application/ld+json']",
                timeout=10_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu na Amazon — possível bloqueio/interstitial anti-bot")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        titulo = ""
        try:
            titulo = page.title()
        except Exception:
            pass
        body_snip = ""
        try:
            body_snip = page.evaluate("() => document.body?.innerText?.substring(0, 300) || ''")
        except Exception:
            pass

        if self._detectar_challenge(titulo, page.url, body_snip) or "continuar comprando" in body_snip.lower():
            logger.warning("[amazon] Challenge/interstitial anti-bot detectada: título='%s'", titulo)
            logger.warning("[amazon] body snippet: %s", body_snip[:200])
            return DadosProduto(nome="Challenge/Bloqueio Amazon", preco=None, disponivel=False, url=url)

        nome = self._extrair_nome(page)
        preco = self._extrair_preco_jsonld(page)
        if preco is None:
            preco = self._extrair_preco_css(page)

        esgotado = self._esta_esgotado(page)

        if esgotado:
            logger.info("Produto esgotado na Amazon: %s", nome)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na Amazon: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        logger.info("Preço encontrado na Amazon: R$ %.2f", preco)
        return DadosProduto(nome=nome, preco=preco, disponivel=True, url=url)

    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page) -> str:
        try:
            el = page.query_selector(SELETOR_NOME)
            if el:
                texto = el.inner_text().strip()
                if texto:
                    return texto
        except Exception:
            pass
        return "Nome não encontrado"

    def _extrair_preco_jsonld(self, page: Page) -> float | None:
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") not in ("Product", "product"):
                        continue
                    offers = data.get("offers") or {}
                    if isinstance(offers, list):
                        offers = offers[0] if offers else {}
                    preco = offers.get("price")
                    if preco:
                        valor = float(str(preco).replace(",", "."))
                        if valor > 0:
                            return valor
                except Exception:
                    continue
        except Exception:
            pass
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        # Cada seletor é tentado ISOLADO, na ordem — nunca combinado num só
        # query_selector (ver comentário em SELETORES_PRECO).
        for seletor in SELETORES_PRECO:
            try:
                el = page.query_selector(seletor)
                if el:
                    valor = self._limpar_preco(el.inner_text() or el.text_content() or "")
                    if valor and valor > 0:
                        return valor
            except Exception:
                continue
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            el = page.query_selector(SELETOR_DISPONIBILIDADE)
            if el:
                texto = (el.inner_text() or "").lower()
                if any(kw in texto for kw in _INDISPONIVEL_KW):
                    return True
                if texto.strip():
                    return False  # tem texto de disponibilidade e não bateu keyword de indisponível
        except Exception:
            pass
        return False
