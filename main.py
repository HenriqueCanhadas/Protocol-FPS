"""
main.py — PROTOCOL FPS
Ponto de entrada acionado pelo GitHub Actions (cron diário).

Fluxo:
  1. Busca todos os itens ativos no Supabase
  2. Para cada item, escolhe o scraper certo pela loja
  3. Salva o preço coletado em historico_precos
  4. Chama a function verificar_alertas() do Supabase
  5. Se houver alerta, dispara Email + Telegram e marca como notificado

Logs coloridos (ANSI):
  🟢 Verde  — preço encontrado, operação bem-sucedida
  🔴 Vermelho — produto esgotado, erro, preço não encontrado
  🟡 Amarelo — aviso (loja desconhecida, alerta disparado etc.)
  ⚪ Cinza   — informações gerais (coleta iniciada, histórico salvo)
"""
import logging
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from utils.supabase_client import get_supabase
from scrapers.kabum    import KabumScraper
from scrapers.terabyte import TerabyteScraper
from scrapers.pichau   import PichauScraper
from notificacoes.email    import enviar_email
from notificacoes.telegram import enviar_telegram

# ══════════════════════════════════════════════════════════════════════
# LOGGING COLORIDO
# ══════════════════════════════════════════════════════════════════════

class ColorFormatter(logging.Formatter):
    """
    Formata logs com cores ANSI.
    Compatível com GitHub Actions (que suporta ANSI) e terminais modernos.
    """
    RESET  = "\033[0m"
    BOLD   = "\033[1m"

    LEVEL_COLORS = {
        logging.DEBUG:    "\033[90m",   # cinza escuro
        logging.INFO:     "\033[37m",   # branco
        logging.WARNING:  "\033[33m",   # amarelo
        logging.ERROR:    "\033[31m",   # vermelho
        logging.CRITICAL: "\033[1;31m", # vermelho bold
    }

    # Prefixos por nível
    LEVEL_PREFIX = {
        logging.DEBUG:    "  ·",
        logging.INFO:     "  ·",
        logging.WARNING:  " ⚠ ",
        logging.ERROR:    " ✗ ",
        logging.CRITICAL: " ✗✗",
    }

    def format(self, record: logging.LogRecord) -> str:
        color  = self.LEVEL_COLORS.get(record.levelno, self.RESET)
        prefix = self.LEVEL_PREFIX.get(record.levelno, "  ·")

        # Timestamp reduzido: HH:MM:SS
        timestamp = self.formatTime(record, "%H:%M:%S")

        # Nome do módulo abreviado
        name_short = record.name.split(".")[-1]

        base = f"{color}{timestamp}{self.RESET} {prefix} [{name_short}] "

        # Colorização semântica da mensagem
        msg = record.getMessage()
        msg = self._colorir_mensagem(msg, record.levelno)

        return base + msg

    def _colorir_mensagem(self, msg: str, level: int) -> str:
        """Aplica cores extras com base no conteúdo da mensagem."""
        GREEN  = "\033[32m"
        RED    = "\033[31m"
        YELLOW = "\033[33m"
        CYAN   = "\033[36m"
        BOLD   = "\033[1m"
        DIM    = "\033[2m"
        RESET  = self.RESET

        # Preço encontrado com sucesso
        if "Preço encontrado" in msg or "preço:" in msg.lower():
            if "R$" in msg or "%.2f" in msg or any(c.isdigit() for c in msg):
                return f"{GREEN}{BOLD}{msg}{RESET}"

        # Esgotado / não encontrado / erro
        if any(kw in msg.lower() for kw in (
            "esgotado", "indispon", "não encontrado", "not found",
            "sem preço", "histórico não salvo", "bloqueado", "falhou",
            "erro ao", "error"
        )):
            return f"{RED}{msg}{RESET}"

        # Alerta disparado
        if "⚡ alerta" in msg.lower() or "alerta:" in msg.lower():
            return f"{YELLOW}{BOLD}{msg}{RESET}"

        # Histórico salvo
        if "histórico salvo" in msg.lower():
            return f"{GREEN}{msg}{RESET}"

        # Início de coleta (destacar URL e loja)
        if msg.startswith("Coletando ["):
            # Colore a loja em ciano e a URL em dim
            import re
            m = re.match(r"(Coletando \[)(\w+)(\] )(.*)", msg)
            if m:
                return (
                    f"{m.group(1)}"
                    f"{CYAN}{BOLD}{m.group(2)}{RESET}"
                    f"{m.group(3)}"
                    f"{DIM}{m.group(4)}{RESET}"
                )

        # Email / Telegram enviado
        if "enviado com sucesso" in msg.lower():
            return f"{GREEN}{msg}{RESET}"

        # Coleta finalizada
        if "coleta finalizada" in msg.lower():
            return f"{BOLD}{msg}{RESET}"

        # Itens a monitorar
        if "itens a monitorar" in msg.lower():
            return f"{CYAN}{msg}{RESET}"

        # Loja desconhecida
        if "loja desconhecida" in msg.lower():
            return f"{YELLOW}{msg}{RESET}"

        return msg


def _configurar_logging() -> None:
    """Configura o logging raiz com o formatter colorido."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColorFormatter())

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()
    root.addHandler(handler)

    # Silencia logs verbose de bibliotecas externas
    for lib in ("httpx", "httpcore", "urllib3", "supabase", "postgrest"):
        logging.getLogger(lib).setLevel(logging.WARNING)


# ══════════════════════════════════════════════════════════════════════
# SCRAPERS
# ══════════════════════════════════════════════════════════════════════

SCRAPERS = {
    "kabum":        KabumScraper,
    "terabyteshop": TerabyteScraper,
    "pichau":       PichauScraper,
}

logger = logging.getLogger("main")


# ══════════════════════════════════════════════════════════════════════
# SELEÇÃO DE ITENS
# ══════════════════════════════════════════════════════════════════════

def _slug_loja(nome: str) -> str:
    """Normaliza o nome da loja para o slug usado no dict SCRAPERS
    (minúsculas, sem espaços — ex.: 'Terabyte Shop' → 'terabyteshop')."""
    return (nome or "").lower().replace(" ", "")


def _selecionar_itens(sb) -> list:
    """
    Decide QUAIS itens coletar, por ordem de precedência:

    1. ITEM_ID definido (coleta PONTUAL, botão "Coletar Agora" de um produto):
       coleta apenas aquele item — mesmo com monitoramento pausado, pois é
       um pedido manual explícito. Ignora CATEGORIA/LOJA.
    2. CATEGORIA e/ou LOJA definidas (coleta SEGMENTADA): coleta os itens
       monitorados daquela categoria (ex.: GPU) e/ou loja (ex.: kabum).
       As duas são combináveis — ex.: só as GPUs da Kabum.
    3. Nenhuma env definida (cron diário ou botão global): coleta COMPLETA,
       todos os itens com monitorando = true.
    """
    item_id_alvo = os.environ.get("ITEM_ID", "").strip()
    categoria    = os.environ.get("CATEGORIA", "").strip().upper()
    loja         = _slug_loja(os.environ.get("LOJA", "").strip())

    query = sb.table("itens").select(
        "id, url, nome_na_loja, preco_meta, lojas(nome), produtos(categoria)"
    )
    if item_id_alvo:
        logger.info("Modo PONTUAL — coletando apenas item_id=%s", item_id_alvo)
        query = query.eq("id", item_id_alvo)
    elif categoria or loja:
        escopo = " + ".join(filter(None, (
            f"categoria={categoria}" if categoria else "",
            f"loja={loja}" if loja else "",
        )))
        logger.info("Modo SEGMENTADO — coletando itens monitorados de %s", escopo)
        query = query.eq("monitorando", True)
    else:
        logger.info("Modo COMPLETO — coletando todos os itens monitorados")
        query = query.eq("monitorando", True)

    itens = query.execute().data

    # Filtro do escopo segmentado em Python: evita depender do hint !inner
    # do PostgREST e permite normalizar o nome da loja do mesmo jeito que
    # o dict SCRAPERS (poucos itens — custo desprezível).
    if not item_id_alvo:
        if categoria:
            itens = [i for i in itens
                     if (i.get("produtos") or {}).get("categoria", "").upper() == categoria]
        if loja:
            itens = [i for i in itens
                     if _slug_loja((i.get("lojas") or {}).get("nome")) == loja]

    return itens


# ══════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════

def main() -> None:
    _configurar_logging()

    # Banner de início
    print("\033[1;32m")
    print("  ██████╗ ██████╗  ██████╗ ████████╗ ██████╗  ██████╗ ██╗")
    print("  ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗██╔════╝ ██║")
    print("  ██████╔╝██████╔╝██║   ██║   ██║   ██║   ██║██║      ██║")
    print("  ██╔═══╝ ██╔══██╗██║   ██║   ██║   ██║   ██║██║      ██║")
    print("  ██║     ██║  ██║╚██████╔╝   ██║   ╚██████╔╝╚██████╗ ███████╗")
    print("  ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝")
    print("\033[0m")

    sb = get_supabase()

    itens = _selecionar_itens(sb)
    logger.info("Itens a monitorar: %d", len(itens))
    print()

    # Contadores para resumo final
    total_ok      = 0
    total_esgotado = 0
    total_erro    = 0
    alertas_total = 0

    for idx, item in enumerate(itens, 1):
        item_id   = item["id"]
        url       = item["url"]
        nome_loja = item["lojas"]["nome"].lower().replace(" ", "")
        nome_item = item.get("nome_na_loja") or url.split("/")[-1][:50]

        # Separador visual entre itens
        print(f"\033[90m  {'─' * 60}\033[0m")
        logger.info("Coletando [%s] %s", nome_loja, url)

        ScraperClass = SCRAPERS.get(nome_loja)
        if not ScraperClass:
            logger.warning("Loja desconhecida: %s — pulando", nome_loja)
            total_erro += 1
            continue

        dados = ScraperClass().coletar(url)

        # ── Log do resultado de coleta ───────────────────────────────
        if dados.preco is not None and dados.disponivel:
            logger.info(
                "\033[32m  ✓ PREÇO: R$ %.2f\033[0m  |  %s",
                dados.preco, dados.nome[:70]
            )
            total_ok += 1
        elif not dados.disponivel and dados.preco is None:
            logger.error(
                "\033[31m  ✗ ESGOTADO / NÃO ENCONTRADO\033[0m  |  %s",
                dados.nome[:70]
            )
            total_esgotado += 1
        else:
            logger.warning(
                "\033[33m  ⚠ disponível=%s, preço=%s\033[0m  |  %s",
                dados.disponivel, dados.preco, dados.nome[:70]
            )
            total_erro += 1

        # ── Salva histórico ──────────────────────────────────────────
        if dados.preco is None:
            logger.info(
                "Sem preço coletado (disponivel=%s) — histórico não salvo",
                dados.disponivel,
            )
            continue

        hist_payload = {
            "item_id":    item_id,
            "preco":      dados.preco,
            "disponivel": dados.disponivel,
        }

        try:
            hist_resp = (
                sb.table("historico_precos")
                .insert(hist_payload)
                .execute()
            )
            historico_id = hist_resp.data[0]["id"]
            logger.info("Histórico salvo (id=%s)", historico_id)
        except Exception as exc:
            logger.error("Erro ao salvar histórico: %s", exc)
            continue

        if not dados.disponivel:
            logger.info("Produto indisponível — sem verificação de alertas")
            continue

        # ── Verifica alertas ─────────────────────────────────────────
        try:
            alertas_resp = sb.rpc(
                "verificar_alertas",
                {"p_item_id": item_id, "p_preco_atual": dados.preco},
            ).execute()
            alertas = alertas_resp.data or []
        except Exception as exc:
            logger.warning("verificar_alertas indisponível: %s", exc)
            alertas = []

        for alerta in alertas:
            tipo           = alerta["tipo"]
            preco_gatilho  = alerta["preco_gatilho"]
            preco_anterior = alerta.get("preco_anterior")
            alertas_total += 1

            logger.warning(
                "⚡ Alerta: %s  →  R$ %.2f  (era R$ %.2f)",
                tipo.upper(),
                preco_gatilho,
                preco_anterior or 0,
            )

            alerta_info = {
                "nome":           dados.nome,
                "url":            dados.url,
                "loja":           item["lojas"]["nome"],
                "tipo":           tipo,
                "preco_atual":    preco_gatilho,
                "preco_anterior": preco_anterior,
                "meta":           item.get("preco_meta"),
            }

            ok_email    = enviar_email(alerta_info)
            ok_telegram = enviar_telegram(alerta_info)

            if ok_email:
                logger.info("📧 Email enviado com sucesso")
            else:
                logger.error("📧 Falha ao enviar email")

            if ok_telegram:
                logger.info("📱 Telegram enviado com sucesso")
            else:
                logger.error("📱 Falha ao enviar Telegram")

            try:
                sb.table("alertas").insert({
                    "item_id":             item_id,
                    "historico_id":        historico_id,
                    "tipo":                tipo,
                    "preco_gatilho":       preco_gatilho,
                    "preco_anterior":      preco_anterior,
                    "notificado_email":    ok_email,
                    "notificado_telegram": ok_telegram,
                }).execute()
            except Exception as exc:
                logger.error("Erro ao salvar alerta: %s", exc)

    # ── Resumo final ─────────────────────────────────────────────────
    print(f"\n\033[90m  {'═' * 60}\033[0m")
    print(f"\033[1m  RESUMO DA COLETA\033[0m")
    print(f"  \033[32m✓ Com preço:    {total_ok}\033[0m")
    print(f"  \033[31m✗ Esgotados:    {total_esgotado}\033[0m")
    if total_erro:
        print(f"  \033[33m⚠ Erros:        {total_erro}\033[0m")
    if alertas_total:
        print(f"  \033[33m⚡ Alertas:      {alertas_total}\033[0m")
    print(f"\033[90m  {'═' * 60}\033[0m\n")

    logger.info("Coleta finalizada.")


if __name__ == "__main__":
    main()