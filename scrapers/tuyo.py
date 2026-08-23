"""
Scraper da Tuyo — PROTOCOL FPS (Sprint 29, todo:214)
Loja Shopify (tuyo.com.br). Herda ScraperBase e implementa a lógica específica.

Particularidade da Tuyo vs. Kabum/Terabyte/Pichau: o produto é um
ProductGroup (schema.org) com várias variantes (cor/tamanho) em
`hasVariant`, cada uma com seu próprio preço/disponibilidade — a URL
identifica a variante via `?variant=<id>` na query string. Sem isso,
pegar "o primeiro preço da página" pode pegar a variante errada (preços
observados variam bastante entre variantes do mesmo produto).

Estratégia em camadas (padrão do projeto — mais estável primeiro):
  1. JSON-LD ProductGroup.hasVariant — casa pelo id da variante na URL;
     dá nome (com a variante), preço E disponibilidade de uma vez.
     Fallback dentro do próprio JSON-LD: Product simples com offers direto
     (produto sem variantes).
  2. Meta tags (og:price:amount / og:title) — não têm disponibilidade,
     só preço/nome do grupo.
  3. Seletores CSS do tema (.product__price--regular, .product__title).
  4. Varredura de texto completo via JS.

Disponibilidade decidida ANTES do preço, combinando o availability do
JSON-LD com o botão "ESGOTADO" do DOM (confirmado ao vivo: o texto do
botão de compra é literalmente "ESGOTADO" quando a variante selecionada
está fora de estoque).
"""
from __future__ import annotations
import json
import re
import logging
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

# Mesmo conjunto de valores schema.org usado no scraper da Kabum.
_AVAILABILITY_ESGOTADO = {
    "https://schema.org/outofstock", "http://schema.org/outofstock",
    "outofstock", "out of stock",
    "https://schema.org/soldout", "http://schema.org/soldout",
    "soldout", "sold out",
    "https://schema.org/discontinued", "http://schema.org/discontinued",
}

SELETOR_ESGOTADO = ", ".join([
    "button:has-text('ESGOTADO')",
    "button:has-text('Esgotado')",
    "button:has-text('Avise-me')",
    "button:has-text('AVISE-ME')",
    "button[disabled]:has-text('ESGOTADO')",
])

SELETOR_PRECO = ", ".join([
    ".product__price--regular",
    ".product__price-wrapper",
    "[class*='product__price']",
])

SELETOR_NOME = ", ".join([
    "h1.product__title",
    "h1[class*='product__title']",
    "h1",
])


def _id_variante(url: str) -> str | None:
    """Extrai o valor de ?variant=<id> da URL, se presente."""
    try:
        qs = parse_qs(urlparse(url).query)
        valores = qs.get("variant")
        return valores[0] if valores else None
    except Exception:
        return None


class TuyoScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        try:
            page.wait_for_selector(
                f"{SELETOR_PRECO}, {SELETOR_ESGOTADO}, script[type='application/ld+json']",
                timeout=8_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu na Tuyo — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        variante_id = _id_variante(url)

        nome, preco, disponivel_jsonld = self._extrair_jsonld(page, variante_id)

        if nome is None:
            nome = self._extrair_nome_fallback(page)

        if preco is None:
            preco = self._extrair_preco_meta(page)
        if preco is None:
            preco = self._extrair_preco_css(page)

        esgotado_dom = self._esta_esgotado(page)
        # disponivel_jsonld é None quando o JSON-LD não deu nenhum veredito
        # (ex.: não achou a variante) — nesse caso o DOM decide sozinho.
        esgotado = esgotado_dom or (disponivel_jsonld is False)

        if esgotado:
            logger.info(
                "Produto esgotado na Tuyo [jsonld_disponivel=%s, dom_esgotado=%s]: %s",
                disponivel_jsonld, esgotado_dom, nome
            )
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na Tuyo: %s", url)
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url)

        logger.info("Preço encontrado na Tuyo: R$ %.2f", preco)
        return DadosProduto(nome=nome or "Nome não encontrado", preco=preco, disponivel=True, url=url)

    # ------------------------------------------------------------------
    # Extratores internos
    # ------------------------------------------------------------------

    def _extrair_jsonld(self, page: Page, variante_id: str | None) -> tuple[str | None, float | None, bool | None]:
        """
        Retorna (nome, preco, disponivel). disponivel=None quando o
        JSON-LD não deu veredito nenhum (deixa o DOM decidir sozinho).
        """
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            grupo = None
            produto_simples = None
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    tipo = data.get("@type")
                    if tipo == "ProductGroup":
                        grupo = data
                    elif tipo == "Product" and data.get("offers"):
                        produto_simples = data
                except Exception:
                    continue

            # Caso 1: ProductGroup com variantes (produto com cor/tamanho)
            if grupo:
                variantes = grupo.get("hasVariant") or []
                if isinstance(variantes, dict):
                    variantes = [variantes]

                alvo = None
                if variante_id:
                    for v in variantes:
                        offers = v.get("offers") or {}
                        ref = str(offers.get("url") or offers.get("@id") or "")
                        if variante_id in ref:
                            alvo = v
                            break
                if alvo is None and variantes:
                    alvo = variantes[0]  # sem ?variant= na URL — assume a 1ª

                if alvo:
                    offers = alvo.get("offers") or {}
                    nome = alvo.get("name") or grupo.get("name")
                    preco = self._preco_de(offers.get("price"))
                    availability = (offers.get("availability") or "").lower().strip()
                    disponivel = None if not availability else availability not in _AVAILABILITY_ESGOTADO
                    return nome, preco, disponivel

            # Caso 2: Product simples (sem variantes)
            if produto_simples:
                offers = produto_simples.get("offers") or {}
                if isinstance(offers, list):
                    offers = offers[0] if offers else {}
                nome = produto_simples.get("name")
                preco = self._preco_de(offers.get("price"))
                availability = (offers.get("availability") or "").lower().strip()
                disponivel = None if not availability else availability not in _AVAILABILITY_ESGOTADO
                return nome, preco, disponivel

        except Exception as exc:
            logger.debug("Erro no JSON-LD da Tuyo: %s", exc)

        return None, None, None

    @staticmethod
    def _preco_de(valor) -> float | None:
        if not valor:
            return None
        try:
            preco = float(str(valor).replace(",", "."))
            return preco if preco > 0 else None
        except (ValueError, TypeError):
            return None

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
            el = page.query_selector(SELETOR_NOME)
            if el:
                texto = el.inner_text().strip()
                if texto:
                    return texto
        except Exception:
            pass
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            el = page.query_selector(SELETOR_ESGOTADO)
            if el:
                return True
        except Exception:
            pass
        try:
            texto_pagina = page.evaluate("() => document.body.innerText.toLowerCase()")
            for kw in ("esgotado", "avise-me quando estiver disponível", "produto indisponível"):
                if kw in texto_pagina:
                    logger.debug("Esgotamento detectado por keyword na Tuyo: '%s'", kw)
                    return True
        except Exception:
            pass
        return False

    def _extrair_preco_meta(self, page: Page) -> float | None:
        try:
            el = page.query_selector("meta[property='og:price:amount']")
            if el:
                conteudo = re.sub(r"[R$\s]", "", el.get_attribute("content") or "").replace(",", ".")
                valor = float(conteudo)
                if valor > 0:
                    return valor
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

        # Último recurso: varredura de texto via JS (mesmo padrão da Kabum)
        try:
            precos_texto = page.evaluate("""() => {
                const els = document.querySelectorAll('span, div');
                const prices = [];
                for (const el of els) {
                    const text = el.innerText || '';
                    const match = text.match(/R\\$\\s*([\\d.]+(?:,[\\d]{2})?)/);
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
            logger.debug("Erro no fallback JS da Tuyo: %s", exc)
            return None
