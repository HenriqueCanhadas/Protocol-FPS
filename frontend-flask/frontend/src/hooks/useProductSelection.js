// hooks/useProductSelection.js — PROTOCOL FPS
// Seleção de uma linha da lista + navegação por teclado (↑/↓/Enter/Esc).
//
// Feature NOVA (Sprint 17/V3): o Dashboard hoje não tem conceito de "linha
// selecionada" — cada linha da tabela tem seus próprios botões de ação. Este
// hook nasce aqui mas só passa a ser consumido pelo ProductTable/ActionBar a
// partir da Sprint 19, quando a barra de ações passa a operar sobre a seleção
// global em vez de botões por linha.
//
// `items` deve ser a lista JÁ FILTRADA/ORDENADA visível na tela (mesma lista
// que alimenta a tabela), identificada por `item_id` — é sobre ela que as
// setas navegam.
import { useState, useEffect, useCallback } from "react";

export function useProductSelection({ items = [], enabled = true, onOpenHistory } = {}) {
  const [selectedId, setSelectedId] = useState(null);

  // Sprint 25/V4: clicar de novo no item já selecionado deseleciona
  const select = useCallback((id) => setSelectedId((atual) => (atual === id ? null : id)), []);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e) => {
      // Não interfere com digitação em campos de busca/inputs/selects
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!items.length) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const idx = items.findIndex((it) => it.item_id === selectedId);
        if (idx === -1) { setSelectedId(items[0].item_id); return; }
        const proximo = e.key === "ArrowDown"
          ? Math.min(idx + 1, items.length - 1)
          : Math.max(idx - 1, 0);
        setSelectedId(items[proximo].item_id);
      } else if (e.key === "Enter" && selectedId != null) {
        onOpenHistory?.(selectedId);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [items, selectedId, enabled, onOpenHistory]);

  // Se a lista visível mudar (filtro novo) e a seleção sair do recorte, limpa
  useEffect(() => {
    if (selectedId != null && !items.some((it) => it.item_id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  const selected = items.find((it) => it.item_id === selectedId) || null;

  return { selectedId, selected, select };
}
