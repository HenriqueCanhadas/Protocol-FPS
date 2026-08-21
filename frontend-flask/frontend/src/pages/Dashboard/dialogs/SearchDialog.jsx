/**
 * pages/Dashboard/dialogs/SearchDialog.jsx — PROTOCOL FPS
 * Pop-up de busca por produto/loja (Sprint 24/V4) — substitui o campo de
 * texto que antes abria inline na própria linha de filtros. Mesmo estado
 * `termoBusca`/`setTermoBusca` de useDashboardFilters (persistido em
 * localStorage); mesma família visual (TerminalModal + .meta-modal) usada
 * pelos modos "Editar meta"/"Alterar nome" do ProductActionsDialog.
 */
import { useState, useEffect } from "react";
import TerminalModal from "@/components/TerminalModal";

export default function SearchDialog({ open, termoBusca, onChange, onClose }) {
  const [valor, setValor] = useState(termoBusca);

  // Reabre sempre com o termo já salvo (edição, não substituição às cegas)
  useEffect(() => { if (open) setValor(termoBusca); }, [open, termoBusca]);

  if (!open) return null;

  const aplicar = () => { onChange(valor.trim()); onClose(); };
  const limpar = () => { setValor(""); onChange(""); onClose(); };

  return (
    <TerminalModal open onClose={onClose} overlayClassName="meta-modal-overlay" className="meta-modal" data-label="BUSCAR PRODUTOS">
      <div className="meta-modal-header">
        <div className="meta-modal-produto">
          <div className="mm-label">Filtro</div>
          <div>Produto ou loja</div>
        </div>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>
      <div className="meta-modal-body">
        <div>
          <div className="field-label">Termo de busca</div>
          <input
            className="field-input" type="text" autoFocus
            placeholder="Nome do produto ou da loja..."
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && aplicar()}
          />
          <div className="field-hint">Filtra a tabela por nome do produto e nome da loja</div>
        </div>
      </div>
      <div className="meta-modal-footer">
        <button className="btn-secondary" onClick={limpar}>LIMPAR</button>
        <button className="btn-primary" onClick={aplicar}>BUSCAR</button>
      </div>
    </TerminalModal>
  );
}
