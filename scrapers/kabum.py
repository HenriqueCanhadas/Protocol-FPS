"""
Scraper da Kabum — PROTOCOL FPS
Herda ScraperBase e implementa a lógica específica do site.

Seletores atualizados para o HTML da Kabum (junho/2025).
Estratégia em camadas:
  1. JSON-LD  (mais estável — dados estruturados do Google)
     → lê também offers.availability para detectar esgotamento
  2. Meta tags og:price (segundo mais estável)
  3. Seletores CSS com múltiplos candidatos (frágil, mas último recurso)

Correções v2 (junho/2026):
  - JSON-LD: offers.availability "OutOfStock" agora detecta esgotamento
  - SELETOR_ESGOTADO expandido para cobrir variações de botão/texto
  - Lógica de esgotamento executada ANTES de decidir disponivel=True
"""
from __future__ import annotations
import json
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

# Valores que indicam produto fora de estoque no schema.org
_AVAILABILITY_ESGOTADO = {
    "https://schema.org/outofstock",
    "outofstock",
    "out of stock",
    "https://schema.org/soldout",
    "soldout",
    "sold out",
    "https://schema.org/discontinued",
}

# Seletores CSS de esgotamento — múltiplos padrões observados na Kabum
SELETOR_ESGOTADO = ", ".join([
    # Botões desabilitados / textos explícitos
    "button[class*='unavailable']",
    "button:has-text('Avise-me')",
    "button:has-text('Esgotado')",
    "button:has-text('Indisponível')",
    "button:has-text('ESGOTADO')",
    "button:has-text('INDISPONÍVEL')",
    "button:has-text('Produto Esgotado')",
    # Classes geradas pelo React/Next da Kabum
    "[class*='outOfStock']",
    "[class*='out-of-stock']",
    "[class*='OutOfStock']",
    "[class*='esgotado']",
    "[class*='Esgotado']",
    # Spans/divs com badge de esgotamento
    "span:has-text('Esgotado')",
    "div:has-text('Produto Esgotado')",
    "[data-testid*='esgotado']",
    "[data-testid*='out-of-stock']",
    # Fallback: qualquer elemento com "Avise" visível
    "a:has-text('Avise-me')",
])

SELETOR_NOME = ", ".join([
    "h1[class*='sc-']",
    "h1[class*='product']",
    "h1[itemprop='name']",
    "h1",
])


class KabumScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        # Espera o body carregar completamente (JS pesado)
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        # Tenta aguardar qualquer elemento de preço ou esgotamento
        try:
            page.wait_for_selector(
                "meta[property='product:price:amount'], "
                "[class*='finalPrice'], [class*='priceCard'], "
                "button:has-text('Avise-me'), [class*='outOfStock'], "
                "script[type='application/ld+json']",
                timeout=8_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome = self._extrair_nome(page)

        # 1. JSON-LD — extrai preço E availability de uma vez
        preco, disponivel_jsonld = self._extrair_jsonld_completo(page)

        # 2. Meta tag fallback (preço)
        if preco is None:
            preco = self._extrair_preco_meta(page)

        # 3. CSS fallback (preço)
        if preco is None:
            preco = self._extrair_preco_css(page)

        # Verifica esgotamento via DOM (botões/classes CSS)
        esgotado_dom = self._esta_esgotado(page)

        # Decisão final: esgotado se JSON-LD diz OutOfStock OU DOM confirma
        esgotado = (not disponivel_jsonld) or esgotado_dom

        if esgotado:
            logger.info(
                "Produto esgotado na Kabum [jsonld_ok=%s, dom_esgotado=%s]: %s",
                disponivel_jsonld, esgotado_dom, nome
            )
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado: R$ %.2f", preco)
        return DadosProduto(
            nome=nome,
            preco=preco,
            disponivel=True,
            url=url,
        )

    # ------------------------------------------------------------------
    # Extratores internos
    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page) -> str:
        # Tenta JSON-LD primeiro
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") in ("Product", "product"):
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
                val = (el.get_attribute("content") or "").strip()
                if val:
                    return val
        except Exception:
            pass

        # Fallback CSS
        try:
            el = page.query_selector(SELETOR_NOME)
            return el.inner_text().strip() if el else "Nome não encontrado"
        except Exception as exc:
            logger.debug("Erro ao extrair nome: %s", exc)
            return "Nome não encontrado"

    def _esta_esgotado(self, page: Page) -> bool:
        """Verifica esgotamento via seletores DOM."""
        try:
            el = page.query_selector(SELETOR_ESGOTADO)
            if el:
                return True
        except Exception:
            pass

        # Fallback: varredura de texto por palavras-chave de esgotamento
        try:
            texto_pagina = page.evaluate(
                "() => document.body.innerText.toLowerCase()"
            )
            for kw in ("produto esgotado", "avise-me quando disponível", "avise-me quando chegar"):
                if kw in texto_pagina:
                    logger.debug("Esgotamento detectado por keyword: '%s'", kw)
                    return True
        except Exception:
            pass

        return False

    def _extrair_jsonld_completo(self, page: Page) -> tuple[float | None, bool]:
        """
        Extrai preço e disponibilidade do JSON-LD em uma única passagem.
        Retorna (preco, disponivel).
        disponivel=True por padrão — só False quando JSON-LD explicitamente diz OutOfStock.
        """
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    texto = script.inner_text()
                    data = json.loads(texto)
                    if isinstance(data, list):
                        data = data[0]

                    if data.get("@type") not in ("Product", "product"):
                        continue

                    offers = data.get("offers", {})
                    if isinstance(offers, list):
                        offers = offers[0]

                    # — Disponibilidade —
                    availability = (offers.get("availability") or "").lower().strip()
                    disponivel = availability not in _AVAILABILITY_ESGOTADO if availability else True

                    # — Preço —
                    price = offers.get("price") or offers.get("lowPrice")
                    preco = None
                    if price:
                        try:
                            valor = float(str(price).replace(",", "."))
                            if valor > 10:
                                preco = valor
                        except (ValueError, TypeError):
                            pass

                    if preco is not None or availability:
                        logger.debug(
                            "JSON-LD: price=%.2f, availability='%s', disponivel=%s",
                            preco or 0, availability, disponivel
                        )
                        return preco, disponivel

                except Exception:
                    continue
        except Exception as exc:
            logger.debug("Erro no JSON-LD: %s", exc)

        # Não encontrou JSON-LD de produto — assume disponível (DOM decidirá)
        return None, True

    def _extrair_preco_meta(self, page: Page) -> float | None:
        """Fallback: lê meta tags de preço."""
        seletores = [
            "meta[property='product:price:amount']",
            "meta[itemprop='price']",
            "meta[name='twitter:data1']",
        ]
        for seletor in seletores:
            try:
                el = page.query_selector(seletor)
                if el:
                    conteudo = el.get_attribute("content") or ""
                    conteudo = re.sub(r"[R$\s]", "", conteudo).replace(",", ".")
                    valor = float(conteudo)
                    if valor > 10:
                        return valor
            except Exception:
                continue
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        """Último recurso: percorre candidatos CSS e pega o menor preço válido."""
        candidatos = [
            "[class*='finalPrice']",
            "[class*='priceCard']",
            "[class*='productPrice']",
            "[data-smash-price]",
        ]
        precos = []
        for seletor in candidatos:
            try:
                elementos = page.query_selector_all(seletor)
                for el in elementos:
                    texto = el.inner_text()
                    if "R$" in texto or re.search(r"\d{3,}", texto):
                        valor = self._limpar_preco(texto)
                        if valor and valor > 50:
                            precos.append(valor)
            except Exception:
                continue

        # Fallback JS — scan completo
        if not precos:
            try:
                body_text = page.evaluate("""() => {
                    const els = document.querySelectorAll('h4, span, div');
                    const prices = [];
                    for (const el of els) {
                        const text = el.innerText || '';
                        const match = text.match(/R\\$\\s*([\\d.]+,[\\d]{2})/);
                        if (match) prices.push(match[0]);
                    }
                    return prices.slice(0, 10);
                }""")
                for texto in body_text:
                    valor = self._limpar_preco(texto)
                    if valor and valor > 50:
                        precos.append(valor)
            except Exception as exc:
                logger.debug("Erro no fallback JS: %s", exc)

        return min(precos) if precos else None