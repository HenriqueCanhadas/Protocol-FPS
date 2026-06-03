"""
Scraper da Pichau — PROTOCOL FPS

Estrutura confirmada inspecionando o HTML (junho/2025):
  - Meta tag: <meta property="product:price:amount" content="R$ 7,899.99">
  - Meta tag: <meta name="twitter:data1" content="R$ 7,899.99">
  - Meta tag: <meta property="product:availability" content="instock">
  - JSON-LD: schema.org/Product com offers.price
  - Preço PIX (à vista): div/span contendo "à vista" + valor

  IMPORTANTE: O site renderiza com Next.js (SSR), então as meta tags
  já vêm no HTML estático — são a fonte mais confiável.
  O scraper antigo pegava R$ 15,00 porque usava seletores CSS genéricos
  que batiam em elementos de frete/outros valores pequenos na página.
"""
from __future__ import annotations
import json
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

SELETOR_ESGOTADO = ", ".join([
    "button:has-text('Indisponível')",
    "button:has-text('Avise-me')",
    "button:has-text('Esgotado')",
    "[class*='unavailable']",
    "[class*='out-of-stock']",
])


class PichauScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        """
        Pichau usa Next.js com SSR — meta tags já chegam no HTML inicial.
        Aguarda apenas o DOM estar pronto.
        """
        try:
            page.wait_for_load_state("domcontentloaded", timeout=15_000)
        except Exception:
            pass

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome = self._extrair_nome(page)

        # 1. Meta tag product:price:amount — FONTE PRIMÁRIA (SSR, sempre presente)
        preco = self._extrair_preco_meta(page, "meta[property='product:price:amount']")

        # 2. Twitter card fallback
        if preco is None:
            preco = self._extrair_preco_meta(page, "meta[name='twitter:data1']")

        # 3. JSON-LD fallback
        if preco is None:
            preco = self._extrair_preco_jsonld(page)

        # 4. CSS como último recurso — busca elementos específicos do Pichau
        if preco is None:
            preco = self._extrair_preco_css(page)

        # Verifica disponibilidade
        disponivel_meta = self._extrair_disponibilidade_meta(page)
        esgotado_btn   = self._esta_esgotado(page)

        disponivel = disponivel_meta and not esgotado_btn

        if preco is None:
            logger.warning("Preço não encontrado na Pichau: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        logger.info("Pichau — preço: R$ %.2f | disponível: %s", preco, disponivel)
        return DadosProduto(nome=nome, preco=preco, disponivel=disponivel, url=url)

    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page) -> str:
        # Tenta meta og:title primeiro (sempre presente no SSR)
        for seletor, attr in [
            ("meta[property='og:title']", "content"),
            ("meta[name='twitter:title']", "content"),
        ]:
            try:
                el = page.query_selector(seletor)
                if el:
                    valor = el.get_attribute(attr) or ""
                    # Remove " | Pichau" do final
                    nome = re.sub(r'\s*\|\s*Pichau.*$', '', valor).strip()
                    if nome:
                        return nome
            except Exception:
                continue
        # Fallback CSS
        try:
            el = page.query_selector("h1")
            return el.inner_text().strip() if el else "Nome não encontrado"
        except Exception:
            return "Nome não encontrado"

    def _extrair_preco_meta(self, page: Page, seletor: str) -> float | None:
        """
        Extrai preço de uma meta tag.
        Formato esperado: 'R$ 7,899.99' ou '7899.99'
        """
        try:
            el = page.query_selector(seletor)
            if not el:
                return None
            conteudo = el.get_attribute("content") or ""
            return self._normalizar_preco(conteudo)
        except Exception as exc:
            logger.debug("Erro ao ler meta %s: %s", seletor, exc)
            return None

    def _extrair_preco_jsonld(self, page: Page) -> float | None:
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") == "Product":
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
        except Exception:
            pass
        return None

    def _extrair_preco_css(self, page: Page) -> float | None:
        """
        Último recurso — seletores específicos do Pichau (Next.js).
        Evita pegar valores pequenos como frete (R$ 15,00).
        """
        # Pichau usa MUI/styled-components com classes geradas
        # Foca em padrões semânticos e filtra por valor mínimo realista
        candidatos = [
            # Preço à vista (PIX) — geralmente o mais baixo
            "span[class*='pix']",
            "div[class*='pix']",
            # Preço principal
            "[class*='finalPrice']",
            "[class*='productPrice']",
            "[class*='price-box']",
            # Elementos com "à vista" próximos
            "span[class*='price']",
            "div[class*='price']",
        ]
        precos = []
        for seletor in candidatos:
            try:
                elementos = page.query_selector_all(seletor)
                for el in elementos:
                    texto = el.inner_text()
                    valor = self._normalizar_preco(texto)
                    # Filtra: preço de GPU deve ser > R$ 500
                    if valor and valor > 500:
                        precos.append(valor)
            except Exception:
                continue

        # Fallback via JS — escaneia todo o DOM por padrão R$ X.XXX,XX
        if not precos:
            try:
                valores = page.evaluate("""() => {
                    const results = [];
                    const walker = document.createTreeWalker(
                        document.body, NodeFilter.SHOW_TEXT
                    );
                    let node;
                    while ((node = walker.nextNode())) {
                        const text = node.textContent.trim();
                        const m = text.match(/^R\\$\\s*([\\d.]+,[\\d]{2})$/);
                        if (m) {
                            results.push(m[1]);
                        }
                    }
                    return results;
                }""")
                for v_str in valores:
                    v = self._normalizar_preco("R$ " + v_str)
                    if v and v > 500:
                        precos.append(v)
            except Exception as exc:
                logger.debug("Erro no JS scan: %s", exc)

        return min(precos) if precos else None

    def _extrair_disponibilidade_meta(self, page: Page) -> bool:
        """
        Pichau expõe: <meta property="product:availability" content="instock">
        """
        try:
            el = page.query_selector("meta[property='product:availability']")
            if el:
                val = (el.get_attribute("content") or "").lower()
                return "instock" in val or "in stock" in val
            # Se meta não existe, assume disponível
            return True
        except Exception:
            return True

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            return page.query_selector(SELETOR_ESGOTADO) is not None
        except Exception:
            return False

    @staticmethod
    def _normalizar_preco(texto: str) -> float | None:
        """
        Normaliza diferentes formatos de preço para float.
        Exemplos:
          'R$ 7,899.99'  → 7899.99
          'R$ 7.899,99'  → 7899.99
          '7899.99'      → 7899.99
          '7.899,99'     → 7899.99
        """
        if not texto:
            return None
        # Remove símbolos não-numéricos exceto vírgula e ponto
        limpo = re.sub(r'[R$\s]', '', texto).strip()
        if not limpo:
            return None
        try:
            # Formato brasileiro: 7.899,99
            if re.match(r'^\d{1,3}(\.\d{3})*(,\d{2})$', limpo):
                return float(limpo.replace('.', '').replace(',', '.'))
            # Formato misto: 7,899.99 (meta tag da Pichau usa esse)
            if re.match(r'^\d{1,3}(,\d{3})*(\.\d{2})$', limpo):
                return float(limpo.replace(',', ''))
            # Inteiro ou decimal simples
            limpo2 = limpo.replace(',', '.')
            return float(limpo2)
        except (ValueError, AttributeError):
            return None