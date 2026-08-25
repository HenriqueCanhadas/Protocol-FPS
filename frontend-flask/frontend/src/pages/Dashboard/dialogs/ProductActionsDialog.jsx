/**
 * pages/Dashboard/dialogs/ProductActionsDialog.jsx — PROTOCOL FPS
 * Ações do produto consolidadas num único dialog com "modos" (Sprint 20/V3):
 * menu → meta → nome → categoria, substituindo os 4 modais separados que
 * existiam antes (OpcoesModal + MetaModal + RenomearModal + CategoriaModal).
 * Os handlers de salvar/coletar/toggle continuam os mesmos de sempre — só
 * quem abre/fecha cada tela mudou.
 */
import { useState, useEffect, useRef } from "react";
import TerminalModal from "@/components/TerminalModal";
import { formatBRL } from "@/utils/format";
import { rotuloCategoria } from "@/pages/Dashboard/Dashboard.constants";

export default function ProductActionsDialog({
  item, categorias = [], onClose, onSalvarMeta, onSalvarNome, onSalvarCategoria, onColetar, onToggle,
}) {
  const [modo, setModo] = useState("menu"); // menu | meta | nome | categoria
  const [valor, setValor] = useState("");
  const [erroMeta, setErroMeta] = useState(false);
  const [nome, setNome] = useState("");
  const [erroNome, setErroNome] = useState(false);
  const [cat, setCat] = useState("");

  // Sempre reabre no menu — o dialog fica montado entre aberturas, então o
  // `modo` da vez anterior não pode sobreviver (mesma regra de sempre: sair
  // do menu e depois cancelar/salvar fecha tudo, nunca "volta" ao menu).
  const estavaAberto = useRef(false);
  useEffect(() => {
    if (item && !estavaAberto.current) setModo("menu");
    estavaAberto.current = !!item;
  }, [item]);

  // Preenche cada sub-form só ao entrar no modo correspondente
  useEffect(() => {
    if (!item) return;
    if (modo === "meta")      { setValor(item.preco_meta ? String(item.preco_meta) : ""); setErroMeta(false); }
    else if (modo === "nome") { setNome(item.nome_na_loja || ""); setErroNome(false); }
    else if (modo === "categoria") { setCat(item.categoria || ""); }
  }, [modo, item]);

  if (!item) return null;

  // ── Modo: menu de ações ──────────────────────────────────────
  if (modo === "menu") {
    const monitorando = item.monitorando !== false;
    const metaSub = item.preco_meta ? `Meta atual: ${formatBRL(item.preco_meta)}` : "Definir preço-alvo";

    return (
      <TerminalModal open onClose={onClose} overlayClassName="opcoes-overlay" className="opcoes-box">
        <div className="opcoes-header">
          <div>
            <div className="opcoes-eyebrow">Ações do produto</div>
            <div className="opcoes-nome">{item.nome_na_loja}</div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="opcoes-list">
          <button className="opcao-btn meta" onClick={() => setModo("meta")}>
            <span className="op-ic">◎</span>
            <span className="op-tx"><span className="op-tt">Editar meta</span><span className="op-sub">{metaSub}</span></span>
            <span className="op-arr">→</span>
          </button>
          <button className="opcao-btn" onClick={() => setModo("nome")}>
            <span className="op-ic">✎</span>
            <span className="op-tx"><span className="op-tt">Alterar nome</span><span className="op-sub">Renomeia o produto na tabela e nos alertas</span></span>
            <span className="op-arr">→</span>
          </button>
          <button className="opcao-btn" onClick={() => setModo("categoria")}>
            <span className="op-ic">▤</span>
            <span className="op-tx"><span className="op-tt">Alterar categoria</span><span className="op-sub">{`Categoria atual: ${item.categoria ? rotuloCategoria(item.categoria, categorias.find((c) => c.categoria === item.categoria)?.nome) : "—"}`}</span></span>
            <span className="op-arr">→</span>
          </button>
          <button className="opcao-btn coletar" onClick={() => { onClose(); onColetar(item); }}>
            <span className="op-ic">⚡</span>
            <span className="op-tx"><span className="op-tt">Coletar agora</span><span className="op-sub">Coleta somente este produto</span></span>
            <span className="op-arr">→</span>
          </button>
          <button className={`opcao-btn ${monitorando ? "toggle-on" : "toggle-off"}`} onClick={() => { onClose(); onToggle(item); }}>
            <span className="op-ic">{monitorando ? "⏸" : "▶"}</span>
            <span className="op-tx">
              <span className="op-tt">{monitorando ? "Desativar monitoramento" : "Ativar monitoramento"}</span>
              <span className="op-sub">{monitorando ? "Pausa as coletas (mantém histórico)" : "Volta a coletar nas próximas execuções"}</span>
            </span>
            <span className="op-arr">→</span>
          </button>
        </div>
      </TerminalModal>
    );
  }

  // ── Modo: editar meta ────────────────────────────────────────
  if (modo === "meta") {
    const preco = item.preco || null;
    const salvar = () => {
      const v = parseFloat(valor.replace(",", "."));
      if (!valor || isNaN(v) || v <= 0) { setErroMeta(true); return; }
      setErroMeta(false);
      onSalvarMeta(item.item_id, v);
    };
    const sugestoes = preco ? [5, 10, 15, 20].map((p) => ({ pct: p, val: (preco * (1 - p / 100)).toFixed(2) })) : [];

    return (
      <TerminalModal open onClose={onClose} overlayClassName="meta-modal-overlay" className="meta-modal" data-label="EDITAR META DE PREÇO">
        <div className="meta-modal-header">
          <div className="meta-modal-produto">
            <div className="mm-label">Produto</div>
            <div>{item.nome_na_loja}</div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="meta-modal-body">
          <div className="meta-preco-atual">
            <div className="mpa-label">Preço atual</div>
            <div className="mpa-val">{preco ? formatBRL(preco) : "sem coleta"}</div>
          </div>
          <div>
            <div className="field-label">Nova meta (R$)</div>
            <input
              className="field-input" type="number" placeholder="0,00" min="0" step="0.01"
              value={valor}
              onChange={(e) => { setValor(e.target.value); setErroMeta(false); }}
              onKeyDown={(e) => e.key === "Enter" && salvar()}
            />
            <div className="field-hint">Alerta quando o preço cair abaixo desse valor</div>
            {erroMeta && <div className="field-error">Informe um valor válido maior que zero</div>}
          </div>
          {sugestoes.length > 0 && (
            <div>
              <div className="field-label" style={{ marginBottom: ".6rem" }}>Sugestões rápidas</div>
              <div className="meta-sugestoes">
                {sugestoes.map(({ pct, val }) => (
                  <button key={pct} className="meta-sug-btn" onClick={() => setValor(val)}>
                    -{pct}% · {formatBRL(val)}
                  </button>
                ))}
                {item.preco_meta && (
                  <button className="btn-remover-meta" onClick={() => onSalvarMeta(item.item_id, null)}>
                    ✕ Remover meta
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="meta-modal-footer">
          <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn-primary" onClick={salvar}>SALVAR META</button>
        </div>
      </TerminalModal>
    );
  }

  // ── Modo: alterar nome ───────────────────────────────────────
  if (modo === "nome") {
    const salvar = () => {
      const v = nome.trim();
      if (!v) { setErroNome(true); return; }
      if (v === item.nome_na_loja) { onClose(); return; } // nada mudou
      onSalvarNome(item.item_id, v);
    };

    return (
      <TerminalModal open onClose={onClose} overlayClassName="meta-modal-overlay" className="meta-modal" data-label="ALTERAR NOME">
        <div className="meta-modal-header">
          <div className="meta-modal-produto">
            <div className="mm-label">Produto</div>
            <div>{item.nome_na_loja}</div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="meta-modal-body">
          <div>
            <div className="field-label">Novo nome</div>
            <input
              className="field-input" type="text" maxLength={120} autoFocus
              value={nome}
              onChange={(e) => { setNome(e.target.value); setErroNome(false); }}
              onKeyDown={(e) => e.key === "Enter" && salvar()}
            />
            <div className="field-hint">Como o produto aparece na tabela, no histórico e nos alertas</div>
            {erroNome && <div className="field-error">Informe um nome não vazio</div>}
          </div>
        </div>
        <div className="meta-modal-footer">
          <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn-primary" onClick={salvar}>SALVAR NOME</button>
        </div>
      </TerminalModal>
    );
  }

  // ── Modo: alterar categoria ──────────────────────────────────
  const salvarCategoria = () => {
    if (!cat) return;
    if (cat === item.categoria) { onClose(); return; } // nada mudou
    onSalvarCategoria(item.item_id, cat);
  };

  return (
    <TerminalModal open onClose={onClose} overlayClassName="meta-modal-overlay" className="meta-modal" data-label="ALTERAR CATEGORIA">
      <div className="meta-modal-header">
        <div className="meta-modal-produto">
          <div className="mm-label">Produto</div>
          <div>{item.nome_na_loja}</div>
        </div>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>
      <div className="meta-modal-body">
        <div>
          <div className="field-label" style={{ marginBottom: ".6rem" }}>Nova categoria</div>
          <div className="catm-grid">
            {categorias.map((c) => (
              <div key={c.categoria} className={`catm-chip${cat === c.categoria ? " sel" : ""}`} onClick={() => setCat(c.categoria)}>
                {rotuloCategoria(c.categoria, c.nome)}
              </div>
            ))}
          </div>
          <div className="field-hint" style={{ marginTop: ".6rem" }}>
            Reclassifica o produto nos filtros do Dashboard e na coleta por categoria
          </div>
        </div>
      </div>
      <div className="meta-modal-footer">
        <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
        <button className="btn-primary" onClick={salvarCategoria}>SALVAR CATEGORIA</button>
      </div>
    </TerminalModal>
  );
}
