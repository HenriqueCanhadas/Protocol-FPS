"""
Notificação por email (Gmail SMTP) — PROTOCOL FPS
Variáveis necessárias no .env / GitHub Secrets:
  EMAIL_REMETENTE    = pedrosa.canhadas@gmail.com
  EMAIL_SENHA_APP    = (senha de app do Google, não a senha normal)
  EMAIL_DESTINATARIO = pedrosa.canhadas@gmail.com

Recebe um dicionário de alerta (montado em main.py) e gera um email HTML
no tema "terminal/cyberpunk" da marca, com fallback em texto puro.
Campos esperados: nome, url, loja, tipo, preco_atual, preco_anterior, meta
"""
import os
import html
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .formato import TITULOS, fmt_brl, fmt_pct, calcular_queda

logger = logging.getLogger(__name__)


# ── Linha de comparação de preço (rótulo + valor) no corpo HTML ──────────
def _linha_comp(rotulo: str, valor: str, cor: str) -> str:
    return f"""
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#7a9a72;letter-spacing:.05em;">{html.escape(rotulo)}</td>
        <td style="padding:6px 0;font-size:15px;color:{cor};text-align:right;font-weight:bold;">{valor}</td>
      </tr>"""


def _html(a: dict) -> str:
    is_meta = a.get("tipo") == "abaixo_meta"
    titulo  = TITULOS.get(a.get("tipo"), "Alerta de preço")
    accent  = "#ffb800" if is_meta else "#39ff14"
    badge   = "META ATINGIDA" if is_meta else "QUEDA DE PREÇO"

    nome  = html.escape(a.get("nome") or "Produto")
    loja  = html.escape(a.get("loja") or "")
    atual = fmt_brl(a.get("preco_atual"))
    queda, pct = calcular_queda(a.get("preco_atual"), a.get("preco_anterior"))

    # Linhas de comparação
    comp = ""
    if a.get("meta"):
        comp += _linha_comp("Meta definida", fmt_brl(a["meta"]), "#d8f0d0")
    if a.get("preco_anterior"):
        comp += _linha_comp("Preço anterior", fmt_brl(a["preco_anterior"]), "#d8f0d0")
    if queda and queda > 0:
        comp += _linha_comp("Você economiza", f"{fmt_brl(queda)} &nbsp;(-{fmt_pct(pct)}%)", "#39ff14")

    comp_bloco = f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="margin-top:18px;border-top:1px solid #253322;">
          {comp}
        </table>""" if comp else ""

    loja_bloco = f"""
        <div style="margin-top:6px;font-size:12px;letter-spacing:.15em;
                    text-transform:uppercase;color:#7a9a72;">🏪 {loja}</div>""" if loja else ""

    botao = ""
    if a.get("url"):
        botao = f"""
        <tr>
          <td align="center" style="padding:28px 0 4px;">
            <a href="{html.escape(a['url'])}" target="_blank"
               style="display:inline-block;padding:13px 34px;border:1px solid {accent};
                      color:{accent};text-decoration:none;font-size:14px;
                      letter-spacing:.18em;text-transform:uppercase;
                      font-family:'Courier New',monospace;">Ver produto na loja →</a>
          </td>
        </tr>"""

    return f"""<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060908;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060908;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#0d1410;border:1px solid #253322;border-top:3px solid {accent};">

        <!-- Cabeçalho -->
        <tr>
          <td style="padding:22px 32px;border-bottom:1px solid #253322;">
            <span style="font-family:'Courier New',monospace;font-size:22px;font-weight:bold;
                         letter-spacing:.12em;color:#39ff14;">⚡ PROTOCOL FPS</span>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:30px 32px;font-family:'Courier New',monospace;">
            <span style="display:inline-block;padding:4px 12px;border:1px solid {accent};
                         color:{accent};font-size:11px;letter-spacing:.2em;
                         text-transform:uppercase;">{badge}</span>

            <h1 style="margin:18px 0 4px;font-size:17px;line-height:1.45;color:#d8f0d0;
                       font-weight:600;font-family:Arial,sans-serif;">{nome}</h1>
            {loja_bloco}

            <!-- Preço em destaque -->
            <div style="margin-top:24px;padding:20px;background:#131c15;border:1px solid #253322;text-align:center;">
              <div style="font-size:12px;letter-spacing:.25em;text-transform:uppercase;color:#7a9a72;">Preço atual</div>
              <div style="margin-top:8px;font-size:38px;font-weight:bold;color:{accent};
                          letter-spacing:.02em;font-family:Arial,sans-serif;">{atual}</div>
            </div>

            {comp_bloco}

            <!-- CTA -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              {botao}
            </table>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="padding:18px 32px;border-top:1px solid #1e2e1a;background:#0a110c;">
            <span style="font-size:11px;letter-spacing:.1em;color:#4a6644;
                         font-family:'Courier New',monospace;">
              {html.escape(titulo)} · Monitoramento automático de preços de hardware
            </span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _texto_puro(a: dict) -> str:
    """Versão em texto puro (fallback para clientes sem HTML)."""
    titulo = TITULOS.get(a.get("tipo"), "Alerta de preço")
    queda, pct = calcular_queda(a.get("preco_atual"), a.get("preco_anterior"))

    linhas = [
        "PROTOCOL FPS",
        titulo.upper(),
        "",
        a.get("nome") or "Produto",
    ]
    if a.get("loja"):
        linhas.append(f"Loja: {a['loja']}")
    linhas += ["", f"Preço atual: {fmt_brl(a.get('preco_atual'))}"]
    if a.get("meta"):
        linhas.append(f"Meta: {fmt_brl(a['meta'])}")
    if a.get("preco_anterior"):
        linhas.append(f"Preço anterior: {fmt_brl(a['preco_anterior'])}")
    if queda and queda > 0:
        linhas.append(f"Economia: {fmt_brl(queda)} (-{fmt_pct(pct)}%)")
    if a.get("url"):
        linhas += ["", a["url"]]
    return "\n".join(linhas)


def enviar_email(alerta: dict, destinatario: str | None = None) -> bool:
    """
    Envia o alerta por email. `destinatario` (Sprint 9) direciona ao email
    cadastrado do DONO do item; sem ele, cai no EMAIL_DESTINATARIO do .env
    (compatibilidade com itens sem dono ou chamadas antigas).
    """
    remetente    = os.environ.get("EMAIL_REMETENTE")
    senha        = os.environ.get("EMAIL_SENHA_APP")
    destinatario = destinatario or os.environ.get("EMAIL_DESTINATARIO")

    if not all([remetente, senha, destinatario]):
        logger.error("Variáveis de email não configuradas")
        return False

    nome    = (alerta.get("nome") or "Produto")[:60]
    titulo  = TITULOS.get(alerta.get("tipo"), "Alerta de preço")
    assunto = f"[PROTOCOL FPS] {titulo} — {nome}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"]    = remetente
    msg["To"]      = destinatario

    # Ordem importa: o cliente prioriza a última parte que sabe renderizar (HTML)
    msg.attach(MIMEText(_texto_puro(alerta), "plain", "utf-8"))
    msg.attach(MIMEText(_html(alerta),       "html",  "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
            servidor.login(remetente, senha)
            servidor.sendmail(remetente, destinatario, msg.as_string())
        logger.info("Email enviado com sucesso")
        return True
    except Exception as exc:
        logger.error("Falha ao enviar email: %s", exc)
        return False
