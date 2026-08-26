"""
Scraper da Shopee — PROTOCOL FPS (Sprint 40, todo:237)
Marketplace (shopee.com.br), SPA pesada em React: o HTML inicial (confirmado
via curl sem JS) é um shell quase vazio (`<div id="main">`) — nome, preço,
disponibilidade e o próprio JSON-LD só existem depois de uma chamada de API
assíncrona ser resolvida e a página re-renderizar. Isso foi observado levando
de ~10 a ~18s numa sessão real de navegador (bem mais lento que o padrão
"preço via JS" da Terabyteshop, que usa poucos segundos de sleep) — por isso
`_aguardar_preco` usa `wait_for_function` com timeout bem mais generoso em vez
do sleep fixo curto usado nas outras lojas.

Estratégia (mais estável primeiro, mesma ordem do projeto):
  1. JSON-LD `Product` (`offers.price` + `offers.availability`) — confirmado ao
     vivo contendo o preço COM desconto já aplicado (o preço "de tabela"
     riscado não aparece no JSON-LD, só o efetivo).
  2. Meta tags (`og:title`) — só nome, o `<head>` da Shopee não tem
     `og:price:amount`.
  3. Seletores CSS — **não usados como fonte de preço**: a classe do elemento
     de preço é um hash gerado por CSS-modules (ex. `pyzxvq pw3J3G`,
     confirmado ao vivo), muda a qualquer novo deploy do bundle da Shopee.
  4. Varredura de texto completo via JS (regex de "R$") — mesmo último recurso
     usado em Kabum/Tuyo, útil justamente por não depender de nomes de classe.

Disponibilidade: `offers.availability` do JSON-LD (`schema.org/InStock` /
`OutOfStock`) combinado com uma varredura de texto por "esgotado" no corpo da
página, mesmo padrão da Tuyo — o JSON-LD decide quando dá veredito claro, o
texto da página serve de rede de segurança quando não dá.

Risco sinalizado no todo (`todo:237`) — "às vezes pode entrar na tela de
login" — CONFIRMADO e reproduzido 3/3 com o Playwright real do coletor (sem
nenhuma sessão, stealth completo): toda visita anônima é redirecionada via JS
para `shopee.com.br/verify/traffic/error?...&is_logged_in=false&...`, uma
parede "Login Necessário". Diferente do bloqueio da Pichau (rate-limit por IP
de datacenter, onde retry com backoff faz sentido — a mesma requisição pode
"passar" numa tentativa seguinte): aqui é um portão de autenticação, não um
limite de taxa. Repetir a mesma visita sem uma sessão válida não muda o
resultado (confirmado: 3 tentativas, 3 `tracking_id` diferentes, mesmo
veredito) — por isso este scraper NÃO usa o padrão de retry da Pichau, só
detecta o bloqueio honestamente e retorna `disponivel=False`/`preco=None`
(nunca um preço ou "esgotado" falso). Decisão registrada em `README.md`,
`CLAUDE.md` e `project/sprint_v5.md`.
"""
from __future__ import annotations
import json
import logging

from playwright.sync_api import Page

from .base import ScraperBase, DadosProduto, IS_CI

logger = logging.getLogger(__name__)

# Timeout de espera pelo JSON-LD do produto — bem mais generoso que o padrão
# do projeto (TIMEOUT_SELETOR em base.py, 8s/12s): a Shopee é uma SPA que
# resolve o preço via API depois do carregamento inicial, e isso foi
# observado levando ~10-18s numa sessão real (ver docstring do módulo).
_TIMEOUT_JSONLD = 40_000 if IS_CI else 25_000

_AVAILABILITY_ESGOTADO = {
    "https://schema.org/outofstock", "http://schema.org/outofstock",
    "outofstock", "out of stock",
    "https://schema.org/soldout", "http://schema.org/soldout",
    "soldout", "sold out",
    "https://schema.org/discontinued", "http://schema.org/discontinued",
}

# Espera por QUALQUER um dos dois desfechos possíveis — o JSON-LD do produto
# carregar, ou a Shopee redirecionar (via JS, sem reload) para a parede de
# login (`/verify/traffic/`, confirmado levando só ~4-5s quando acontece) —
# o que evita esperar o timeout inteiro (25-40s) num caso já sabidamente sem
# saída.
_JS_TEM_JSONLD_OU_BLOQUEIO = """() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')]
        .some(s => (s.textContent || '').includes('"@type":"Product"'))
    || location.href.includes('/verify/traffic/')"""


class ShopeeScraper(ScraperBase):

    def _aguardar_preco(self, page: Page) -> None:
        try:
            page.wait_for_function(_JS_TEM_JSONLD_OU_BLOQUEIO, timeout=_TIMEOUT_JSONLD)
        except Exception:
            logger.warning(
                "Nem o JSON-LD do produto nem o redirect de bloqueio apareceram "
                "na Shopee dentro do timeout (%dms) — seguindo com fallback de texto",
                _TIMEOUT_JSONLD
            )

    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        if self._eh_parede_de_login(page):
            logger.warning(
                "Shopee exigiu login para %s (url final: %s) — visita anônima "
                "bloqueada, não é um erro de extração", url, page.url
            )
            return DadosProduto(nome="Bloqueio Shopee — login necessário", preco=None, disponivel=False, url=url, encontrado=False)

        nome, preco, disponivel_jsonld = self._extrair_jsonld(page)

        if nome is None:
            nome = self._extrair_nome_fallback(page)

        if preco is None:
            preco = self._extrair_preco_texto(page)

        esgotado_texto = self._esta_esgotado_por_texto(page)
        # disponivel_jsonld é None quando o JSON-LD não deu nenhum veredito
        # (não achou script Product) — nesse caso o texto da página decide.
        esgotado = esgotado_texto or (disponivel_jsonld is False)

        if esgotado:
            logger.info(
                "Produto esgotado na Shopee [jsonld_disponivel=%s, texto_esgotado=%s]: %s",
                disponivel_jsonld, esgotado_texto, nome
            )
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url)

        if preco is None:
            logger.warning("Preço não encontrado na Shopee: %s", url)
            return DadosProduto(nome=nome or "Nome não encontrado", preco=None, disponivel=False, url=url, encontrado=False)

        logger.info("Preço encontrado na Shopee: R$ %.2f", preco)
        return DadosProduto(nome=nome or "Nome não encontrado", preco=preco, disponivel=True, url=url)

    # ------------------------------------------------------------------
    # Extratores internos
    # ------------------------------------------------------------------

    @staticmethod
    def _eh_parede_de_login(page: Page) -> bool:
        """Detecta o redirect via JS para a parede 'Login Necessário' —
        sinal específico da Shopee, não coberto pelo _detectar_challenge
        genérico de ScraperBase (não é challenge de bot, é gate de sessão)."""
        try:
            if "/verify/traffic/" in page.url:
                return True
            texto = page.evaluate("() => document.body.innerText.toLowerCase()")
            return "login necessário" in texto or "faça login para continuar" in texto
        except Exception:
            return False

    def _extrair_jsonld(self, page: Page) -> tuple[str | None, float | None, bool | None]:
        """Retorna (nome, preco, disponivel); disponivel=None sem veredito."""
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                try:
                    data = json.loads(script.inner_text())
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") != "Product":
                        continue

                    offers = data.get("offers") or {}
                    if isinstance(offers, list):
                        offers = offers[0] if offers else {}

                    nome = data.get("name")
                    preco = self._preco_de(offers.get("price"))
                    availability = (offers.get("availability") or "").lower().strip()
                    disponivel = None if not availability else availability not in _AVAILABILITY_ESGOTADO
                    return nome, preco, disponivel
                except Exception:
                    continue
        except Exception as exc:
            logger.debug("Erro no JSON-LD da Shopee: %s", exc)

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
            el = page.query_selector("h1")
            if el:
                texto = el.inner_text().strip()
                if texto:
                    return texto
        except Exception:
            pass
        return None

    def _esta_esgotado_por_texto(self, page: Page) -> bool:
        try:
            texto_pagina = page.evaluate("() => document.body.innerText.toLowerCase()")
            for kw in ("produto esgotado", "esgotado", "fora de estoque", "indisponível"):
                if kw in texto_pagina:
                    logger.debug("Esgotamento detectado por keyword na Shopee: '%s'", kw)
                    return True
        except Exception:
            pass
        return False

    def _extrair_preco_texto(self, page: Page) -> float | None:
        """Último recurso: varredura de texto via JS — não depende de nomes
        de classe (hashes de CSS-modules, instáveis a cada deploy)."""
        try:
            precos_texto = page.evaluate("""() => {
                const els = document.querySelectorAll('div, span');
                const prices = [];
                for (const el of els) {
                    if (el.children.length > 0) continue;
                    const text = el.innerText || '';
                    const match = text.match(/^R\\$\\s*([\\d.]+(?:,[\\d]{2})?)$/);
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
            logger.debug("Erro no fallback de texto da Shopee: %s", exc)
            return None
