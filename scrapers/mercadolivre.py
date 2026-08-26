"""
Scraper do Mercado Livre — PROTOCOL FPS (Sprint 49, todo:254)
mercadolivre.com.br

Estrutura confirmada ao vivo (navegador real, contra a URL de teste do
`todo`): JSON-LD `Product` completo e limpo — `offers.price` (65.99,
batendo exatamente com o preço visível "R$ 65,99"), `offers.priceCurrency`
("BRL") e `offers.availability` ("https://schema.org/InStock"). Segue o
mesmo molde da Kabum (skill `scraper-nova-loja`): JSON-LD estável, sem
tratamento especial de retry/challenge.

**Nota sobre a URL de teste**: o link do `todo` traz parâmetros de
rastreamento de anúncio (`pdp_filters=item_id:...`, `matt_*`, `gclid`,
etc.) — confirmado ao vivo que a URL "limpa" (só `.../p/MLB<id>`, sem
nenhum desses parâmetros) devolve o mesmo JSON-LD, mesmo preço e mesmo
produto. O scraper não depende desses parâmetros de campanha (que expiram/
mudam) — funciona igual com a URL limpa ou com a URL completa.

Armadilha real confirmada (mesmo padrão já documentado nos comentários da
Amazon/Mocadopop): a página tem VÁRIOS elementos com a mesma classe
`.ui-pdp-price__part__container` — o preço de tabela riscado (`De
R$ 147,99`), o preço à vista atual (`R$ 65,99`) e o valor da parcela
(`R$ 6,50`) usam todos essa classe. Confirmado ao vivo que o preço atual
fica especificamente dentro de `.ui-pdp-price__second-line` (o preço de
tabela riscado NÃO tem esse wrapper) — por isso o fallback CSS sempre
escopa a busca a esse container, nunca pega `.ui-pdp-price__part__container`
solto.

- Nome: `h1.ui-pdp-title` — já vem limpo (sem sufixo de marca/loja).
- Preço: JSON-LD `offers.price`. Fallback CSS: `.ui-pdp-price__second-line`
  → `.andes-money-amount__fraction` (parte inteira) +
  `.andes-money-amount__cents` (centavos), já que não existe meta tag de
  preço nesta plataforma (confirmado ausente: `product:price:amount`/
  `og:price:amount` não existem — só `og:title` traz o preço embutido no
  texto, informal demais pra ser uma camada própria).
- Disponibilidade: `offers.availability` do JSON-LD contra o mesmo
  conjunto de valores schema.org usado no resto do projeto. **Não
  confirmado ao vivo** — a URL de teste está em estoque, o caminho
  esgotado não foi observado na prática. Mesmo precedente documentado na
  Amazon/Mocadopop: mantém uma varredura por palavras-chave como segurança
  extra, sem alegar teste ao vivo desse caminho.
"""
from __future__ import annotations
import json
import re
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

SELETOR_NOME = "h1.ui-pdp-title"
SELETOR_PRECO_ATUAL = ".ui-pdp-price__second-line"

_INDISPONIVEL_KW = (
    "esgotado", "indisponível", "indisponivel", "sem estoque",
    "produto pausado", "não está mais disponível",
)


class MercadoLivreScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        try:
            page.wait_for_selector(
                f"{SELETOR_PRECO_ATUAL}, script[type='application/ld+json']",
                timeout=10_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu no Mercado Livre — verificando esgotamento...")

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
                "Produto esgotado no Mercado Livre [jsonld_disponivel=%s, dom_esgotado=%s]: %s",
                disponivel_jsonld, esgotado_dom, nome
            )
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado no Mercado Livre: %s", url)
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado no Mercado Livre: R$ %.2f", preco)
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

                    availability = (offers.get("availability") or "").lower().strip()
                    disponivel = None if not availability else availability not in _AVAILABILITY_ESGOTADO

                    return nome, preco, disponivel
                except Exception:
                    continue
        except Exception as exc:
            logger.debug("Erro no JSON-LD do Mercado Livre: %s", exc)

        return None, None, None

    def _extrair_nome_fallback(self, page: Page) -> str | None:
        try:
            el = page.query_selector(SELETOR_NOME)
            if el:
                texto = el.inner_text().strip()
                if texto:
                    return texto
        except Exception:
            pass
        try:
            el = page.query_selector("meta[property='og:title']")
            if el:
                val = (el.get_attribute("content") or "").strip()
                # og:title traz "<nome> - R$ X,XX" — corta o preço embutido
                val = re.sub(r"\s*-\s*R\$\s*[\d.,]+\s*$", "", val)
                if val:
                    return val
        except Exception:
            pass
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            texto_pagina = page.evaluate("() => document.body.innerText.toLowerCase()")
            for kw in _INDISPONIVEL_KW:
                if kw in texto_pagina:
                    logger.debug("Esgotamento detectado por keyword no Mercado Livre: '%s'", kw)
                    return True
        except Exception:
            pass
        return False

    def _extrair_preco_css(self, page: Page) -> float | None:
        try:
            container = page.query_selector(SELETOR_PRECO_ATUAL)
            if container:
                fracao = container.query_selector(".andes-money-amount__fraction")
                if fracao:
                    inteiro = self._limpar_preco(fracao.inner_text())
                    if inteiro:
                        centavos_el = container.query_selector(".andes-money-amount__cents")
                        centavos = centavos_el.inner_text().strip() if centavos_el else "00"
                        try:
                            return float(inteiro) + float(f"0.{centavos}")
                        except (TypeError, ValueError):
                            return float(inteiro)
        except Exception:
            pass

        # Último recurso: varredura de texto via JS (mesmo padrão da Kabum)
        try:
            precos_texto = page.evaluate("""() => {
                const el = document.querySelector('.ui-pdp-price__second-line');
                if (!el) return [];
                const text = el.innerText || '';
                const match = text.match(/R\\$\\s*([\\d.]+(?:,[\\d]{2})?)/);
                return match ? [match[0]] : [];
            }""")
            for texto in precos_texto:
                valor = self._limpar_preco(texto)
                if valor and valor > 0:
                    return valor
        except Exception as exc:
            logger.debug("Erro no fallback JS do Mercado Livre: %s", exc)
        return None
