"""
Base abstrata para os scrapers do PROTOCOL FPS.
Cada loja herda esta classe e implementa apenas `extrair_dados`.

Mudanças vs versão anterior:
  - Stealth aplicado via use_sync() englobando o sync_playwright()
  - Args do Chromium adaptativos para CI (--disable-dev-shm-usage, --no-sandbox)
  - Logging do título da página e URL final após carregamento
  - _debug_page(): dump do estado da página quando extração falha
  - Timeouts adaptativos: maiores no CI
"""
from __future__ import annotations

import os
import re
import time
import random
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

from playwright.sync_api import Page, BrowserContext
from playwright_stealth import Stealth

logger = logging.getLogger(__name__)

# ── Detecta ambiente CI ────────────────────────────────────────────────────────
IS_CI = bool(os.environ.get("GITHUB_ACTIONS"))

# ── Timeouts adaptativos ───────────────────────────────────────────────────────
TIMEOUT_GOTO     = 45_000 if IS_CI else 30_000
TIMEOUT_NETWORK  = 25_000 if IS_CI else 15_000
TIMEOUT_SELETOR  = 12_000 if IS_CI else 8_000

# ── User-Agent e headers realistas ────────────────────────────────────────────
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
SEC_CH_UA          = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"'
SEC_CH_UA_PLATFORM = '"Windows"'


@dataclass
class DadosProduto:
    nome:       str
    preco:      float | None   # None = fora de estoque / não encontrado
    disponivel: bool
    url:        str


# ── Instância de Stealth reutilizável ──────────────────────────────────────────
_STEALTH = Stealth(
    navigator_platform_override="Win32",
    navigator_languages_override=("pt-BR", "pt", "en-US", "en"),
    navigator_vendor_override="Google Inc.",
)

# ── Args do Chromium ──────────────────────────────────────────────────────────
_BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
]

# Args extras obrigatórios no CI (container Linux sem GPU e com /dev/shm limitado)
_CI_EXTRA_ARGS = [
    "--disable-dev-shm-usage",      # crítico: evita crash por /dev/shm < 64MB
    "--no-sandbox",                 # necessário em container sem privilégio
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--single-process",             # reduz uso de memória no CI
]

if IS_CI:
    _BROWSER_ARGS = _BROWSER_ARGS + _CI_EXTRA_ARGS


class ScraperBase(ABC):
    """
    Abre um browser Chromium headless com stealth completo,
    navega até a URL e delega a extração para a subclasse.
    """

    def __init__(self, headless: bool = True):
        self.headless = headless

    # ------------------------------------------------------------------
    # Interface pública
    # ------------------------------------------------------------------

    def coletar(self, url: str) -> DadosProduto:
        """Abre o browser com stealth, navega e retorna os dados do produto."""
        from playwright.sync_api import sync_playwright

        # Stealth envolve o sync_playwright inteiro (forma correta para v2.0.3)
        with _STEALTH.use_sync(sync_playwright()) as pw:
            browser = pw.chromium.launch(
                headless=self.headless,
                args=_BROWSER_ARGS,
            )
            ctx  = self._criar_contexto(browser)
            page = ctx.new_page()
            self._bloquear_midias(page)

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=TIMEOUT_GOTO)
                self._aguardar_preco(page)

                # Log de diagnóstico sempre visível no CI
                if IS_CI:
                    self._debug_page(page, url)

                return self.extrair_dados(page, url)

            except Exception as exc:
                logger.error("Erro ao coletar %s: %s", url, exc)
                # Em caso de erro, tenta logar o estado da página
                try:
                    self._debug_page(page, url, forcado=True)
                except Exception:
                    pass
                return DadosProduto(
                    nome="Erro ao coletar",
                    preco=None,
                    disponivel=False,
                    url=url,
                )
            finally:
                browser.close()

    # ------------------------------------------------------------------
    # Métodos a implementar por cada loja
    # ------------------------------------------------------------------

    @abstractmethod
    def extrair_dados(self, page: Page, url: str) -> DadosProduto:
        """Lê o HTML da página já carregada e devolve DadosProduto."""
        ...

    @abstractmethod
    def _aguardar_preco(self, page: Page) -> None:
        """Aguarda o seletor CSS/XPath do preço aparecer na página."""
        ...

    # ------------------------------------------------------------------
    # Helpers internos
    # ------------------------------------------------------------------

    def _criar_contexto(self, browser) -> BrowserContext:
        return browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1366, "height": 768},
            locale="pt-BR",
            timezone_id="America/Sao_Paulo",
            extra_http_headers={
                "Accept-Language":    "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept":             "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Encoding":    "gzip, deflate, br",
                "sec-ch-ua":          SEC_CH_UA,
                "sec-ch-ua-mobile":   "?0",
                "sec-ch-ua-platform": SEC_CH_UA_PLATFORM,
                "Sec-Fetch-Dest":     "document",
                "Sec-Fetch-Mode":     "navigate",
                "Sec-Fetch-Site":     "none",
                "Sec-Fetch-User":     "?1",
                "Upgrade-Insecure-Requests": "1",
                "Cache-Control":      "no-cache",
                "Pragma":             "no-cache",
            },
        )

    def _bloquear_midias(self, page: Page) -> None:
        """Bloqueia imagens, fontes e vídeos para acelerar o carregamento."""
        page.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in ("image", "media", "font")
            else route.continue_(),
        )

    def _debug_page(self, page: Page, url: str, forcado: bool = False) -> None:
        """
        Loga informações de diagnóstico da página.
        Sempre executado no CI; fora do CI, apenas quando forçado (falha).
        Ajuda a identificar se o browser recebeu uma challenge page.
        """
        try:
            titulo   = page.title()
            url_real = page.url
            # Primeiros 500 chars do body para detectar challenge
            body_snippet = page.evaluate(
                "() => document.body?.innerText?.substring(0, 300) || ''"
            )

            eh_challenge = self._detectar_challenge(titulo, url_real, body_snippet)

            if eh_challenge:
                logger.warning(
                    "[DEBUG] ⚠ CHALLENGE DETECTADA! título='%s' url='%s'",
                    titulo, url_real
                )
            else:
                logger.info(
                    "[DEBUG] título='%s' url='%s'",
                    titulo[:80], url_real[:80]
                )

            if forcado or eh_challenge:
                logger.warning("[DEBUG] body snippet: %s", body_snippet[:200])

        except Exception as exc:
            logger.debug("[DEBUG] Não foi possível obter info da página: %s", exc)

    @staticmethod
    def _detectar_challenge(titulo: str, url: str, body: str) -> bool:
        """Retorna True se a página parece ser uma challenge/captcha."""
        titulo_lower = titulo.lower()
        body_lower   = body.lower()
        url_lower    = url.lower()

        challenge_titles = [
            "just a moment", "attention required", "access denied",
            "security check", "checking your", "please wait",
            "403 forbidden", "forbidden", "blocked", "bot check",
        ]
        challenge_body_signals = [
            "cf-browser-verification", "cf_captcha_kind", "__cf_chl",
            "cloudflare", "cdn-cgi/challenge", "captcha", "recaptcha",
            "ray id", "enable javascript",
        ]
        challenge_url_signals = ["/cdn-cgi/", "/challenge", "/captcha"]

        for kw in challenge_titles:
            if kw in titulo_lower:
                return True
        for sig in challenge_body_signals:
            if sig in body_lower:
                return True
        for sig in challenge_url_signals:
            if sig in url_lower:
                return True
        return False

    @staticmethod
    def _limpar_preco(texto: str) -> float | None:
        """'R$ 3.299,90' → 3299.90"""
        if not texto:
            return None
        texto = texto.strip()
        # Remove tudo que não seja dígito ou vírgula
        numeros = re.sub(r"[^\d,]", "", texto).replace(",", ".")
        try:
            return float(numeros)
        except ValueError:
            return None

    @staticmethod
    def _pausar() -> None:
        """Pausa aleatória entre 1-3 s para parecer humano."""
        time.sleep(random.uniform(1.0, 3.0))