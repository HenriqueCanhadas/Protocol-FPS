"""
Notificação por email (Gmail SMTP) — PROTOCOL FPS
Variáveis necessárias no .env / GitHub Secrets:
  EMAIL_REMETENTE   = pedrosa.canhadas@gmail.com
  EMAIL_SENHA_APP   = (senha de app do Google, não a senha normal)
  EMAIL_DESTINATARIO = pedrosa.canhadas@gmail.com
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def enviar_email(mensagem: str, assunto_produto: str) -> bool:
    remetente    = os.environ.get("EMAIL_REMETENTE")
    senha        = os.environ.get("EMAIL_SENHA_APP")
    destinatario = os.environ.get("EMAIL_DESTINATARIO")

    if not all([remetente, senha, destinatario]):
        logger.error("Variáveis de email não configuradas")
        return False

    assunto = f"[PROTOCOL FPS] Alerta de preço — {assunto_produto}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"]    = remetente
    msg["To"]      = destinatario

    # Corpo em texto puro (fallback) e HTML
    texto_puro = mensagem.replace("*", "").replace("_", "")
    html = f"""
    <html><body>
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#1a1a2e">⚡ PROTOCOL FPS</h2>
        <pre style="background:#f4f4f4;padding:16px;border-radius:8px;font-size:15px">
{texto_puro}
        </pre>
        <p style="color:#888;font-size:12px">Monitoramento automático de preços de hardware.</p>
      </div>
    </body></html>
    """

    msg.attach(MIMEText(texto_puro, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
            servidor.login(remetente, senha)
            servidor.sendmail(remetente, destinatario, msg.as_string())
        logger.info("Email enviado com sucesso")
        return True
    except Exception as exc:
        logger.error("Falha ao enviar email: %s", exc)
        return False