"""
Scraper da Logitech Store BR — PROTOCOL FPS (Sprint 29, todo:214)
logitechstore.com.br — plataforma Magento (confirmado por
`price-final_price`, `og:image` em `/catalog/product/cache`).

Nome do arquivo/slug como digitado no todo/plano ("Logitec", não
"Logitech") — decisão de nomenclatura registrada na skill
`scraper-nova-loja` / `project/sprint_v4.md` (Sprint 29).

Estrutura confirmada:
  - SEM JSON-LD (`script[type='application/ld+json']` não existe na página).
  - Preço de referência: `.in_cash-price-box .price` — o desconto à vista no
    Pix (ex. R$ 1.019,92, ~15% sobre o de tabela). Corrigido na Sprint 34/35
    (V5, todo:227): o rascunho original da Sprint 29 (V4) tratava esse valor
    como "promocional" e usava a meta `product:price:amount`/
    `.price-final_price` (preço de tabela, ex. R$ 1.199,90) — o usuário
    reportou que queria monitorado justamente o valor com desconto (o que
    ele paga de fato). Nem todo produto tem esse box (é uma promoção, não
    universal); quando ausente, cai no preço de tabela (meta → CSS).
  - Disponibilidade: `div.stock.available` com texto "Em estoque" quando
    disponível — padrão de tema Magento (`stock unavailable` + "Fora de
    estoque"/"Indisponível" quando esgotado).
  - Nome: `h1.page-title` (bate com `og:title`, sem o sufixo de marca).
"""
from __future__ import annotations
import json
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

SELETOR_PRECO = ".price-final_price [itemprop='price'], .price-final_price .price"
SELETOR_PRECO_PIX = ".in_cash-price-box .price"
SELETOR_NOME  = "h1.page-title, h1"
SELETOR_ESTOQUE = "div.stock"


class LogitecScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        try:
            page.wait_for_selector(
                f"{SELETOR_PRECO}, {SELETOR_ESTOQUE}, meta[property='product:price:amount']",
                timeout=10_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu na Logitech Store — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        nome = self._extrair_nome(page)

        # 1. Desconto à vista no Pix (`.in_cash-price-box`) — preço de
        #    referência desejado (todo:227); só existe quando o produto tem
        #    essa promoção, então cai para a ordem padrão do projeto quando
        #    ausente.
        preco = self._extrair_preco_pix(page)

        # 2. JSON-LD (não existe hoje na Logitech, mas mantém a ordem padrão
        #    do projeto — se o tema adicionar um dia, passa a ser usado).
        if preco is None:
            preco = self._extrair_preco_jsonld(page)

        # 3. Meta tags (preço de tabela, sem o desconto Pix)
        if preco is None:
            preco = self._extrair_preco_meta(page)

        # 4. CSS (preço de tabela)
        if preco is None:
            preco = self._extrair_preco_css(page)

        esgotado = self._esta_esgotado(page)

        if esgotado:
            logger.info("Produto esgotado na Logitech Store: %s", nome)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na Logitech Store: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado na Logitech Store: R$ %.2f", preco)
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
        try:
            el = page.query_selector("meta[property='og:title']")
            if el:
                val = (el.get_attribute("content") or "").strip()
                if val:
                    return val
        except Exception:
            pass
        return "Nome não encontrado"

    def _extrair_preco_pix(self, page: Page) -> float | None:
        try:
            el = page.query_selector(SELETOR_PRECO_PIX)
            if el:
                valor = self._limpar_preco(el.inner_text())
                if valor and valor > 0:
                    return valor
        except Exception:
            pass
        return None

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

    def _extrair_preco_meta(self, page: Page) -> float | None:
        try:
            el = page.query_selector("meta[property='product:price:amount']")
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
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            el = page.query_selector(SELETOR_ESTOQUE)
            if el:
                classes = (el.get_attribute("class") or "").lower()
                texto = (el.inner_text() or "").lower()
                if "unavailable" in classes:
                    return True
                if "fora de estoque" in texto or "indispon" in texto:
                    return True
                if "available" in classes or "em estoque" in texto:
                    return False
        except Exception:
            pass
        # Sem indicação clara — varredura de texto por segurança
        try:
            texto_pagina = page.evaluate("() => document.body.innerText.toLowerCase()")
            for kw in ("fora de estoque", "produto indisponível", "avise-me quando chegar"):
                if kw in texto_pagina:
                    return True
        except Exception:
            pass
        return False
