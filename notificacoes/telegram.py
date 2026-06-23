"""
Notificação por Telegram — PROTOCOL FPS
Variáveis necessárias no .env / GitHub Secrets:
  TELEGRAM_BOT_TOKEN = 123456:ABC-xyz  (do @BotFather)
  TELEGRAM_CHAT_ID   = seu chat_id numérico

Recebe um dicionário de alerta (montado em main.py) e formata uma mensagem
Markdown limpa e legível. Campos esperados:
  nome, url, loja, tipo, preco_atual, preco_anterior, meta
"""
import os
import re
import logging
import urllib.request
import urllib.parse
import json
from datetime import datetime, timezone, timedelta

from .formato import fmt_brl, fmt_pct, calcular_queda

# Brasília = UTC-3 (sem horário de verão desde 2019)
_BRT = timezone(timedelta(hours=-3))

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def _safe(texto: str) -> str:
    """Remove caracteres que quebram o Markdown legado do Telegram."""
    return re.sub(r"[*_`\[\]]", "", texto or "").strip()


_SEP = "━━━━━━━━━━━━━━━━━━━━"


def _formatar(a: dict) -> str:
    """
    Monta a mensagem em estilo de árvore (┣ ┗), enxuta e legível.
    Cada ramo só aparece quando há dado para ele.
    """
    nome  = _safe(a.get("nome") or "Produto")
    loja  = _safe(a.get("loja") or "")
    atual = fmt_brl(a.get("preco_atual"))
    queda, pct = calcular_queda(a.get("preco_atual"), a.get("preco_anterior"))

    titulo = "🎯 *META ATINGIDA*" if a.get("tipo") == "abaixo_meta" else "🔥 *QUEDA DE PREÇO*"
    data_str = datetime.now(_BRT).strftime("%d/%m/%Y %H:%M")

    # Ramos do corpo (apenas os que têm valor)
    ramos = []
    if loja:
        ramos.append(f"🏪 {loja}")
    ramos.append(f"💵 *{atual}*")
    if a.get("meta"):
        ramos.append(f"🎯 Meta: {fmt_brl(a['meta'])}")
    if a.get("preco_anterior"):
        ramos.append(f"📊 Anterior: {fmt_brl(a['preco_anterior'])}")
    if queda and queda > 0:
        ramos.append(f"💰 Economia: *{fmt_brl(queda)}* ({fmt_pct(pct)}% OFF)")
    if a.get("url"):
        ramos.append(f"[🛒 COMPRAR AGORA]({a['url']})")

    linhas = [
        f"{titulo} — PROTOCOL FPS",
        f"📅 {data_str}",
        _SEP,
        f"📦 *{nome}*",
    ]
    for i, ramo in enumerate(ramos):
        conector = "┗" if i == len(ramos) - 1 else "┣"
        linhas.append(f"{conector} {ramo}")
    linhas += [_SEP, "🤖 _Monitoramento Automático — PROTOCOL FPS_"]

    return "\n".join(linhas)


def enviar_telegram(alerta: dict) -> bool:
    token   = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        logger.error("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados")
        return False

    mensagem = _formatar(alerta)

    url  = TELEGRAM_API.format(token=token)
    body = json.dumps({
        "chat_id":                  chat_id,
        "text":                     mensagem,
        "parse_mode":               "Markdown",
        "disable_web_page_preview": True,
    }).encode()

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resultado = json.loads(resp.read())
            if resultado.get("ok"):
                logger.info("Telegram enviado com sucesso")
                return True
            logger.error("Telegram retornou erro: %s", resultado)
            return False
    except Exception as exc:
        logger.error("Falha ao enviar Telegram: %s", exc)
        return False
