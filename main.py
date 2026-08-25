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
from scrapers.kabum        import KabumScraper
from scrapers.terabyte     import TerabyteScraper
from scrapers.pichau       import PichauScraper
from scrapers.tuyo         import TuyoScraper
from scrapers.playstation  import PlaystationScraper
from scrapers.logitec      import LogitecScraper
from scrapers.tangleteezer import TangleteezerScraper
from scrapers.amazon       import AmazonScraper
from scrapers.shopee       import ShopeeScraper
from scrapers.aliexpress   import AliExpressScraper
from scrapers.mocadopop    import MocadopopScraper
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
            "esgotado", "indispon", "não encontrado", "não localizado", "not found",
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
    "tuyo":         TuyoScraper,
    "playstation":  PlaystationScraper,
    "logitec":      LogitecScraper,
    "tangleteezer": TangleteezerScraper,
    "amazon":       AmazonScraper,
    "shopee":       ShopeeScraper,
    "aliexpress":   AliExpressScraper,
    "mocadopop":    MocadopopScraper,
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
       um pedido manual explícito. Ignora ITEM_IDS/CATEGORIA/LOJA/USER_ID.
    2. ITEM_IDS definido (coleta em LISTA, Sprint 14: o "Coletar Filtrados"
       envia exatamente os itens visíveis na lista do Dashboard — filtros que
       o coletor não sabe expressar, como busca por texto e dia da última
       coleta, viram uma lista explícita de IDs separados por vírgula).
       Coleta exatamente esses itens; o frontend já exclui os pausados.
       Ignora CATEGORIA/LOJA/USER_ID.
    3. CATEGORIA e/ou LOJA e/ou USER_ID definidos (coleta SEGMENTADA): coleta
       os itens monitorados daquela categoria (ex.: GPU), loja (ex.: kabum)
       e/ou dono (usuário normal que clicou "Coletar" vê só os itens dele).
       Todos combináveis — ex.: só as GPUs da Kabum de um usuário.
    4. Nenhuma env definida (cron diário ou botão global do admin): coleta
       COMPLETA, todos os itens com monitorando = true.
    """
    item_id_alvo = os.environ.get("ITEM_ID", "").strip()
    item_ids     = [i.strip() for i in os.environ.get("ITEM_IDS", "").split(",") if i.strip()]
    categoria    = os.environ.get("CATEGORIA", "").strip().upper()
    loja         = _slug_loja(os.environ.get("LOJA", "").strip())
    user_id      = os.environ.get("USER_ID", "").strip()

    query = sb.table("itens").select(
        "id, url, nome_na_loja, preco_meta, user_id, lojas(nome), produtos(categoria)"
    )
    if item_id_alvo:
        logger.info("Modo PONTUAL — coletando apenas item_id=%s", item_id_alvo)
        query = query.eq("id", item_id_alvo)
    elif item_ids:
        logger.info("Modo LISTA — coletando %d item(ns) explícitos do dispatch", len(item_ids))
        query = query.in_("id", item_ids)
    elif categoria or loja or user_id:
        escopo = " + ".join(filter(None, (
            f"categoria={categoria}" if categoria else "",
            f"loja={loja}" if loja else "",
            f"user_id={user_id[:8]}…" if user_id else "",
        )))
        logger.info("Modo SEGMENTADO — coletando itens monitorados de %s", escopo)
        query = query.eq("monitorando", True)
        if user_id:
            query = query.eq("user_id", user_id)
    else:
        logger.info("Modo COMPLETO — coletando todos os itens monitorados")
        query = query.eq("monitorando", True)

    itens = query.execute().data

    # Filtro do escopo segmentado em Python: evita depender do hint !inner
    # do PostgREST e permite normalizar o nome da loja do mesmo jeito que
    # o dict SCRAPERS (poucos itens — custo desprezível).
    # Nos modos PONTUAL e LISTA os IDs são explícitos — nada a refinar.
    if not item_id_alvo and not item_ids:
        if categoria:
            itens = [i for i in itens
                     if (i.get("produtos") or {}).get("categoria", "").upper() == categoria]
        if loja:
            itens = [i for i in itens
                     if _slug_loja((i.get("lojas") or {}).get("nome")) == loja]

    return itens


def _carregar_usuarios(sb) -> dict:
    """
    Mapa user_id → {email, telegram} para rotear notificações por DONO do
    item (Sprint 9):
      • Email    → sempre para o email cadastrado do dono do item;
      • Telegram → só para quem tem usuarios.notificar_telegram = true
        (o bot/chat é pessoal — coluna criada em sprint9_alertas_por_usuario.sql).
    Fallback: se a coluna ainda não existir (migração não aplicada), o
    Telegram fica habilitado apenas para o admin pedrosacanhadas@gmail.com.
    """
    try:
        rows = sb.table("usuarios").select("id, email, notificar_telegram").execute().data
        return {r["id"]: {"email": r.get("email"),
                          "telegram": bool(r.get("notificar_telegram"))} for r in rows}
    except Exception:
        logger.warning(
            "Coluna usuarios.notificar_telegram ausente (aplicar migração sprint9) — "
            "Telegram restrito ao admin por fallback"
        )
        rows = sb.table("usuarios").select("id, email").execute().data
        return {r["id"]: {"email": r.get("email"),
                          "telegram": r.get("email") == "pedrosacanhadas@gmail.com"}
                for r in rows}


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

    # Donos dos itens (roteamento de email/telegram por usuário — Sprint 9)
    usuarios = _carregar_usuarios(sb)

    # Contadores para resumo final
    total_ok            = 0
    total_esgotado      = 0
    total_nao_localizado = 0
    total_erro          = 0
    alertas_total       = 0

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
        # Sprint 41 (V5, todo:204): distingue esgotamento CONFIRMADO
        # (dados.encontrado=True — o scraper leu a página e confirmou fora de
        # estoque) de NÃO LOCALIZADO (dados.encontrado=False — erro, timeout,
        # challenge/bloqueio ou seletor ausente mesmo após os fallbacks).
        # Antes os dois casos ficavam indistinguíveis (mesmo log, e nenhuma
        # linha era salva no histórico por falta de preço).
        if dados.preco is not None and dados.disponivel:
            logger.info(
                "\033[32m  ✓ PREÇO: R$ %.2f\033[0m  |  %s",
                dados.preco, dados.nome[:70]
            )
            total_ok += 1
        elif not dados.encontrado:
            logger.error(
                "\033[31m  ✗ NÃO LOCALIZADO (erro/challenge/seletor ausente)\033[0m  |  %s",
                dados.nome[:70]
            )
            total_nao_localizado += 1
        elif not dados.disponivel:
            logger.error(
                "\033[31m  ✗ ESGOTADO (confirmado)\033[0m  |  %s",
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
        # Toda leitura agora vira uma linha (mesmo sem preço) — antes uma
        # leitura sem preço nunca era salva, então um esgotamento real nunca
        # aparecia na Dashboard (só o último preço válido anterior, sempre
        # desatualizado). `encontrado` é o que permite ao front distinguir
        # esgotado confirmado de não localizado sem reinterpretar disponivel.
        hist_payload = {
            "item_id":    item_id,
            "preco":      dados.preco,
            "disponivel": dados.disponivel,
            "encontrado": dados.encontrado,
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

        if dados.preco is None or not dados.disponivel:
            logger.info("Sem preço disponível — sem verificação de alertas")
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

            # ── Roteamento por dono (Sprint 9) ───────────────────────
            # Email vai para o email cadastrado do dono do item; Telegram
            # só para quem está habilitado (bot/chat é pessoal).
            dono       = usuarios.get(item.get("user_id")) or {}
            email_dono = dono.get("email")

            ok_email = enviar_email(alerta_info, destinatario=email_dono)
            if ok_email:
                logger.info("📧 Email enviado para %s", email_dono or "destinatário padrão")
            else:
                logger.error("📧 Falha ao enviar email para %s", email_dono or "destinatário padrão")

            if dono.get("telegram"):
                ok_telegram = enviar_telegram(alerta_info)
                if ok_telegram:
                    logger.info("📱 Telegram enviado com sucesso")
                else:
                    logger.error("📱 Falha ao enviar Telegram")
            else:
                ok_telegram = False
                logger.info("📱 Telegram desabilitado para o dono (%s) — não enviado",
                            email_dono or "sem dono")

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
    print(f"  \033[32m✓ Com preço:      {total_ok}\033[0m")
    print(f"  \033[31m✗ Esgotados:      {total_esgotado}\033[0m")
    if total_nao_localizado:
        print(f"  \033[31m✗ Não localizados: {total_nao_localizado}\033[0m")
    if total_erro:
        print(f"  \033[33m⚠ Erros:          {total_erro}\033[0m")
    if alertas_total:
        print(f"  \033[33m⚡ Alertas:      {alertas_total}\033[0m")
    print(f"\033[90m  {'═' * 60}\033[0m\n")

    logger.info("Coleta finalizada.")


if __name__ == "__main__":
    main()