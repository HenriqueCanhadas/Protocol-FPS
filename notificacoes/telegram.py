"""
Notificação por Telegram — PROTOCOL FPS
Variáveis necessárias no .env / GitHub Secrets:
  TELEGRAM_BOT_TOKEN = 123456:ABC-xyz  (do @BotFather)
  TELEGRAM_CHAT_ID   = seu chat_id numérico
"""
import os
import logging
import urllib.request
import urllib.parse
import json

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def enviar_telegram(mensagem: str) -> bool:
    token   = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        logger.error("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados")
        return False

    url  = TELEGRAM_API.format(token=token)
    body = json.dumps({
        "chat_id":    chat_id,
        "text":       mensagem,
        "parse_mode": "Markdown",
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