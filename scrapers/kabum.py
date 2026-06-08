"""
Scraper da Kabum — PROTOCOL FPS
Herda ScraperBase e implementa a lógica específica do site.

Seletores atualizados para o HTML da Kabum (junho/2025).
Estratégia em camadas:
  1. JSON-LD  (mais estável — dados estruturados do Google)
  2. Meta tags og:price (segundo mais estável)
  3. Seletores CSS com múltiplos candidatos (frágil, mas último recurso)
"""
from __future__ import annotations
import json
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

# Seletores CSS — múltiplos candidatos ordenados por confiabilidade
SELETOR_PRECO = ", ".join([
    # JSON-LD price (via atributo)
    "script[type='application/ld+json']",
    # Meta tags (og / microdata)
    "meta[property='product:price:amount']",
    "meta[itemprop='price']",
    # Elementos visíveis — Kabum usa classes geradas, pegamos por padrão de conteúdo
    "[class*='finalPrice']",
    "[class*='priceCard']",
    "[class*='productPrice']",
    "[data-smash-price]",
    # Genérico — último recurso
    "h4[class*='sc-']",
    "span[class*='sc-']",
])

SELETOR_NOME = ", ".join([
    "h1[class*='sc-']",
    "h1[class*='product']",
    "h1[itemprop='name']",
    "h1",
])

SELETOR_ESGOTADO = ", ".join([
    "button[class*='unavailable']",
    "button:has-text('Avise-me')",
    "button:has-text('Esgotado')",
    "button:has-text('Indisponível')",
    "[class*='outOfStock']",
    "[class*='out-of-stock']",
])


class KabumScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        # Espera o body carregar completamente (JS pesado)
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        # Tenta aguardar qualquer elemento de preço
        try:
            page.wait_for_selector(
                "meta[property='product:price:amount'], [class*='finalPrice'], [class*='priceCard']",
                timeout=8_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome = self._extrair_nome(page)

        # 1. Tenta JSON-LD primeiro (mais estável)
        preco = self._extrair_preco_jsonld(page)

        # 2. Meta tag fallback
        if preco is None:
            preco = self._extrair_preco_meta(page)

        # 3. CSS fallback
        if preco is None:
            preco = self._extrair_preco_css(page)

        # Verifica esgotamento
        esgotado = self._esta_esgotado(page)

        if esgotado and preco is None:
            logger.info("Produto esgotado na Kabum: %s", nome)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        logger.info("Preço encontrado: R$ %.2f", preco)
        return DadosProduto(
            nome=nome,
            preco=preco,
            disponivel=not esgotado,
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

        # Fallback CSS
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

    def _extrair_preco_jsonld(self, page: Page) -> float | None:
        """Extrai preço do JSON-LD — o mais estável pois é para SEO/Google."""
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    texto = script.inner_text()
                    data = json.loads(texto)
                    if isinstance(data, list):
                        data = data[0]

                    # Schema.org Product
                    if data.get("@type") in ("Product", "product"):
                        offers = data.get("offers", {})
                        if isinstance(offers, list):
                            offers = offers[0]
                        price = offers.get("price") or offers.get("lowPrice")
                        if price:
                            valor = float(str(price).replace(",", "."))
                            if valor > 10:
                                return valor
                except Exception:
                    continue
        except Exception as exc:
            logger.debug("Erro no JSON-LD: %s", exc)
        return None

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
                    # Remove "R$" e espaços, normaliza vírgula
                    conteudo = re.sub(r"[R$\s]", "", conteudo).replace(",", ".")
                    valor = float(conteudo)
                    if valor > 10:
                        return valor
            except Exception:
                continue
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        """Último recurso: percorre candidatos CSS e pega o menor preço."""
        candidatos = [
            "[class*='finalPrice']",
            "[class*='priceCard']",
            "[class*='productPrice']",
            "[data-smash-price]",
            # Fallback genérico: qualquer elemento com "R$" no texto
        ]
        precos = []
        for seletor in candidatos:
            try:
                elementos = page.query_selector_all(seletor)
                for el in elementos:
                    texto = el.inner_text()
                    if "R$" in texto or re.search(r"\d{3,}", texto):
                        valor = self._limpar_preco(texto)
                        if valor and valor > 50:  # filtra valores espúrios
                            precos.append(valor)
            except Exception:
                continue

        # Fallback final: busca qualquer texto que pareça preço na página
        if not precos:
            try:
                # Pega o preço do título da página ou breadcrumb
                body_text = page.evaluate("""() => {
                    const els = document.querySelectorAll('h4, span, div');
                    const prices = [];
                    for (const el of els) {
                        const text = el.innerText || '';
                        const match = text.match(/R\\$\\s*([\\d.]+,[\\d]{2})/);
                        if (match) {
                            prices.push(match[0]);
                        }
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