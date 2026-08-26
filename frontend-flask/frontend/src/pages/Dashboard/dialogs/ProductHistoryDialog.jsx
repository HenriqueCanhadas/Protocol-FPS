/**
 * pages/Dashboard/dialogs/ProductHistoryDialog.jsx — PROTOCOL FPS
 * Modal de histórico completo de um item: gráfico tempo × preço no topo
 * (GraficoHistorico) + lista cronológica com seleção/remoção em massa.
 *
 * Renomeado de "HistoricoModal" ao mover para cá (Sprint 17/V3) — mesmo
 * comportamento, mesmo nome usado no protótipo de referência do zip.
 */
import { useState, useEffect } from "react";
import TerminalModal from "@/components/TerminalModal";
import GraficoHistorico from "@/pages/Dashboard/components/GraficoHistorico";
import { dataBRT, horaBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";
import { buscarHistoricoCompleto, removerNoServidor } from "@/services/dashboard.service";

export default function ProductHistoryDialog({ itemId, nome, onClose, showToast, onChange }) {
  const [dados, setDados]           = useState(null);
  const [reloadKey, setReloadKey]   = useState(0);
  const [selecionados, setSelecionados] = useState([]);   // ids marcados
  const [confirmando, setConfirmando]   = useState(false); // confirmar remoção em massa
  const [removendo, setRemovendo]       = useState(false);
  const [destaque, setDestaque]         = useState(null);  // leitura destacada via clique no gráfico

  useEffect(() => {
    if (!itemId) return;
    setDados(null);
    setSelecionados([]);
    setConfirmando(false);
    setDestaque(null);
    buscarHistoricoCompleto(itemId).then(setDados);
  }, [itemId, reloadKey]);

  if (!itemId) return null;

  // Clique num ponto do gráfico → rola até a leitura na lista e a destaca
  const irParaLeitura = (id) => {
    setDestaque(null); // re-dispara a animação mesmo clicando no mesmo ponto
    requestAnimationFrame(() => {
      setDestaque(id);
      document.getElementById(`hist-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const fmtData = (iso) => dataBRT(iso, { day: "2-digit", month: "2-digit", year: "2-digit" });
  const fmtHora = (iso) => horaBRT(iso, { hour: "2-digit", minute: "2-digit" });

  const toggleSel = (id) =>
    setSelecionados((sel) => sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);

  const todosMarcados = !!dados?.length && selecionados.length === dados.length;
  const toggleTodos = () =>
    setSelecionados(todosMarcados ? [] : (dados || []).map((d) => d.id));

  const removerSelecionados = async () => {
    setRemovendo(true);
    try {
      // Remoção server-side (SERVICE_KEY, ignora RLS); trata as FKs no servidor
      const removidos = await removerNoServidor("historico", selecionados);
      setRemovendo(false);
      if (!removidos) { showToast?.("Nada foi removido — registros não encontrados.", "error"); return; }
      showToast?.(`✓ ${removidos} registro(s) removido(s) do histórico.`, "ok");
      setConfirmando(false);
      setSelecionados([]);
      setReloadKey((k) => k + 1);   // recarrega o histórico
      onChange?.();                 // atualiza a tabela principal (preço/última coleta)
    } catch (e) {
      setRemovendo(false);
      showToast?.("Erro ao remover registros: " + e.message, "error");
    }
  };

  const precos = (dados || []).filter((d) => d.preco).map((d) => d.preco);
  const temPreco = precos.length > 0;
  const minPreco = temPreco ? Math.min(...precos) : 0;
  const maxPreco = temPreco ? Math.max(...precos) : 0;
  const amplitude = maxPreco - minPreco || 1;

  return (
    <TerminalModal open onClose={onClose} overlayClassName="modal-overlay" className="modal">
        <div className="modal-header">
          <div className="modal-title">HISTÓRICO — {nome?.substring(0, 40)}</div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {confirmando && (
            <div className="hist-confirm">
              <div className="hc-txt">
                Remover <strong>{selecionados.length} registro(s)</strong> selecionado(s) do histórico?
                <br />Esta ação não pode ser desfeita.
              </div>
              <div className="hc-actions">
                <button className="hc-cancel" disabled={removendo} onClick={() => setConfirmando(false)}>Cancelar</button>
                <button className="hc-ok" disabled={removendo} onClick={removerSelecionados}>
                  {removendo ? "Removendo…" : "Remover"}
                </button>
              </div>
            </div>
          )}

          {!dados ? (
            <div className="loading"><div className="spinner" /></div>
          ) : dados.length === 0 ? (
            <div className="empty">Sem histórico disponível.</div>
          ) : (
            <>
              <div className="hist-toolbar">
                <button className="hist-sel-all" onClick={toggleTodos}>
                  <span className={`hist-check${todosMarcados ? " on" : ""}`}>{todosMarcados ? "✓" : ""}</span>
                  {todosMarcados ? "Desmarcar todos" : "Selecionar todos"}
                </button>
                {selecionados.length > 0 && (
                  <div className="hist-bulk">
                    <span className="hist-sel-count">{selecionados.length} selecionado(s)</span>
                    <button className="hist-bulk-remove" onClick={() => setConfirmando(true)}>
                      ✕ Remover selecionados
                    </button>
                  </div>
                )}
              </div>

              <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)", marginBottom: "1.25rem", letterSpacing: ".15em" }}>
                ★ MENOR PREÇO: <span className="green">{temPreco ? formatBRL(minPreco) : "—"}</span>
                <span style={{ marginLeft: "1.5rem", color: "var(--text-muted)" }}>{dados.length} leitura(s)</span>
              </div>
              <GraficoHistorico dados={dados} onPontoClick={irParaLeitura} />
              <div className="chart-wrap">
                {dados.map((d) => {
                  const pct = d.preco ? ((d.preco - minPreco) / amplitude) * 70 + 10 : 0;
                  const isMin = d.preco === minPreco;
                  const isSel = selecionados.includes(d.id);
                  return (
                    <div key={d.id} id={`hist-row-${d.id}`}
                      className={`chart-row${isSel ? " sel" : ""}${destaque === d.id ? " destaque" : ""}`}>
                      <div className="chart-date dim">
                        <div>{fmtData(d.coletado_em)}</div>
                        <div className="chart-hora">{fmtHora(d.coletado_em)}</div>
                      </div>
                      <div className="bar-track">
                        <div className={`bar-fill${isMin ? " min-price" : ""}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className={`chart-price${isMin ? " min-price" : ""}`}>
                        {d.preco ? formatBRL(d.preco) : d.encontrado === false ? "não localizado" : "esgotado"}
                      </div>
                      <button
                        className={`hist-check${isSel ? " on" : ""}`}
                        title="Selecionar registro"
                        onClick={() => toggleSel(d.id)}
                      >{isSel ? "✓" : ""}</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
    </TerminalModal>
  );
}
