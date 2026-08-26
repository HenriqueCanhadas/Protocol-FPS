"""
Scraper da AliExpress — PROTOCOL FPS (Sprint 47, todo:249)
pt.aliexpress.com

Estrutura confirmada ao vivo (inspeção manual da URL de teste, 25/08/2026):
JSON-LD `Product` completo e limpo — `offers.price` ("29.56"),
`offers.priceCurrency` ("BRL", conferido batendo com o preço visível na
página, R$29,56) e `offers.availability` ("https://schema.org/InStock").
Segue o mesmo molde da Kabum (skill `scraper-nova-loja`, seção 3): JSON-LD
estável, sem tratamento especial de retry/challenge. Diferente da Kabum, a
AliExpress NÃO expõe meta tags `og:price:*`/`product:price:*` (confirmado
ausentes na página de teste) — o segundo nível de fallback pula direto
para CSS.

- Nome: JSON-LD `name` (inclui o sufixo "- AliExpress <id>", igual ao
  `og:title` — mantido como está, é o título real da página). Fallback:
  meta `og:title`; último recurso: primeiro `<h1>` cujo texto não seja
  apenas "Aliexpress" (o site tem um `<h1>` de cabeçalho/logo antes do
  título do produto).
- Preço: JSON-LD `offers.price`. Fallback CSS: classe ofuscada do build
  React da AliExpress (`price-default--current--<hash>`, o hash muda a
  cada deploy — por isso o seletor usa `[class*=]` sem o hash) e
  varredura de texto via JS como último recurso (mesmo padrão da Kabum).
- Disponibilidade: `offers.availability` contra o mesmo conjunto de
  valores schema.org já usado nos outros scrapers do projeto. **Não
  confirmado ao vivo** — a URL de teste está em estoque, então o caminho
  esgotado não foi observado na prática. Seguindo o precedente já
  documentado na Amazon (`scrapers/amazon.py`): mantém como segunda camada
  uma varredura por palavras-chave (as mesmas já usadas no projeto:
  "esgotado"/"indisponível"/"fora de estoque"), sem alegar teste ao vivo
  desse caminho.
- Moeda: a URL de teste usa `pt.aliexpress.com` com `gatewayAdapt=glo2bra`,
  que força o contexto BRL — confirmado `offers.priceCurrency == "BRL"`.
  Se algum dia vier em outra moeda, loga um aviso mas ainda retorna o
  valor numérico (mesmo comportamento dos demais scrapers: nenhum faz
  conversão de câmbio).
"""
from __future__ import annotations
import json
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

# Mesmo conjunto de valores schema.org usado nos demais scrapers do projeto.
_AVAILABILITY_ESGOTADO = {
    "https://schema.org/outofstock", "http://schema.org/outofstock",
    "outofstock", "out of stock",
    "https://schema.org/soldout", "http://schema.org/soldout",
    "soldout", "sold out",
    "https://schema.org/discontinued", "http://schema.org/discontinued",
}

SELETOR_PRECO = "[class*='price-default--current']"

_INDISPONIVEL_KW = (
    "esgotado", "indisponível", "indisponivel", "fora de estoque",
    "sold out", "out of stock",
)


class AliExpressScraper(ScraperBase):

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
            logger.warning("Seletor de preço não apareceu na AliExpress — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome, preco, disponivel_jsonld = self._extrair_jsonld(page)

        if nome is None:
            nome = self._extrair_nome_fallback(page)

        if preco is None:
            preco = self._extrair_preco_css(page)

        esgotado_dom = self._esta_esgotado(page)
        # disponivel_jsonld é None quando o JSON-LD não deu veredito
        # (produto/offers ausentes) — nesse caso o DOM decide sozinho.
        esgotado = esgotado_dom or (disponivel_jsonld is False)

        if esgotado:
            logger.info(
                "Produto esgotado na AliExpress [jsonld_disponivel=%s, dom_esgotado=%s]: %s",
                disponivel_jsonld, esgotado_dom, nome
            )
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na AliExpress: %s", url)
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado na AliExpress: R$ %.2f", preco)
        return DadosProduto(nome=nome or "Nome não encontrado", preco=preco, disponivel=True, url=url)

    # ------------------------------------------------------------------
    # Extratores internos
    # ------------------------------------------------------------------

    def _extrair_jsonld(self, page: Page) -> tuple[str | None, float | None, bool | None]:
        """
        Retorna (nome, preco, disponivel). disponivel=None quando o
        JSON-LD não deu veredito nenhum (deixa o DOM decidir sozinho).
        """
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

                    preco = None
                    price = offers.get("price")
                    if price:
                        try:
                            valor = float(str(price).replace(",", "."))
                            if valor > 0:
                                preco = valor
                        except (ValueError, TypeError):
                            pass

                    moeda = (offers.get("priceCurrency") or "").upper()
                    if preco is not None and moeda and moeda != "BRL":
                        logger.warning(
                            "Preço da AliExpress veio em moeda inesperada (%s), não BRL", moeda
                        )

                    availability = (offers.get("availability") or "").lower().strip()
                    disponivel = None if not availability else availability not in _AVAILABILITY_ESGOTADO

                    return nome, preco, disponivel
                except Exception:
                    continue
        except Exception as exc:
            logger.debug("Erro no JSON-LD da AliExpress: %s", exc)

        return None, None, None

    def _extrair_nome_fallback(self, page: Page) -> str | None:
        try:
            el = page.query_selector("meta[property='og:title']")
            if el:
                val = (el.get_attribute("content") or "").strip()
                if val:
                    return val
        except Exception:
            pass
        try:
            candidatos = page.query_selector_all("h1")
            for el in candidatos:
                texto = (el.inner_text() or "").strip()
                if texto and texto.lower() != "aliexpress":
                    return texto
        except Exception:
            pass
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            texto_pagina = page.evaluate("() => document.body.innerText.toLowerCase()")
            for kw in _INDISPONIVEL_KW:
                if kw in texto_pagina:
                    logger.debug("Esgotamento detectado por keyword na AliExpress: '%s'", kw)
                    return True
        except Exception:
            pass
        return False

    def _extrair_preco_css(self, page: Page) -> float | None:
        try:
            el = page.query_selector(SELETOR_PRECO)
            if el:
                valor = self._limpar_preco(el.inner_text())
                if valor and valor > 0:
                    return valor
        except Exception:
            pass

        # Último recurso: varredura de texto via JS (mesmo padrão da Kabum)
        try:
            precos_texto = page.evaluate("""() => {
                const els = document.querySelectorAll('span, div');
                const prices = [];
                for (const el of els) {
                    const text = el.innerText || '';
                    const match = text.match(/R\\$\\s*([\\d.]+,[\\d]{2})/);
                    if (match) prices.push(match[0]);
                }
                return prices.slice(0, 10);
            }""")
            precos = []
            for texto in precos_texto:
                valor = self._limpar_preco(texto)
                if valor and valor > 0:
                    precos.append(valor)
            return min(precos) if precos else None
        except Exception as exc:
            logger.debug("Erro no fallback JS da AliExpress: %s", exc)
            return None
