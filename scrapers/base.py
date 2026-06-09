"""
Base abstrata para os scrapers do PROTOCOL FPS.
Cada loja herda esta classe e implementa apenas `extrair_dados`.

v2 (junho/2026):
  - playwright-stealth integrado para mascarar execução headless
  - User-Agent, sec-ch-ua e platform reais de Chrome 124 Windows
  - Timeout adaptativo: detecta GH_ACTIONS e usa valores maiores
  - _criar_contexto agora aceita extra_headers para customização por loja
"""
from __future__ import annotations
import re
import os
import time
import random
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from playwright.sync_api import sync_playwright, Page, BrowserContext
from playwright_stealth import Stealth

logger = logging.getLogger(__name__)

# True quando rodando no GitHub Actions
_IN_CI = bool(os.environ.get("GITHUB_ACTIONS"))

# Timeouts maiores em CI (IPs de datacenter têm latência e throttling maiores)
TIMEOUT_GOTO        = 45_000 if _IN_CI else 30_000
TIMEOUT_NETWORKIDLE = 30_000 if _IN_CI else 20_000
TIMEOUT_SELECTOR    = 12_000 if _IN_CI else 8_000

# Instância stealth compartilhada — mascara todas as fingerprints de webdriver
_STEALTH = Stealth(
    navigator_platform_override="Win32",
    navigator_vendor_override="Google Inc.",
    navigator_user_agent_override=(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    sec_ch_ua_override=(
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"'
    ),
)

if _IN_CI:
    logger.info("Rodando em GitHub Actions — timeouts ampliados e stealth ativo")


@dataclass
class DadosProduto:
    nome:       str
    preco:      float | None   # None = fora de estoque / não encontrado
    disponivel: bool
    url:        str


class ScraperBase(ABC):
    """
    Abre um browser Chromium headless com playwright-stealth,
    navega até a URL e delega a extração para a subclasse.
    """

    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )

    def __init__(self, headless: bool = True):
        self.headless = headless

    # ------------------------------------------------------------------
    # Interface pública
    # ------------------------------------------------------------------

    def coletar(self, url: str) -> DadosProduto:
        """Abre o browser com stealth, navega e retorna os dados do produto."""
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--disable-gpu",
                ],
            )
            ctx  = self._criar_contexto(browser)
            page = ctx.new_page()

            # Aplica todos os scripts anti-detecção antes de qualquer navegação
            _STEALTH.apply_stealth_sync(page)

            self._bloquear_midias(page)

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=TIMEOUT_GOTO)
                self._aguardar_preco(page)
                return self.extrair_dados(page, url)
            except Exception as exc:
                logger.error("Erro ao coletar %s: %s", url, exc)
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
            user_agent=self.USER_AGENT,
            viewport={"width": 1366, "height": 768},
            locale="pt-BR",
            timezone_id="America/Sao_Paulo",
            extra_http_headers={
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
                "Accept": (
                    "text/html,application/xhtml+xml,application/xml;"
                    "q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
                ),
                "Accept-Encoding": "gzip, deflate, br",
                "sec-ch-ua": (
                    '"Chromium";v="124", "Google Chrome";v="124", '
                    '"Not-A.Brand";v="99"'
                ),
                "sec-ch-ua-mobile":   "?0",
                "sec-ch-ua-platform": '"Windows"',
                "Sec-Fetch-Dest":     "document",
                "Sec-Fetch-Mode":     "navigate",
                "Sec-Fetch-Site":     "none",
                "Sec-Fetch-User":     "?1",
                "Upgrade-Insecure-Requests": "1",
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

    @staticmethod
    def _limpar_preco(texto: str) -> float | None:
        """'R$ 3.299,90' → 3299.90"""
        texto = texto.strip()
        numeros = re.sub(r"[^\d,]", "", texto).replace(",", ".")
        try:
            return float(numeros)
        except ValueError:
            return None

    @staticmethod
    def _pausar() -> None:
        """Pausa aleatória entre 1-3 s para parecer humano."""
        time.sleep(random.uniform(1.0, 3.0))