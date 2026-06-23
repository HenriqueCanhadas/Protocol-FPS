/**
 * pages/Dashboard.jsx — PROTOCOL FPS
 * Página principal: stats, tabela de preços, alertas, botão coletar.
 */
import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "../services/supabase";
import ConfirmModal from "../components/ConfirmModal";

/**
 * Remove produtos/coletas via endpoint server-side (/api/remover),
 * que usa a SERVICE_KEY e ignora o RLS. Retorna a quantidade removida.
 * Flask atende em dev; Vercel Function em produção.
 */
async function removerNoServidor(tipo, ids) {
  const resp = await fetch("/api/remover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, ids }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data.removed ?? 0;
}

/* ── estilos locais ─────────────────────────────────────────── */
const css = `
#app { display:flex; flex-direction:column; min-height:100vh; }
.stats-bar {
  display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:1px; background:var(--border); border-bottom:1px solid var(--border2);
}
.stat-card {
  background:var(--bg2); padding:1.25rem 1.75rem;
  display:flex; flex-direction:column; gap:.35rem; transition:background .2s;
}
.stat-card:hover { background:var(--bg3); }
.stat-label { font-size:var(--fs-xs); letter-spacing:.3em; color:var(--text-dim); text-transform:uppercase; }
.stat-value { font-family:var(--display); font-size:2.2rem; letter-spacing:.04em; color:var(--green); line-height:1; }
.stat-sub   { font-size:var(--fs-xs); color:var(--text-muted); line-height:1.5; word-break:break-word; }
.stat-value.amber { color:var(--amber); }

.dash-main { flex:1; padding:1.75rem 1.5rem; display:flex; flex-direction:column; gap:2rem; }
.section-header { display:flex; align-items:center; gap:.9rem; margin-bottom:1.25rem; }
.section-title  { font-size:var(--fs-sm); letter-spacing:.3em; text-transform:uppercase; color:var(--text-dim); white-space:nowrap; }
.section-line   { flex:1; height:1px; background:linear-gradient(to right,var(--border2),transparent); }

/* toolbar */
.toolbar { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1.25rem; }
.toolbar-row { display:flex; gap:.6rem; flex-wrap:wrap; align-items:center; }
.search-wrap { position:relative; flex:1; min-width:200px; }
.search-wrap .search-icon { position:absolute; left:.85rem; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:.9rem; pointer-events:none; }
.search-input {
  width:100%; background:var(--bg2); border:1px solid var(--border2);
  color:var(--text); font-family:var(--mono); font-size:var(--fs-sm);
  padding:.65rem .9rem .65rem 2.4rem; outline:none;
  transition:border-color .2s,box-shadow .2s; letter-spacing:.04em;
}
.search-input::placeholder { color:var(--text-muted); }
.search-input:focus { border-color:var(--green-dim); box-shadow:0 0 0 1px var(--green-dim); }
.btn-search-clear {
  position:absolute; right:.75rem; top:50%; transform:translateY(-50%);
  background:none; border:none; color:var(--text-muted);
  cursor:pointer; font-size:.9rem; transition:color .15s; padding:.15rem;
}
.btn-search-clear:hover { color:var(--red); }

.btn-coletar {
  display:flex; align-items:center; gap:.6rem;
  background:transparent; border:1px solid var(--amber);
  color:var(--amber); font-family:var(--mono); font-size:var(--fs-sm);
  letter-spacing:.18em; padding:.7rem 1.5rem; cursor:pointer; text-transform:uppercase;
  transition:background .2s,box-shadow .2s;
}
.btn-coletar:hover { background:rgba(255,184,0,.1); box-shadow:0 0 20px rgba(255,184,0,.2); }
.btn-coletar:disabled { opacity:.4; cursor:not-allowed; }

.filters { display:flex; gap:.5rem; flex-wrap:wrap; }
.filter-btn {
  background:var(--bg2); border:1px solid var(--border2);
  color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-sm);
  letter-spacing:.2em; padding:.5rem 1.1rem; cursor:pointer; text-transform:uppercase; transition:all .15s;
}
.filter-btn:hover { border-color:var(--green-dim); color:var(--text); }
.filter-btn.active { border-color:var(--green); color:var(--green); background:var(--green-soft); }

.sort-controls { display:flex; gap:.4rem; flex-wrap:wrap; }
.sort-btn {
  display:flex; align-items:center; gap:.4rem;
  background:var(--bg2); border:1px solid var(--border2);
  color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-xs);
  letter-spacing:.15em; padding:.55rem .9rem; cursor:pointer; text-transform:uppercase; transition:all .15s; white-space:nowrap;
}
.sort-btn:hover { border-color:var(--green-dim); color:var(--text); }
.sort-btn.active { border-color:var(--green); color:var(--green); background:var(--green-soft); }
.result-count { font-size:var(--fs-xs); color:var(--text-muted); letter-spacing:.15em; margin-left:auto; white-space:nowrap; }

/* progresso */
.coleta-progress { background:var(--bg2); border:1px solid var(--border2); padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.6rem; }
.coleta-status { display:flex; justify-content:space-between; align-items:center; font-size:var(--fs-sm); color:var(--text-dim); letter-spacing:.1em; }
.coleta-status .item-atual { color:var(--text); max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.progress-bar { height:3px; background:var(--border2); position:relative; overflow:hidden; }
.progress-fill { position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg,var(--green-dim),var(--green)); transition:width .4s ease; box-shadow:0 0 10px rgba(57,255,20,.3); }

/* tabela */
.price-table-wrap { overflow-x:auto; border:1px solid var(--border2); }
table { width:100%; border-collapse:collapse; font-size:var(--fs-base); }
thead { background:var(--bg3); }
th { text-align:left; padding:.85rem 1.1rem; font-size:var(--fs-xs); letter-spacing:.25em; text-transform:uppercase; color:var(--text-dim); border-bottom:1px solid var(--border2); white-space:nowrap; }
tbody tr { border-bottom:1px solid var(--border); transition:background .15s; }
tbody tr:hover { background:rgba(57,255,20,.025); }
tbody tr:last-child { border-bottom:none; }
tbody tr.row-off { opacity:.55; }
tbody tr.row-off:hover { opacity:.75; }
td { padding:.9rem 1.1rem; vertical-align:middle; }
.td-produto { min-width:220px; }
.prod-nome { font-size:var(--fs-base); font-weight:500; line-height:1.4; }
.prod-cat  { font-size:var(--fs-xs); color:var(--text-dim); margin-top:.2rem; letter-spacing:.1em; text-transform:uppercase; }
.loja-badge { display:inline-block; border:1px solid var(--border2); padding:.25rem .65rem; font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); }
.price-current { font-family:var(--display); font-size:1.45rem; letter-spacing:.03em; color:var(--green); }
.price-meta    { font-size:var(--fs-xs); color:var(--text-muted); margin-top:.15rem; }
.price-unavailable { color:var(--text-muted); font-size:var(--fs-sm); }
.status-badge { font-size:var(--fs-xs); letter-spacing:.15em; text-transform:uppercase; padding:.3rem .75rem; border:1px solid; }
.status-badge.ok    { color:var(--green); border-color:var(--green-dim); }
.status-badge.out   { color:var(--text-muted); border-color:var(--border); }
.status-badge.alert { color:var(--amber); border-color:var(--amber); }
.status-badge.off   { color:var(--red); border-color:rgba(255,68,68,.4); }
.prod-nome-link { color:inherit; text-decoration:none; border-bottom:1px solid transparent; transition:color .15s,border-color .15s; }
.prod-nome-link:hover { color:var(--green); border-bottom-color:var(--green-dim); }

/* ações tabela */
.td-actions { display:flex; flex-direction:column; gap:.4rem; align-items:flex-start; min-width:130px; }
.action-btn { position:relative; display:flex; align-items:center; justify-content:center; background:none; border:1px solid transparent; font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.1em; padding:.35rem .65rem .35rem 1.75rem; cursor:pointer; text-transform:uppercase; transition:all .18s; white-space:nowrap; width:100%; }
.action-btn .ab-icon { position:absolute; left:.6rem; top:50%; transform:translateY(-50%); flex-shrink:0; }
.action-btn .ab-label { text-align:center; }
.action-btn.hist  { color:var(--text-dim); border-color:var(--border2); }
.action-btn.hist:hover { color:var(--amber); border-color:var(--amber); background:rgba(255,184,0,.08); }
.action-btn.toggle-on  { color:var(--amber); border-color:rgba(255,184,0,.35); }
.action-btn.toggle-on:hover { background:rgba(255,184,0,.08); border-color:var(--amber); }
.action-btn.toggle-off { color:var(--green); border-color:rgba(57,255,20,.25); }
.action-btn.toggle-off:hover { background:var(--green-soft); border-color:var(--green); }
.action-btn.remove { color:var(--text-muted); border-color:transparent; }
.action-btn.remove:hover { color:var(--red); border-color:rgba(255,68,68,.35); background:rgba(255,68,68,.06); }
.action-btn.meta  { color:var(--text-dim); border-color:var(--border2); }
.action-btn.meta:hover { color:var(--amber); border-color:rgba(255,184,0,.4); background:rgba(255,184,0,.06); }

/* modal histórico */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.88); display:flex; align-items:center; justify-content:center; z-index:200; animation:fadeIn .2s ease; }
.modal { background:var(--bg2); border:1px solid var(--border2); border-top:2px solid var(--green-dim); width:min(720px,96vw); max-height:88vh; overflow-y:auto; display:flex; flex-direction:column; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.1rem 1.5rem; border-bottom:1px solid var(--border2); position:sticky; top:0; background:var(--bg2); }
.modal-title { font-size:var(--fs-sm); letter-spacing:.3em; text-transform:uppercase; color:var(--green); }
.btn-close { background:none; border:none; color:var(--text-dim); font-size:1.4rem; cursor:pointer; line-height:1; transition:color .15s; padding:.2rem .4rem; }
.btn-close:hover { color:var(--red); }
.modal-body { padding:1.75rem; }
.chart-wrap { display:flex; flex-direction:column; gap:.5rem; }
.chart-row { display:grid; grid-template-columns:78px 1fr 96px 30px; gap:.8rem; align-items:center; font-size:var(--fs-sm); padding:.15rem 0; }
.chart-date { color:var(--text-dim); line-height:1.25; }
.chart-hora { font-size:var(--fs-xs); color:var(--text-muted); }
.bar-track { height:20px; background:var(--bg3); position:relative; overflow:hidden; border-radius:1px; }
.bar-fill { position:absolute; left:0; top:0; bottom:0; background:var(--green-dim); transition:width .6s cubic-bezier(.4,0,.2,1); }
.bar-fill.min-price { background:var(--green); }
.chart-price { text-align:right; color:var(--text); font-size:var(--fs-sm); }
.chart-price.min-price { color:var(--green); }
.chart-row.sel { background:var(--green-soft); }
.hist-check { width:18px; height:18px; padding:0; display:flex; align-items:center; justify-content:center; background:var(--bg3); border:1px solid var(--border2); color:var(--green); font-size:.7rem; line-height:1; cursor:pointer; transition:all .15s; border-radius:1px; }
.hist-check:hover { border-color:var(--green-dim); }
.hist-check.on { background:var(--green-soft); border-color:var(--green); }

/* toolbar de seleção do histórico */
.hist-toolbar { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:1rem; flex-wrap:wrap; }
.hist-sel-all { display:flex; align-items:center; gap:.55rem; background:none; border:none; color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:color .15s; padding:0; }
.hist-sel-all:hover { color:var(--text); }
.hist-bulk { display:flex; align-items:center; gap:.85rem; }
.hist-sel-count { font-size:var(--fs-xs); color:var(--text-dim); letter-spacing:.1em; }
.hist-bulk-remove { background:none; border:1px solid var(--red); color:var(--red); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.12em; text-transform:uppercase; padding:.45rem .9rem; cursor:pointer; transition:all .15s; }
.hist-bulk-remove:hover { background:rgba(255,68,68,.12); }
.hist-confirm { display:flex; flex-wrap:wrap; align-items:center; gap:.6rem .9rem; padding:.9rem 1.1rem; margin-bottom:1.1rem; background:rgba(255,68,68,.06); border:1px solid rgba(255,68,68,.4); border-left:3px solid var(--red); animation:slideDown .2s ease; }
.hist-confirm .hc-txt { flex:1; min-width:200px; font-size:var(--fs-sm); color:var(--text-dim); line-height:1.5; }
.hist-confirm .hc-txt strong { color:var(--text); }
.hist-confirm .hc-actions { display:flex; gap:.5rem; }
.hist-confirm button { font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.12em; text-transform:uppercase; padding:.45rem .9rem; cursor:pointer; transition:all .15s; background:none; }
.hist-confirm .hc-cancel { border:1px solid var(--border2); color:var(--text-dim); }
.hist-confirm .hc-cancel:hover { border-color:var(--text-dim); color:var(--text); }
.hist-confirm .hc-ok { border:1px solid var(--red); color:var(--red); }
.hist-confirm .hc-ok:hover { background:rgba(255,68,68,.12); }

/* modal meta */
.meta-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.88); display:flex; align-items:center; justify-content:center; z-index:250; animation:fadeIn .2s ease; }
.meta-modal { background:var(--bg2); border:1px solid var(--border2); border-top:2px solid var(--amber); width:min(460px,94vw); display:flex; flex-direction:column; position:relative; }
.meta-modal::before { content:'EDITAR META DE PREÇO'; position:absolute; top:-1px; left:1.5rem; background:var(--bg2); color:var(--amber); font-size:var(--fs-xs); letter-spacing:.3em; padding:0 .6rem; transform:translateY(-50%); text-transform:uppercase; }
.meta-modal-header { display:flex; align-items:flex-start; justify-content:space-between; padding:1.5rem 1.5rem 0; gap:1rem; }
.meta-modal-produto { font-size:var(--fs-sm); color:var(--text); line-height:1.5; flex:1; }
.meta-modal-produto .mm-label { font-size:var(--fs-xs); color:var(--text-dim); letter-spacing:.2em; text-transform:uppercase; margin-bottom:.3rem; }
.meta-modal-body { padding:1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
.meta-preco-atual { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; background:var(--bg3); border:1px solid var(--border2); }
.meta-preco-atual .mpa-label { font-size:var(--fs-xs); color:var(--text-dim); letter-spacing:.2em; text-transform:uppercase; }
.meta-preco-atual .mpa-val   { font-family:var(--display); font-size:1.4rem; color:var(--green); }
.meta-sugestoes { display:flex; gap:.5rem; flex-wrap:wrap; }
.meta-sug-btn { background:var(--bg3); border:1px solid var(--border2); color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; padding:.35rem .75rem; cursor:pointer; transition:all .15s; }
.meta-sug-btn:hover { border-color:var(--amber); color:var(--amber); background:rgba(255,184,0,.07); }
.meta-modal-footer { display:flex; gap:.75rem; padding:1.25rem 1.5rem; border-top:1px solid var(--border2); background:var(--bg3); }
.meta-modal-footer .btn-primary  { flex:1; border-color:var(--amber); color:var(--amber); }
.meta-modal-footer .btn-primary:hover { background:rgba(255,184,0,.1); }
.meta-modal-footer .btn-secondary { flex:0 0 auto; }
.btn-remover-meta { background:none; border:none; color:var(--text-muted); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; cursor:pointer; padding:0; transition:color .2s; }
.btn-remover-meta:hover { color:var(--red); }

/* botão único da coluna Ações */
.action-btn.opcoes-trigger { color:var(--green); border-color:var(--green-dim); }
.action-btn.opcoes-trigger:hover { background:var(--green-soft); border-color:var(--green); box-shadow:0 0 12px var(--green-glow); }

/* modal de opções (menu de ações do produto) */
.opcoes-overlay { position:fixed; inset:0; background:rgba(0,0,0,.88); display:flex; align-items:center; justify-content:center; z-index:260; animation:fadeIn .2s ease; padding:1rem; }
.opcoes-box { background:var(--bg2); border:1px solid var(--border2); border-top:2px solid var(--green-dim); width:min(450px,96vw); display:flex; flex-direction:column; animation:slideDown .25s ease; }
.opcoes-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:1.25rem 1.5rem; border-bottom:1px solid var(--border2); }
.opcoes-eyebrow { font-size:var(--fs-xs); letter-spacing:.3em; text-transform:uppercase; color:var(--text-dim); margin-bottom:.4rem; }
.opcoes-nome { font-size:var(--fs-base); color:var(--text); line-height:1.4; word-break:break-word; }
.opcoes-list { display:flex; flex-direction:column; padding:.6rem; gap:.25rem; }
.opcoes-sep { height:1px; background:var(--border); margin:.4rem .6rem; }
.opcao-btn { display:flex; align-items:center; gap:1rem; width:100%; text-align:left; background:none; border:1px solid transparent; color:var(--text-dim); font-family:var(--mono); padding:.75rem 1rem; cursor:pointer; transition:all .15s; }
.opcao-btn:hover { background:var(--bg3); }
.opcao-btn .op-ic { font-size:1.15rem; width:24px; text-align:center; flex-shrink:0; color:var(--text-dim); transition:color .15s; }
.opcao-btn .op-tx { display:flex; flex-direction:column; flex:1; gap:.15rem; }
.opcao-btn .op-tt { font-size:var(--fs-sm); letter-spacing:.08em; text-transform:uppercase; color:var(--text); transition:color .15s; }
.opcao-btn .op-sub { font-size:var(--fs-xs); color:var(--text-muted); letter-spacing:.02em; }
.opcao-btn .op-arr { color:var(--text-muted); opacity:0; transform:translateX(-5px); transition:all .15s; }
.opcao-btn:hover .op-arr { opacity:1; transform:translateX(0); }
.opcao-btn.hist:hover     { border-color:var(--green-dim); }   .opcao-btn.hist:hover .op-ic,     .opcao-btn.hist:hover .op-tt     { color:var(--green); }
.opcao-btn.meta:hover     { border-color:rgba(255,184,0,.4); } .opcao-btn.meta:hover .op-ic,     .opcao-btn.meta:hover .op-tt     { color:var(--amber); }
.opcao-btn.coletar:hover  { border-color:var(--amber); }       .opcao-btn.coletar:hover .op-ic,  .opcao-btn.coletar:hover .op-tt  { color:var(--amber); }
.opcao-btn.toggle-off:hover { border-color:rgba(255,184,0,.4); } .opcao-btn.toggle-off:hover .op-ic, .opcao-btn.toggle-off:hover .op-tt { color:var(--amber); }
.opcao-btn.toggle-on:hover  { border-color:var(--green-dim); }   .opcao-btn.toggle-on:hover .op-ic,  .opcao-btn.toggle-on:hover .op-tt  { color:var(--green); }
.opcao-btn.remove:hover { border-color:rgba(255,68,68,.4); background:rgba(255,68,68,.06); } .opcao-btn.remove:hover .op-ic, .opcao-btn.remove:hover .op-tt { color:var(--red); }

/* alertas */
.alertas-list { display:flex; flex-direction:column; gap:.65rem; }
.alerta-item { display:grid; grid-template-columns:auto 1fr auto auto; gap:1.1rem; align-items:center; padding:.9rem 1.1rem; background:var(--bg2); border:1px solid var(--border2); border-left:3px solid var(--green-dim); font-size:var(--fs-base); }
.alerta-item.tipo-abaixo_meta { border-left-color:var(--amber); }
.alerta-item.tipo-queda_preco { border-left-color:var(--green); }
.alerta-tipo { font-size:var(--fs-xs); letter-spacing:.12em; text-transform:uppercase; }
.alerta-tipo.abaixo_meta { color:var(--amber); }
.alerta-tipo.queda_preco  { color:var(--green); }
.alerta-preco { font-family:var(--display); font-size:1.25rem; color:var(--green); }
.alerta-nome  { font-size:var(--fs-base); line-height:1.3; }
.alerta-loja  { font-size:var(--fs-xs); color:var(--text-dim); letter-spacing:.1em; text-transform:uppercase; margin-top:.15rem; }
.alerta-data  { font-size:var(--fs-sm); color:var(--text-dim); text-align:right; white-space:nowrap; }

/* footer */
.site-footer { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.5rem; border-top:1px solid var(--border); background:var(--bg2); font-size:.75rem; letter-spacing:.08em; color:var(--text-dim); text-transform:uppercase; user-select:none; }
.footer-phrase { display:flex; align-items:center; gap:.2rem; }
.footer-dots { flex:1; margin:0 1.5rem; border-top:1px dashed var(--border); }

.empty { text-align:center; padding:3rem 1.5rem; color:var(--text-dim); font-size:var(--fs-base); letter-spacing:.1em; line-height:2; }

@media (max-width:700px) {
  .stats-bar { grid-template-columns:1fr 1fr; }
  th:nth-child(4),td:nth-child(4) { display:none; }
  .dash-main { padding:1.25rem 1rem; }
  .alerta-item { grid-template-columns:1fr auto; }
}
@media (max-width:480px) {
  .stats-bar { grid-template-columns:1fr; }
}
`;

// ── Componente Modal Histórico ─────────────────────────────────
function HistoricoModal({ itemId, nome, onClose, showToast, onChange }) {
  const [dados, setDados]           = useState(null);
  const [reloadKey, setReloadKey]   = useState(0);
  const [selecionados, setSelecionados] = useState([]);   // ids marcados
  const [confirmando, setConfirmando]   = useState(false); // confirmar remoção em massa
  const [removendo, setRemovendo]       = useState(false);

  useEffect(() => {
    if (!itemId) return;
    setDados(null);
    setSelecionados([]);
    setConfirmando(false);
    getSupabase().then((sb) =>
      sb.from("historico_precos")
        .select("id, preco, disponivel, coletado_em")
        .eq("item_id", itemId)
        .order("coletado_em", { ascending: false })
        .limit(30)
        .then(({ data }) => setDados(data || []))
    );
  }, [itemId, reloadKey]);

  if (!itemId) return null;

  const fmtData = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const fmtHora = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

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
  const minPreco = precos.length ? Math.min(...precos) : 0;
  const maxPreco = precos.length ? Math.max(...precos) : 0;
  const amplitude = maxPreco - minPreco || 1;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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
                ★ MENOR PREÇO: <span className="green">R$ {minPreco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="chart-wrap">
                {dados.map((d) => {
                  const pct = d.preco ? ((d.preco - minPreco) / amplitude) * 70 + 10 : 0;
                  const isMin = d.preco === minPreco;
                  const isSel = selecionados.includes(d.id);
                  return (
                    <div key={d.id} className={`chart-row${isSel ? " sel" : ""}`}>
                      <div className="chart-date dim">
                        <div>{fmtData(d.coletado_em)}</div>
                        <div className="chart-hora">{fmtHora(d.coletado_em)}</div>
                      </div>
                      <div className="bar-track">
                        <div className={`bar-fill${isMin ? " min-price" : ""}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className={`chart-price${isMin ? " min-price" : ""}`}>
                        {d.preco ? `R$ ${Number(d.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "esgotado"}
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
      </div>
    </div>
  );
}

// ── Componente Modal de Opções (menu de ações do produto) ──────
function OpcoesModal({ item, onMeta, onColetar, onToggle, onClose }) {
  if (!item) return null;
  const monitorando = item.monitorando !== false;
  const metaSub = item.preco_meta
    ? `Meta atual: R$ ${Number(item.preco_meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "Definir preço-alvo";

  return (
    <div className="opcoes-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="opcoes-box">
        <div className="opcoes-header">
          <div>
            <div className="opcoes-eyebrow">Ações do produto</div>
            <div className="opcoes-nome">{item.nome_na_loja}</div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="opcoes-list">
          <button className="opcao-btn meta" onClick={() => onMeta(item)}>
            <span className="op-ic">◎</span>
            <span className="op-tx"><span className="op-tt">Editar meta</span><span className="op-sub">{metaSub}</span></span>
            <span className="op-arr">→</span>
          </button>
          <button className="opcao-btn coletar" onClick={() => onColetar(item)}>
            <span className="op-ic">⚡</span>
            <span className="op-tx"><span className="op-tt">Coletar agora</span><span className="op-sub">Dispara coleta de todos os produtos</span></span>
            <span className="op-arr">→</span>
          </button>
          <button className={`opcao-btn ${monitorando ? "toggle-on" : "toggle-off"}`} onClick={() => onToggle(item)}>
            <span className="op-ic">{monitorando ? "⏸" : "▶"}</span>
            <span className="op-tx">
              <span className="op-tt">{monitorando ? "Desativar monitoramento" : "Ativar monitoramento"}</span>
              <span className="op-sub">{monitorando ? "Pausa as coletas (mantém histórico)" : "Volta a coletar nas próximas execuções"}</span>
            </span>
            <span className="op-arr">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente Modal Meta ──────────────────────────────────────
function MetaModal({ item, onClose, onSave }) {
  const [valor, setValor] = useState(item?.preco_meta ? String(item.preco_meta) : "");
  const [erro,  setErro]  = useState(false);

  if (!item) return null;
  const preco = item.preco || null;

  const salvar = () => {
    const v = parseFloat(valor.replace(",", "."));
    if (!valor || isNaN(v) || v <= 0) { setErro(true); return; }
    setErro(false);
    onSave(item.item_id, v);
  };

  const sugestoes = preco ? [5, 10, 15, 20].map((p) => ({
    pct: p,
    val: (preco * (1 - p / 100)).toFixed(2),
  })) : [];

  return (
    <div className="meta-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="meta-modal">
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
            <div className="mpa-val">
              {preco ? `R$ ${preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "sem coleta"}
            </div>
          </div>

          <div>
            <div className="field-label">Nova meta (R$)</div>
            <input
              className="field-input" type="number" placeholder="0,00" min="0" step="0.01"
              value={valor}
              onChange={(e) => { setValor(e.target.value); setErro(false); }}
              onKeyDown={(e) => e.key === "Enter" && salvar()}
            />
            <div className="field-hint">Alerta quando o preço cair abaixo desse valor</div>
            {erro && <div className="field-error">Informe um valor válido maior que zero</div>}
          </div>

          {sugestoes.length > 0 && (
            <div>
              <div className="field-label" style={{ marginBottom: ".6rem" }}>Sugestões rápidas</div>
              <div className="meta-sugestoes">
                {sugestoes.map(({ pct, val }) => (
                  <button key={pct} className="meta-sug-btn" onClick={() => setValor(val)}>
                    -{pct}% · R$ {parseFloat(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </button>
                ))}
                {item.preco_meta && (
                  <button className="btn-remover-meta" onClick={() => onSave(item.item_id, null)}>
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
      </div>
    </div>
  );
}

// ── Dashboard principal ────────────────────────────────────────
const FILTROS_CAT = ["all", "GPU", "CPU", "RAM", "PSU", "MOBO"];

export default function Dashboard({ showToast }) {
  const [dados,        setDados]        = useState([]);
  const [alertas,      setAlertas]      = useState([]);
  const [filtro,       setFiltro]       = useState("all");
  const [busca,        setBusca]        = useState("all");
  const [termoBusca,   setTermoBusca]   = useState("");
  const [sortCampo,    setSortCampo]    = useState("nome");
  const [sortDir,      setSortDir]      = useState("asc");
  const [coletando,    setColetando]    = useState(false);
  const [progresso,    setProgresso]    = useState({ visible: false, txt: "", pct: 0 });
  const [historicoItem,setHistoricoItem]= useState(null);
  const [metaItem,     setMetaItem]     = useState(null);
  const [opcoesItem,   setOpcoesItem]   = useState(null);
  const [confirm,      setConfirm]      = useState(null);
  const [statsAlertas, setStatsAlertas] = useState("—");

  // Carrega dados
  const carregarPrecos = useCallback(async () => {
    const sb = await getSupabase();
    const { data: itens, error } = await sb
      .from("itens")
      .select("id, nome_na_loja, url, monitorando, preco_meta, lojas(nome), produtos(categoria)")
      .order("nome_na_loja", { ascending: true });

    if (error) { showToast("Erro ao carregar dados", "error"); return; }
    if (!itens?.length) { setDados([]); return; }

    const ids = itens.map((i) => i.id);
    const { data: precos } = await sb
      .from("historico_precos")
      .select("item_id, preco, disponivel, coletado_em")
      .in("item_id", ids)
      .order("coletado_em", { ascending: false });

    const ultimoPreco = {};
    for (const p of precos || []) {
      if (!ultimoPreco[p.item_id]) ultimoPreco[p.item_id] = p;
    }

    setDados(itens.map((item) => {
      const ult = ultimoPreco[item.id] || {};
      return {
        item_id: item.id, nome_na_loja: item.nome_na_loja, url: item.url || null,
        loja: item.lojas?.nome || "—", categoria: item.produtos?.categoria || "—",
        monitorando: item.monitorando, preco_meta: item.preco_meta,
        preco: ult.preco ?? null, disponivel: ult.disponivel ?? false,
        coletado_em: ult.coletado_em ?? null,
      };
    }));
  }, [showToast]);

  const carregarAlertas = useCallback(async () => {
    const sb   = await getSupabase();
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const { data } = await sb
      .from("alertas")
      .select("id, tipo, preco_gatilho, preco_anterior, criado_em, itens(nome_na_loja, url, lojas(nome))")
      .gte("criado_em", hoje.toISOString())
      .order("criado_em", { ascending: false })
      .limit(20);
    setAlertas(data || []);
    setStatsAlertas(data?.length ?? 0);
  }, []);

  useEffect(() => {
    carregarPrecos();
    carregarAlertas();
  }, [carregarPrecos, carregarAlertas]);

  // Stats
  const ativos      = dados.filter((d) => d.monitorando !== false);
  const disponiveis = ativos.filter((d) => d.disponivel && d.preco);
  const menor       = disponiveis.length ? disponiveis.reduce((a, b) => a.preco < b.preco ? a : b) : null;
  const ultColeta   = [...dados].filter((d) => d.coletado_em).sort((a, b) => new Date(b.coletado_em) - new Date(a.coletado_em))[0];

  // Filtro + busca + sort
  const dadosFiltrados = (() => {
    let d = filtro === "all" ? [...dados] : dados.filter((x) => x.categoria === filtro);
    if (termoBusca.trim()) {
      const q = termoBusca.toLowerCase();
      d = d.filter((x) =>
        (x.nome_na_loja || "").toLowerCase().includes(q) ||
        (x.loja || "").toLowerCase().includes(q) ||
        (x.categoria || "").toLowerCase().includes(q)
      );
    }
    d.sort((a, b) => {
      if (sortCampo === "nome") {
        const cmp = (a.nome_na_loja || "").localeCompare(b.nome_na_loja || "", "pt-BR");
        return sortDir === "asc" ? cmp : -cmp;
      }
      const pa = a.preco ?? (sortDir === "asc" ? Infinity : -Infinity);
      const pb = b.preco ?? (sortDir === "asc" ? Infinity : -Infinity);
      return sortDir === "asc" ? pa - pb : pb - pa;
    });
    return d;
  })();

  // Ações
  const toggleSort = (campo) => {
    if (sortCampo === campo) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCampo(campo); setSortDir("asc"); }
  };

  const removerProduto = async (itemId, nome) => {
    try {
      const removidos = await removerNoServidor("produto", [itemId]);
      if (!removidos) { showToast("Nada foi removido — produto não encontrado.", "error"); return; }
      showToast(`✓ "${nome}" removido.`, "ok");
      carregarPrecos();
    } catch (e) {
      showToast("Erro ao remover: " + e.message, "error");
    }
  };

  const toggleMonitoramento = async (itemId, nome, ativoAtual) => {
    const sb = await getSupabase();
    const { error } = await sb.from("itens").update({ monitorando: !ativoAtual }).eq("id", itemId);
    if (error) { showToast("Erro: " + error.message, "error"); return; }
    showToast(!ativoAtual ? `▶ "${nome}" reativado.` : `⏸ "${nome}" pausado.`, "ok");
    carregarPrecos();
  };

  const salvarMeta = async (itemId, valor) => {
    const sb = await getSupabase();
    const { error } = await sb.from("itens").update({ preco_meta: valor }).eq("id", itemId);
    if (error) { showToast("Erro ao salvar: " + error.message, "error"); return; }
    setMetaItem(null);
    showToast(valor === null ? "Meta removida." : `✓ Meta definida em R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "ok");
    carregarPrecos();
  };

  const iniciarColeta = async () => {
    setColetando(true);
    setProgresso({ visible: true, txt: "Conectando ao servidor...", pct: 15 });

    try {
      setProgresso({ visible: true, txt: "Disparando workflow...", pct: 40 });

      const resp = await fetch("/api/trigger-coleta", { method: "POST" });
      const data = await resp.json();

      if (resp.ok && data.ok) {
        setProgresso({ visible: true, txt: "Workflow disparado com sucesso!", pct: 100 });
        showToast("⚡ Coleta iniciada no GitHub Actions!", "ok");
      } else {
        throw new Error(data.error || `Erro ${resp.status}`);
      }
    } catch (e) {
      setProgresso({ visible: true, txt: "Erro ao disparar coleta", pct: 100 });
      showToast("Erro: " + e.message, "error");
    }

    setTimeout(() => {
      setProgresso({ visible: false, txt: "", pct: 0 });
      setColetando(false);
    }, 2500);
  };

  const confirmar = (titulo, corpo, icone, cb, isDanger = true) =>
    setConfirm({ titulo, corpo, icone, isDanger, cb });

  // ── Ações disparadas pelo menu de Opções ────────────────────
  const opcMeta = (item) => { setOpcoesItem(null); setMetaItem(item); };

  const opcColetar = () => {
    setOpcoesItem(null);
    confirmar(
      "COLETAR AGORA",
      "Isso irá disparar uma coleta imediata de preços de <strong>todos os produtos monitorados</strong>.<br><br>O processo pode levar alguns minutos.",
      "⚡", iniciarColeta, false,
    );
  };

  const opcToggle = (item) => {
    const monitorando = item.monitorando !== false;
    setOpcoesItem(null);
    confirmar(
      monitorando ? "DESATIVAR MONITORAMENTO" : "ATIVAR MONITORAMENTO",
      monitorando
        ? `Pausar o monitoramento de preços para:<br><br><strong>${item.nome_na_loja}</strong><br><br>O produto não será mais coletado, mas seu histórico é mantido.`
        : `Reativar o monitoramento de preços para:<br><br><strong>${item.nome_na_loja}</strong><br><br>O produto voltará a ser coletado nas próximas execuções.`,
      monitorando ? "⏸" : "▶",
      () => toggleMonitoramento(item.item_id, item.nome_na_loja, monitorando),
      monitorando,
    );
  };

  const opcRemover = (item) => {
    setOpcoesItem(null);
    confirmar(
      "REMOVER PRODUTO",
      `Remover permanentemente:<br><br><strong>${item.nome_na_loja}</strong><br><br><span style="color:var(--red);font-size:var(--fs-sm)">✕ Histórico de preços<br>✕ Alertas associados<br>✕ Todas as configurações</span><br><br>Esta ação não pode ser desfeita.`,
      "⚠",
      () => removerProduto(item.item_id, item.nome_na_loja),
      true,
    );
  };

  return (
    <>
      <style>{css}</style>

      <ConfirmModal
        confirm={confirm}
        onCancel={() => setConfirm(null)}
        onOk={() => { confirm?.cb(); setConfirm(null); }}
      />
      <HistoricoModal
        itemId={historicoItem?.id} nome={historicoItem?.nome}
        onClose={() => setHistoricoItem(null)}
        showToast={showToast} onChange={carregarPrecos}
      />
      <MetaModal item={metaItem} onClose={() => setMetaItem(null)} onSave={salvarMeta} />
      <OpcoesModal
        item={opcoesItem}
        onClose={() => setOpcoesItem(null)}
        onMeta={opcMeta}
        onColetar={opcColetar}
        onToggle={opcToggle}
      />

      {/* STATS */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">Itens monitorados</div>
          <div className="stat-value">{ativos.length}</div>
          <div className="stat-sub">produtos ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Alertas hoje</div>
          <div className="stat-value amber">{statsAlertas}</div>
          <div className="stat-sub">disparos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Menor preço hoje</div>
          <div className="stat-value">
            {menor ? `R$ ${menor.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
          </div>
          <div className="stat-sub">{menor?.nome_na_loja || "—"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Última coleta</div>
          {ultColeta ? (
            <>
              <div style={{ fontFamily: "var(--display)", fontSize: "1.85rem", letterSpacing: ".03em", color: "var(--green)", lineHeight: 1 }}>
                {new Date(ultColeta.coletado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="stat-sub">
                {new Date(ultColeta.coletado_em).toLocaleDateString("pt-BR")}
              </div>
            </>
          ) : <div className="stat-value">—</div>}
          <div className="stat-sub">horário de Brasília</div>
        </div>
      </div>

      <main className="dash-main">
        {/* Tabela */}
        <section>
          <div className="section-header">
            <div className="section-title">Monitor de Preços</div>
            <div className="section-line" />
          </div>

          <div className="toolbar">
            <div className="toolbar-row">
              <div className="search-wrap">
                <span className="search-icon">⌕</span>
                <input
                  className="search-input" type="text" placeholder="Buscar por produto ou loja..."
                  value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)}
                />
                {termoBusca && (
                  <button className="btn-search-clear" onClick={() => setTermoBusca("")}>✕</button>
                )}
              </div>
              <button className="btn-coletar" disabled={coletando} onClick={() =>
                confirmar("COLETAR AGORA", "Isso irá disparar uma coleta imediata de preços.<br><br>O processo pode levar alguns minutos.", "⚡", iniciarColeta, false)
              }>
                <span>⚡</span>
                <span>{coletando ? "DISPARANDO..." : "COLETAR AGORA"}</span>
              </button>
            </div>

            <div className="toolbar-row">
              <div className="filters">
                {FILTROS_CAT.map((f) => (
                  <button key={f} className={`filter-btn${filtro === f ? " active" : ""}`} onClick={() => setFiltro(f)}>
                    {f === "all" ? "Todos" : f === "PSU" ? "Fonte" : f === "MOBO" ? "Placa Mãe" : f}
                  </button>
                ))}
              </div>
              <div className="sort-controls">
                {[["nome", "Nome"], ["preco", "Preço"]].map(([campo, label]) => (
                  <button key={campo} className={`sort-btn${sortCampo === campo ? " active" : ""}`} onClick={() => toggleSort(campo)}>
                    <span>{label}</span>
                    <span style={{ fontSize: ".7rem", opacity: .7 }}>
                      {sortCampo === campo ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="result-count">
                {dadosFiltrados.length === dados.length
                  ? `${dados.length} produto(s)`
                  : `${dadosFiltrados.length} de ${dados.length}`}
              </div>
            </div>
          </div>

          {progresso.visible && (
            <div className="coleta-progress" style={{ marginBottom: "1.25rem" }}>
              <div className="coleta-status">
                <span className="item-atual">{progresso.txt}</span>
                <span className="dim">{progresso.pct === 100 ? "✓" : ""}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progresso.pct}%` }} />
              </div>
            </div>
          )}

          <div className="price-table-wrap">
            {dados.length === 0 ? (
              <div className="loading"><div className="spinner" /> CARREGANDO DADOS...</div>
            ) : dadosFiltrados.length === 0 ? (
              <div className="empty">
                {termoBusca
                  ? <>Nenhum resultado para "<span className="green">{termoBusca}</span>".</>
                  : <>Nenhum item nesta categoria.<br /><a href="/novo-produto" style={{ color: "var(--green)", fontSize: "var(--fs-sm)" }}>+ Adicionar produto</a></>}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Produto</th><th>Loja</th><th>Preço atual</th><th>Status</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map((item) => {
                    const monitorando  = item.monitorando !== false;
                    const abaixoDaMeta = monitorando && item.preco_meta && item.preco && item.preco < item.preco_meta;
                    const statusClass  = !monitorando ? "off" : !item.disponivel ? "out" : abaixoDaMeta ? "alert" : "ok";
                    const statusTxt    = !monitorando ? "OFF" : !item.disponivel ? "ESGOTADO" : abaixoDaMeta ? "ALERTA" : "OK";
                    const precoFmt     = item.preco ? `R$ ${Number(item.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null;
                    return (
                      <tr key={item.item_id} className={!monitorando ? "row-off" : ""}>
                        <td className="td-produto">
                          <div className="prod-nome">
                            {item.url
                              ? <a className="prod-nome-link" href={item.url} target="_blank" rel="noopener noreferrer">{item.nome_na_loja}</a>
                              : item.nome_na_loja}
                          </div>
                          <div className="prod-cat">{item.categoria}</div>
                        </td>
                        <td><span className="loja-badge">{item.loja}</span></td>
                        <td>
                          {precoFmt
                            ? <>
                                <div className="price-current">{precoFmt}</div>
                                {item.preco_meta && <div className="price-meta">meta: R$ {Number(item.preco_meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>}
                              </>
                            : <div className="price-unavailable">indisponível</div>}
                        </td>
                        <td><span className={`status-badge ${statusClass}`}>{statusTxt}</span></td>
                        <td>
                          <div className="td-actions">
                            <button className="action-btn hist" onClick={() => setHistoricoItem({ id: item.item_id, nome: item.nome_na_loja })}>
                              <span className="ab-icon">◈</span><span className="ab-label">Histórico</span>
                            </button>
                            <button className="action-btn opcoes-trigger" onClick={() => setOpcoesItem(item)}>
                              <span className="ab-icon">⋯</span><span className="ab-label">Opções</span>
                            </button>
                            <button className="action-btn remove" onClick={() => opcRemover(item)}>
                              <span className="ab-icon">✕</span><span className="ab-label">Remover</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Alertas */}
        <section>
          <div className="section-header">
            <div className="section-title">Alertas recentes</div>
            <div className="section-line" />
          </div>
          {alertas.length === 0 ? (
            <div className="empty dim">Nenhum alerta disparado hoje.</div>
          ) : (
            <div className="alertas-list">
              {alertas.map((a) => {
                const preco = Number(a.preco_gatilho).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                const dt    = new Date(a.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={a.id} className={`alerta-item tipo-${a.tipo}`}>
                    <span className={`alerta-tipo ${a.tipo}`}>{a.tipo === "abaixo_meta" ? "↓ META" : "↓ QUEDA"}</span>
                    <div>
                      <div className="alerta-nome">{a.itens?.nome_na_loja || "—"}</div>
                      <div className="alerta-loja">{a.itens?.lojas?.nome || "—"}</div>
                    </div>
                    <div className="alerta-preco">R$ {preco}</div>
                    <div className="alerta-data">{dt}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-phrase">
          <strong className="green">L</strong>ive&nbsp;<strong className="green">M</strong>onitor
        </div>
        <div className="footer-dots" />
        <div className="footer-phrase">
          <strong className="green">G</strong>uard&nbsp;<strong className="green">M</strong>arket
        </div>
      </footer>
    </>
  );
}