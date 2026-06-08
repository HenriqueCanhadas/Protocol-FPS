"""
main.py — PROTOCOL FPS
Ponto de entrada acionado pelo GitHub Actions (cron diário).

Fluxo:
  1. Busca todos os itens ativos no Supabase
  2. Para cada item, escolhe o scraper certo pela loja
  3. Salva o preço coletado em historico_precos
  4. Chama a function verificar_alertas() do Supabase
  5. Se houver alerta, dispara Email + Telegram e marca como notificado
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("main")

SCRAPERS = {
    "kabum":        KabumScraper,
    "terabyteshop": TerabyteScraper,
    "pichau":       PichauScraper,
}


def main() -> None:
    sb = get_supabase()

    resp = (
        sb.table("itens")
        .select("id, url, nome_na_loja, preco_meta, lojas(nome)")
        .eq("monitorando", True)
        .execute()
    )
    itens = resp.data
    logger.info("Itens a monitorar: %d", len(itens))

    for item in itens:
        item_id   = item["id"]
        url       = item["url"]
        nome_loja = item["lojas"]["nome"].lower().replace(" ", "")

        logger.info("Coletando [%s] %s", nome_loja, url)

        ScraperClass = SCRAPERS.get(nome_loja)
        if not ScraperClass:
            logger.warning("Loja desconhecida: %s — pulando", nome_loja)
            continue

        dados = ScraperClass().coletar(url)
        logger.info(
            "  → %s | R$ %.2f | disponível=%s",
            dados.nome,
            dados.preco or 0,
            dados.disponivel,
        )

        # ── Salva histórico ───────────────────────────────────────────
        # IMPORTANTE: a coluna 'preco' em historico_precos é NOT NULL
        # quando o produto está indisponível, não salvamos registro
        # (não há preço a registrar — o histórico ficará sem entry nessa coleta)
        if dados.preco is None:
            logger.info(
                "  → Sem preço coletado (disponivel=%s) — histórico não salvo",
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
            logger.info("  → Histórico salvo (id=%s, preço=R$%.2f)", historico_id, dados.preco)
        except Exception as exc:
            logger.error("  → Erro ao salvar histórico: %s", exc)
            continue

        if not dados.disponivel:
            logger.info("  → Produto indisponível — sem verificação de alertas")
            continue

        # ── Verifica alertas ──────────────────────────────────────────
        try:
            alertas_resp = sb.rpc(
                "verificar_alertas",
                {"p_item_id": item_id, "p_preco_atual": dados.preco},
            ).execute()
            alertas = alertas_resp.data or []
        except Exception as exc:
            logger.warning("  → verificar_alertas indisponível: %s", exc)
            alertas = []

        for alerta in alertas:
            tipo           = alerta["tipo"]
            preco_gatilho  = alerta["preco_gatilho"]
            preco_anterior = alerta.get("preco_anterior")

            logger.info("  ⚡ Alerta: %s (R$ %.2f)", tipo, preco_gatilho)

            mensagem = _montar_mensagem(dados, tipo, preco_gatilho, preco_anterior)

            ok_email    = enviar_email(mensagem, dados.nome)
            ok_telegram = enviar_telegram(mensagem)

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
                logger.error("  → Erro ao salvar alerta: %s", exc)

    logger.info("Coleta finalizada.")


def _montar_mensagem(
    dados,
    tipo: str,
    preco_gatilho: float,
    preco_anterior: float | None,
) -> str:
    if tipo == "abaixo_meta":
        return (
            f"🎯 *PROTOCOL FPS — Preço abaixo da meta!*\n\n"
            f"*{dados.nome}*\n"
            f"💰 Preço atual: R$ {preco_gatilho:,.2f}\n"
            f"🔗 {dados.url}"
        )
    else:
        queda = (preco_anterior - preco_gatilho) if preco_anterior else 0
        return (
            f"📉 *PROTOCOL FPS — Queda de preço detectada!*\n\n"
            f"*{dados.nome}*\n"
            f"💰 Novo preço: R$ {preco_gatilho:,.2f}\n"
            f"📊 Era: R$ {preco_anterior:,.2f}  (↓ R$ {queda:,.2f})\n"
            f"🔗 {dados.url}"
        )


if __name__ == "__main__":
    main()