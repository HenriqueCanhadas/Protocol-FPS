"""
Scraper da Moça do Pop (Mocadopop) — PROTOCOL FPS (Sprint 48, todo:251)
mocadopop.com.br — plataforma "Loja Integrada" (confirmado via
`meta[name='generator']`).

Estrutura confirmada ao vivo (Playwright real, headless, contra as URLs
legadas do projeto `Monitoramento` que estão sendo migradas nesta sprint):
NENHUM JSON-LD e NENHUMA meta tag de preço/disponibilidade (`og:price:*`,
`product:price:*`) existem nesta plataforma — confirmado ausentes em 3
produtos reais testados. Toda a extração é via CSS.

Armadilha real confirmada (mesmo padrão já documentado no comentário da
Amazon): a página do produto principal e os carrosséis de "produtos
relacionados" reusam as MESMAS classes de preço/botão (`.preco-promocional`,
`.desconto-a-vista`, `.botao-comprar.principal`) — um `query_selector` sem
escopo pega o primeiro da UNIÃO da página inteira, que pode ser de um
produto relacionado, não do produto sendo coletado (confirmado ao vivo: sem
escopo, o preco-promocional retornado batia com um produto errado). A
correcao é escopar toda extração dentro de `div.span12.produto` —
container único por página (confirmado `count == 1`) que embrulha o bloco
do produto principal; mesmo dentro dele ainda há múltiplos matches (algum
carrossel também mora lá dentro), mas o PRIMEIRO nessa escopagem bateu
corretamente em 3/3 produtos testados (inclusive batendo com o preço Pix já
registrado no histórico legado do dia).

- Nome: `.nome-produto` (h1) dentro do escopo.
- Preço: `.desconto-a-vista` — o preco à vista no Pix (ex. "R$ 89,91 via
  Pix", às vezes com uma linha extra "Economize: R$ X" — por isso a extração
  usa regex pra pegar só o primeiro valor "R$ ...", nunca o texto inteiro do
  elemento). É o mesmo valor que o scraper legado do projeto `Monitoramento`
  vinha registrando (confirmado batendo nos 3 produtos testados) — mantém
  continuidade da série histórica migrada. Fallback: `.preco-promocional`
  (tem o atributo numérico limpo `data-sell-price`, sem precisar parsear
  texto) e, por último, `.preco-venda` (preço de tabela, sem desconto).
- Disponibilidade: `#avise-me-cadastro` (id único na página, confirmado) é o
  formulário "Ops! Esse produto encontra-se indisponível" — sempre presente
  no HTML mas com `style="display:none"` quando o produto está disponível, e
  visível via JS quando esgotado. **Não confirmado ao vivo** (os 9 produtos
  legados testados estavam todos disponíveis hoje) — mesmo precedente já
  documentado no scraper da Amazon: mantém como segurança extra uma
  varredura por palavras-chave.
"""
from __future__ import annotations
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

SELETOR_ESCOPO = "div.span12.produto"
SELETOR_NOME = ".nome-produto"
SELETOR_PRECO_PIX = ".desconto-a-vista"
SELETOR_PRECO_PROMO = ".preco-promocional"
SELETOR_PRECO_DE = ".preco-venda"
SELETOR_AVISE_ME = "#avise-me-cadastro"

_INDISPONIVEL_KW = ("esgotado", "indisponível", "indisponivel", "fora de estoque")

_RE_PRECO = re.compile(r"R\$\s*[\d.,]+")


class MocadopopScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        try:
            page.wait_for_selector(
                f"{SELETOR_PRECO_PIX}, {SELETOR_PRECO_PROMO}, {SELETOR_AVISE_ME}",
                timeout=10_000,
            )
        except Exception:
            logger.warning("Seletor de preço não apareceu na Mocadopop — verificando esgotamento...")

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        escopo = page.query_selector(SELETOR_ESCOPO)

        nome = self._extrair_nome(page, escopo)
        preco = self._extrair_preco(escopo)
        esgotado = self._esta_esgotado(page)

        if esgotado:
            logger.info("Produto esgotado na Mocadopop: %s", nome)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na Mocadopop: %s", url)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado na Mocadopop: R$ %.2f", preco)
        return DadosProduto(nome=nome, preco=preco, disponivel=True, url=url)

    # ------------------------------------------------------------------
    # Extratores internos
    # ------------------------------------------------------------------

    def _extrair_nome(self, page: Page, escopo) -> str:
        try:
            if escopo:
                el = escopo.query_selector(SELETOR_NOME)
                if el:
                    texto = el.inner_text().strip()
                    if texto:
                        return texto
        except Exception:
            pass
        try:
            el = page.query_selector("h1")
            if el:
                texto = el.inner_text().strip()
                if texto:
                    return texto
        except Exception:
            pass
        return "Nome não encontrado"

    def _extrair_preco(self, escopo) -> float | None:
        if escopo is None:
            return None

        # 1. Preço à vista no Pix — o mesmo valor que o histórico legado
        #    já rastreava (ver docstring do módulo).
        preco = self._extrair_preco_regex(escopo, SELETOR_PRECO_PIX)
        if preco is not None:
            return preco

        # 2. Preço promocional — atributo numérico limpo, sem parsear texto.
        try:
            el = escopo.query_selector(SELETOR_PRECO_PROMO)
            if el:
                atributo = el.get_attribute("data-sell-price")
                if atributo:
                    valor = float(atributo)
                    if valor > 0:
                        return valor
        except Exception:
            pass
        preco = self._extrair_preco_regex(escopo, SELETOR_PRECO_PROMO)
        if preco is not None:
            return preco

        # 3. Preço de tabela (sem desconto) — último recurso.
        return self._extrair_preco_regex(escopo, SELETOR_PRECO_DE)

    def _extrair_preco_regex(self, escopo, seletor: str) -> float | None:
        try:
            el = escopo.query_selector(seletor)
            if el:
                m = _RE_PRECO.search(el.inner_text())
                if m:
                    valor = self._limpar_preco(m.group(0))
                    if valor and valor > 0:
                        return valor
        except Exception:
            pass
        return None

    def _esta_esgotado(self, page: Page) -> bool:
        try:
            el = page.query_selector(SELETOR_AVISE_ME)
            if el and el.is_visible():
                return True
        except Exception:
            pass
        try:
            texto_pagina = page.evaluate("() => document.body.innerText.toLowerCase()")
            for kw in _INDISPONIVEL_KW:
                if kw in texto_pagina:
                    logger.debug("Esgotamento detectado por keyword na Mocadopop: '%s'", kw)
                    return True
        except Exception:
            pass
        return False
