"""
Scraper da Terabyteshop — PROTOCOL FPS

A Terabyte renderiza preços via JavaScript (não é SSR puro).
O preço é injetado dinamicamente após o carregamento da página.

Estratégia em camadas (da mais para a menos estável):
  1. JSON-LD  — schema.org/Product (mais estável)
  2. Itemprop — microdata HTML (segundo mais estável)
  3. ID/classe específica da Terabyte (fragil mas necessário como fallback)
  4. JS evaluation — scan do DOM por padrão R$ X.XXX,XX
  
Seletores mapeados via inspeção do código-fonte (junho/2025):
  - Preço: #product-price, #priceDe, .prod-new-price
  - Nome: h1.prod-name, h1[class*='title'], h1
  - Esgotado: .prod-esgotado, button:has-text('Indisponível')
"""
from __future__ import annotations
import json
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

# Seletores específicos da Terabyteshop (estrutura relativamente estável)
SELETORES_PRECO = [
    # IDs e classes semânticas (mais estáveis)
    "#product-price",
    "#priceDe",
    ".prod-new-price",
    ".prod-new-price strong",
    "#buy-price",
    ".buy-price",
    # Fallback por itemprop
    "[itemprop='price']",
    "[itemprop='lowPrice']",
    # Outros padrões observados
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
    ".btn-esgotado",
    "[class*='esgotado']",
    "[class*='unavailable']",
])


class TerabyteScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Terabyte carrega preços via JS após o DOM.
        Precisa aguardar networkidle + tentar aguardar o seletor.
        """
        # Aguarda JS terminar
        try:
            page.wait_for_load_state("networkidle", timeout=20_000)
        except Exception:
            try:
                page.wait_for_load_state("load", timeout=10_000)
            except Exception:
                pass

        # Tenta aguardar um elemento de preço aparecer
        for seletor in ["#product-price", ".prod-new-price", "[itemprop='price']"]:
            try:
                page.wait_for_selector(seletor, timeout=5_000)
                logger.debug("Seletor de preço encontrado: %s", seletor)
                return
            except Exception:
                continue

        logger.warning("Seletor de preço Terabyte não apareceu")

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
        # JSON-LD primeiro
        preco_ld = self._extrair_preco_jsonld(page)  # reutiliza parse
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
        # CSS
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
        """Lê microdata itemprop='price' (content ou text)."""
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
                # Tenta atributo content (meta tags)
                val = el.get_attribute("content")
                if val:
                    v = self._limpar_preco_br(val)
                    if v and v > 50:
                        return v
                # Tenta text content (elementos visíveis)
                texto = el.inner_text()
                v = self._limpar_preco_br(texto)
                if v and v > 50:
                    return v
            except Exception:
                continue
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        """Percorre seletores CSS específicos da Terabyte."""
        for seletor in SELETORES_PRECO:
            try:
                elementos = page.query_selector_all(seletor)
                for el in elementos:
                    texto = el.inner_text()
                    v = self._limpar_preco_br(texto)
                    if v and v > 50:
                        return v
                    # Tenta atributo content
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
        Último recurso: avalia o DOM via JS buscando textos no formato
        'R$ X.XXX,XX' com valor acima de R$ 100.
        Pega o menor valor para evitar capturar preço parcelado.
        """
        try:
            valores = page.evaluate("""() => {
                const results = [];
                // Busca em texto de todos os nós folha
                const walker = document.createTreeWalker(
                    document.body, NodeFilter.SHOW_TEXT
                );
                let node;
                while ((node = walker.nextNode())) {
                    const text = node.textContent.trim();
                    // Formato brasileiro: R$ X.XXX,XX
                    const matches = text.match(/R\\$\\s*([\\d.]+,[\\d]{2})/g) || [];
                    for (const m of matches) {
                        results.push(m);
                    }
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
        """
        Converte texto em float para formato brasileiro.
        'R$ 9.999,99' → 9999.99
        '9.999,99'    → 9999.99
        '9999.99'     → 9999.99
        """
        if not texto:
            return None
        limpo = re.sub(r'[R$\s\xa0]', '', texto).strip()
        if not limpo:
            return None
        try:
            # Formato BR: ponto como milhar, vírgula como decimal
            if re.search(r'\d\.\d{3},\d{2}$', limpo):
                return float(limpo.replace('.', '').replace(',', '.'))
            # Vírgula como decimal sem milhar: 999,99
            if re.match(r'^\d+,\d{2}$', limpo):
                return float(limpo.replace(',', '.'))
            # Ponto como decimal (formato EN): 9999.99
            return float(limpo.replace(',', ''))
        except (ValueError, AttributeError):
            return None