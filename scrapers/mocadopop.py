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
produto relacionado, não do produto sendo coletado.

**Bug real encontrado em produção e corrigido nesta sprint (reportado pelo
usuário ao comparar com o preço real do site, 25/08/2026):** a 1ª versão
deste scraper escopava a extração em `div.span12.produto` — parecia
suficiente (`count == 1`, e bateu em 7 de 9 produtos testados na 1ª rodada),
mas **carrosséis de relacionados moram DENTRO desse mesmo container**, mais
abaixo na página. Para a maioria dos produtos isso não importava, porque o
preço do PRÓPRIO produto vem primeiro no DOM. Mas em produtos com preço
"sob consulta" (ver abaixo) o bloco do próprio produto não tem NENHUM
elemento de preço — então o `query_selector` "vazava" escopo e pegava o
primeiro preço de um card de carrossel mais abaixo, um valor de OUTRO
produto, sem dar nenhum sinal de erro (confirmado ao vivo com o navegador
real: a Evangelion Eva Unit 01 747 e a LoL Dj Sona Concussive 08 mostram
"Consulte o preço" na página de verdade, mas o scraper antigo reportava
R$ 899,91 e R$ 89,91 respectivamente — coincidindo por acaso com valores já
existentes no histórico legado, o que mascarou o bug na validação inicial).
Corrigido escopando em `div.principal.geral` — o container que agrupa
título (`h1.nome-produto`) e bloco de preço/compra do produto sendo
coletado, ANTES de onde os carrosséis de relacionados começam
(`count == 1`, confirmado nos 9 produtos legados, incluindo os 2 casos
"sob consulta" onde agora corretamente não acha preço nenhum).

- Nome: `.nome-produto` (h1) dentro do escopo.
- Preço: `.desconto-a-vista` — o preco à vista no Pix (ex. "R$ 89,91 via
  Pix", às vezes com uma linha extra "Economize: R$ X" — por isso a extração
  usa regex pra pegar só o primeiro valor "R$ ...", nunca o texto inteiro do
  elemento). É o mesmo valor que o scraper legado do projeto `Monitoramento`
  vinha registrando para os produtos com preço publicado (confirmado
  batendo em 7/9 produtos reais, após a correção de escopo acima) — mantém
  continuidade da série histórica migrada. Fallback: `.preco-promocional`
  (tem o atributo numérico limpo `data-sell-price`, sem precisar parsear
  texto) e, por último, `.preco-venda` (preço de tabela, sem desconto).
- **Preço "sob consulta"**: alguns produtos (confirmado em 2 dos 9 legados —
  ambos com a badge "Item raro"/"Encomenda") não têm NENHUM dos três
  elementos de preço acima — a loja mostra um botão "Consulte o preço" em
  vez de vender diretamente. Sem escopo vazando (ver bug acima), isso já
  resulta naturalmente em `preco=None`; como não está esgotado
  (`#avise-me-cadastro` não aparece — o produto está disponível, só sem
  preço público), o resultado correto é `encontrado=False` ("não
  localizado"), nunca um preço inventado. Detectado explicitamente via
  `.preco-produto` (texto contém "consulte") só para deixar o log claro
  sobre a causa.
- Disponibilidade: `#avise-me-cadastro` (id único na página, confirmado) é o
  formulário "Ops! Esse produto encontra-se indisponível" — sempre presente
  no HTML mas com `style="display:none"` quando o produto está disponível, e
  visível via JS quando esgotado. **Não confirmado ao vivo** (nenhum dos 9
  produtos legados testados estava esgotado) — mesmo precedente já
  documentado no scraper da Amazon: mantém como segurança extra uma
  varredura por palavras-chave.
"""
from __future__ import annotations
import re
import logging
from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto

logger = logging.getLogger(__name__)

SELETOR_ESCOPO = "div.principal.geral"
SELETOR_NOME = ".nome-produto"
SELETOR_PRECO_PIX = ".desconto-a-vista"
SELETOR_PRECO_PROMO = ".preco-promocional"
SELETOR_PRECO_DE = ".preco-venda"
SELETOR_PRECO_PRODUTO = ".preco-produto"
SELETOR_AVISE_ME = "#avise-me-cadastro"

_INDISPONIVEL_KW = ("esgotado", "indisponível", "indisponivel", "fora de estoque")
_SOB_CONSULTA_KW = "consulte"

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

        try:
            n_escopo = page.eval_on_selector_all(SELETOR_ESCOPO, "els => els.length")
            preco_produto_texto = escopo.query_selector(SELETOR_PRECO_PRODUTO).inner_text()[:80] if escopo and escopo.query_selector(SELETOR_PRECO_PRODUTO) else None
            logger.warning(
                "[DEBUG-TEMP] n_escopo=%s escopo_existe=%s preco_produto_texto=%r",
                n_escopo, escopo is not None, preco_produto_texto,
            )
        except Exception as exc:
            logger.warning("[DEBUG-TEMP] erro ao coletar debug: %s", exc)

        nome = self._extrair_nome(page, escopo)
        preco = self._extrair_preco(escopo)
        esgotado = self._esta_esgotado(page)

        if esgotado:
            logger.info("Produto esgotado na Mocadopop: %s", nome)
            return DadosProduto(nome=nome, preco=None, disponivel=False, url=url)

        if preco is None:
            if self._esta_sob_consulta(escopo):
                logger.info("Preço sob consulta na Mocadopop (loja não publica preço): %s", nome)
            else:
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

    def _esta_sob_consulta(self, escopo) -> bool:
        try:
            if escopo:
                el = escopo.query_selector(SELETOR_PRECO_PRODUTO)
                if el and _SOB_CONSULTA_KW in el.inner_text().lower():
                    return True
        except Exception:
            pass
        return False

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
