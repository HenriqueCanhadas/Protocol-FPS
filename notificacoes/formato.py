"""
formato.py — Helpers de formatação compartilhados pelas notificações.

Centraliza a formatação de moeda (pt-BR), o cálculo de queda de preço e os
títulos por tipo de alerta, para que Email e Telegram exibam os mesmos números
de forma consistente — cada um com seu próprio layout.
"""
from __future__ import annotations


# Títulos legíveis por tipo de alerta retornado por verificar_alertas()
TITULOS = {
    "abaixo_meta": "Preço abaixo da meta",
    "queda_preco": "Queda de preço detectada",
}


def fmt_brl(valor) -> str:
    """3299.9 → 'R$ 3.299,90' (separadores no padrão brasileiro)."""
    if valor is None:
        return "—"
    try:
        s = f"{float(valor):,.2f}"          # 3,299.90 (padrão en-US)
    except (ValueError, TypeError):
        return "—"
    # Troca os separadores para pt-BR: vírgula ↔ ponto
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def fmt_pct(pct: float) -> str:
    """8.34 → '8,3' (uma casa decimal, vírgula brasileira)."""
    return f"{pct:.1f}".replace(".", ",")


def calcular_queda(atual, anterior):
    """
    Retorna (queda_abs, queda_pct) quando há um preço anterior válido.
    Caso contrário (None, None).
    """
    try:
        atual = float(atual)
        anterior = float(anterior)
    except (ValueError, TypeError):
        return None, None
    if anterior <= 0 or atual <= 0:
        return None, None
    queda = anterior - atual
    pct = (queda / anterior) * 100
    return queda, pct
