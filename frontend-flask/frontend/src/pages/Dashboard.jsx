/**
 * pages/Dashboard.jsx — PROTOCOL FPS
 * Página principal: stats, tabela de preços, alertas, botão coletar.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { getSupabase } from "@/services/supabase";
import ConfirmModal from "@/components/ConfirmModal";
import { dataBRT, horaBRT, dataHoraBRT, inicioDoDiaBRT } from "@/utils/datas";

/**
 * Remove produtos/coletas via endpoint server-side (/api/remover),
 * que usa a SERVICE_KEY e ignora o RLS. Retorna a quantidade removida.
 * Flask atende em dev; Vercel Function em produção.
 */
async function removerNoServidor(tipo, ids) {
  // Envia o access_token do usuário: o servidor valida a sessão e autoriza
  // apenas itens do próprio usuário (ou qualquer item, se admin).
  const sb = await getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  const resp = await fetch("/api/remover", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
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
.filter-btn-loja.active { border-color: var(--amber); color: var(--amber); background: rgba(255,184,0,.08); }

/* visão de admin: filtro por usuário (dono dos itens) */
.user-filter-tag { display:flex; align-items:center; font-size:var(--fs-xs); letter-spacing:.25em; color:var(--text-dim); text-transform:uppercase; padding:.5rem .35rem .5rem 0; }
.filter-btn-user.active { border-color:#37c8ff; color:#37c8ff; background:rgba(55,200,255,.08); }
.prod-dono { margin-left:.75rem; color:#37c8ff; opacity:.85; letter-spacing:.06em; }
.prod-dono-voce { color:var(--green); }

/* filtro "produto de loja" (aparece quando uma loja está selecionada) */
.produto-select {
  background:var(--bg2); border:1px solid rgba(255,184,0,.35);
  color:var(--amber); font-family:var(--mono); font-size:var(--fs-sm);
  letter-spacing:.08em; padding:.5rem .8rem; cursor:pointer;
  max-width:340px; outline:none; transition:border-color .15s,box-shadow .15s;
}
.produto-select:hover,.produto-select:focus { border-color:var(--amber); box-shadow:0 0 0 1px rgba(255,184,0,.25); }
.produto-select option { background:var(--bg2); color:var(--text); }

.sort-controls { display:flex; gap:.4rem; flex-wrap:wrap; }
.sort-controls-right { margin-left:auto; }
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
table { width:100%; border-collapse:collapse; font-size:var(--fs-base); table-layout:fixed; min-width:760px; }
/* Larguras fixas das colunas (proporção do padrão "Todos / Todas Lojas") */
.col-produto { width:41.8%; }
.col-loja    { width:15.55%; }
.col-preco   { width:16.2%; }
.col-status  { width:9.43%; }
.col-acoes   { width:17.02%; }
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
.price-meta      { font-size:var(--fs-xs); color:var(--text-muted); margin-top:.15rem; }
.price-timestamp { font-size:var(--fs-xs); color:var(--text-muted); margin-top:.2rem; letter-spacing:.04em; opacity:.75; }
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
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.1rem 1.5rem; border-bottom:1px solid var(--border2); position:sticky; top:0; background:var(--bg2); z-index:1; }
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

/* gráfico tempo × preço do histórico (Sprint 10) */
.hist-grafico { background:var(--bg3); border:1px solid var(--border2); margin-bottom:1.25rem; }
.hg-plot { position:relative; }
.hg-plot svg { display:block; width:100%; height:auto; cursor:crosshair; }
.hg-tooltip { position:absolute; pointer-events:none; background:var(--bg2); border:1px solid var(--green-dim); padding:.45rem .65rem; font-size:var(--fs-xs); color:var(--text-dim); line-height:1.55; white-space:nowrap; z-index:5; box-shadow:0 4px 14px rgba(0,0,0,.55); }
.hg-tooltip .hg-preco { color:var(--green); font-size:var(--fs-sm); }
.hg-tooltip .hg-esg { color:var(--amber); }
.hg-hint { font-size:var(--fs-xs); color:var(--text-muted); letter-spacing:.12em; padding:.4rem .75rem .55rem; border-top:1px solid var(--border); }
.chart-row.destaque { background:var(--green-soft); outline:1px solid var(--green-dim); animation:hgFlash 1.4s ease; }
@keyframes hgFlash { 0% { background:rgba(57,255,20,.3); } 100% { background:var(--green-soft); } }

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

// ── Gráfico tempo × preço do histórico (Sprint 10) ─────────────
// Série única → linha; hover = crosshair + tooltip (dia · valor);
// clique no ponto → onPontoClick(id) leva à leitura na lista abaixo.
function GraficoHistorico({ dados, onPontoClick }) {
  const [hover, setHover] = useState(null); // índice do ponto sob o mouse

  // pontos em ordem cronológica (a lista chega do mais novo p/ o mais antigo)
  const pontos = useMemo(
    () => [...(dados || [])]
      .filter((d) => d.preco != null)
      .reverse()
      .map((d) => ({ ...d, t: new Date(d.coletado_em).getTime(), preco: Number(d.preco) })),
    [dados]
  );

  const W = 640, H = 220, PAD = { top: 14, right: 16, bottom: 26, left: 62 };
  if (pontos.length < 2) return null; // com 0–1 leituras a linha não informa nada

  const t0 = pontos[0].t;
  const t1 = pontos[pontos.length - 1].t;
  const precos = pontos.map((p) => p.preco);
  const precoMinReal = Math.min(...precos);
  let pMin = precoMinReal, pMax = Math.max(...precos);
  if (pMin === pMax) { pMin -= 1; pMax += 1; }       // série constante
  const folga = (pMax - pMin) * 0.08;
  pMin -= folga; pMax += folga;

  const X = (t) => PAD.left + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.left - PAD.right);
  const Y = (v) => H - PAD.bottom - ((v - pMin) / (pMax - pMin)) * (H - PAD.top - PAD.bottom);

  const path = pontos.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.preco).toFixed(1)}`).join(" ");
  const fmtBRL = (v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const yTicks = [0, 0.5, 1].map((f) => pMin + f * (pMax - pMin));
  const xTicks = t1 > t0 ? [0, 1 / 3, 2 / 3, 1].map((f) => t0 + f * (t1 - t0)) : [t0];
  const iMin   = precos.indexOf(precoMinReal);

  // ponto mais próximo do mouse no eixo X (o SVG escala com o container)
  const localizar = (evt) => {
    const rect = evt.currentTarget.getBoundingClientRect();
    const mx = ((evt.clientX - rect.left) / rect.width) * W;
    let melhor = 0, dist = Infinity;
    pontos.forEach((p, i) => {
      const d = Math.abs(X(p.t) - mx);
      if (d < dist) { dist = d; melhor = i; }
    });
    return melhor;
  };

  const alvo = hover != null ? pontos[hover] : null;

  return (
    <div className="hist-grafico">
      <div className="hg-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Gráfico do preço ao longo do tempo"
          onMouseMove={(e) => setHover(localizar(e))}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => onPontoClick?.(pontos[localizar(e)].id)}
        >
          {/* grade recessiva + rótulos do eixo Y */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD.left - 8} y={Y(v) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="var(--mono)">
                {fmtBRL(v)}
              </text>
            </g>
          ))}
          {/* rótulos do eixo X (datas) */}
          {xTicks.map((t, i) => (
            <text key={i} x={X(t)} y={H - 8} fontSize="9" fill="var(--text-muted)" fontFamily="var(--mono)"
              textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}>
              {dataBRT(new Date(t).toISOString(), { day: "2-digit", month: "2-digit", year: "2-digit" })}
            </text>
          ))}
          {/* série */}
          <path d={path} fill="none" stroke="var(--green)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* marcador fixo do menor preço (âmbar, como o ★ da lista) */}
          <circle cx={X(pontos[iMin].t)} cy={Y(pontos[iMin].preco)} r="3.5" fill="var(--bg3)" stroke="var(--amber)" strokeWidth="2" />
          {/* crosshair + marcador do hover */}
          {alvo && (
            <g pointerEvents="none">
              <line x1={X(alvo.t)} x2={X(alvo.t)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--green-dim)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={X(alvo.t)} cy={Y(alvo.preco)} r="4.5" fill="var(--bg3)" stroke="var(--green)" strokeWidth="2" />
            </g>
          )}
        </svg>
        {alvo && (
          <div
            className="hg-tooltip"
            style={{
              left: `${(X(alvo.t) / W) * 100}%`,
              top:  `${(Y(alvo.preco) / H) * 100}%`,
              transform: `translate(${X(alvo.t) > W * 0.68 ? "calc(-100% - 12px)" : "12px"}, -120%)`,
            }}
          >
            <div>{dataBRT(alvo.coletado_em, { day: "2-digit", month: "2-digit", year: "numeric" })} · {horaBRT(alvo.coletado_em, { hour: "2-digit", minute: "2-digit" })}</div>
            <div className="hg-preco">{fmtBRL(alvo.preco)}{alvo.disponivel === false && <span className="hg-esg"> · esgotado</span>}</div>
          </div>
        )}
      </div>
      <div className="hg-hint">◇ passe o mouse para inspecionar · clique em um ponto para ir à leitura na lista</div>
    </div>
  );
}

// ── Componente Modal Histórico ─────────────────────────────────
function HistoricoModal({ itemId, nome, onClose, showToast, onChange }) {
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
    getSupabase().then(async (sb) => {
      // Busca o histórico COMPLETO, paginado — o PostgREST corta qualquer
      // resposta em 1000 linhas (Sprint 10, todo:132; antes era limit(30)).
      const PAGINA = 1000;
      let todas = [], de = 0;
      for (;;) {
        const { data, error } = await sb
          .from("historico_precos")
          .select("id, preco, disponivel, coletado_em")
          .eq("item_id", itemId)
          .order("coletado_em", { ascending: false })
          .range(de, de + PAGINA - 1);
        if (error || !data) break;
        todas = todas.concat(data);
        if (data.length < PAGINA) break;
        de += PAGINA;
      }
      setDados(todas);
    });
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
            <span className="op-tx"><span className="op-tt">Coletar agora</span><span className="op-sub">Coleta somente este produto</span></span>
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
const FILTROS_CAT = ["all", "GPU", "CPU", "RAM", "PSU", "MOBO", "STORAGE", "DIVERSOS"];

// Rótulos amigáveis para as siglas de categoria salvas em produtos.categoria
const CAT_LABEL = {
  all:      "Todos",
  PSU:      "Fonte",
  MOBO:     "Placa Mãe",
  STORAGE:  "Armazenamento",
  DIVERSOS: "Diversos",
};

// `slug` = chave do dict SCRAPERS no main.py (usado na coleta segmentada por loja)
const LOJAS_FILTER = [
  { key: "all",       label: "Todas Lojas", slug: null           },
  { key: "kabum",     label: "KaBuM",       slug: "kabum"        },
  { key: "terabyte",  label: "Terabyte",    slug: "terabyteshop" },
  { key: "pichau",    label: "Pichau",      slug: "pichau"       },
];

export default function Dashboard({ showToast, isAdmin = false, user = null }) {
  const [dados,        setDados]        = useState([]);
  const [alertas,      setAlertas]      = useState([]);
  const [filtro,       setFiltro]       = useState("all");
  const [busca,        setBusca]        = useState("all");
  const [termoBusca,   setTermoBusca]   = useState("");
  const [sortCampo,    setSortCampo]    = useState("nome");
  const [sortDir,      setSortDir]      = useState("asc");
  const [filtroLoja,    setFiltroLoja]    = useState("all");
  const [filtroProduto, setFiltroProduto] = useState("all"); // produto dentro da loja selecionada
  const [filtroUsuario, setFiltroUsuario] = useState("all"); // admin: dono dos itens
  const [coletando,    setColetando]    = useState(false);
  const [progresso,    setProgresso]    = useState({ visible: false, txt: "", pct: 0 });
  const [historicoItem,setHistoricoItem]= useState(null);
  const [metaItem,     setMetaItem]     = useState(null);
  const [opcoesItem,   setOpcoesItem]   = useState(null);
  const [confirm,      setConfirm]      = useState(null);

  // Carrega dados
  const carregarPrecos = useCallback(async () => {
    const sb = await getSupabase();
    // Inclui o dono (usuarios via FK itens.user_id) para a visão de admin.
    // A última leitura vem EMBUTIDA com order+limit por item (referencedTable):
    // buscar historico_precos inteiro estoura o teto de 1000 linhas do PostgREST
    // desde a migração dos dados legados (Sprint 8, ~5,4k leituras).
    let { data: itens, error } = await sb
      .from("itens")
      .select("id, nome_na_loja, url, monitorando, preco_meta, user_id, lojas(nome), produtos(categoria), usuarios(email, nome), historico_precos(preco, disponivel, coletado_em)")
      .order("nome_na_loja", { ascending: true })
      .order("coletado_em", { referencedTable: "historico_precos", ascending: false })
      .limit(1, { referencedTable: "historico_precos" });

    if (error) {
      // Fallback: banco ainda sem a migração multiusuário (sem user_id/usuarios)
      ({ data: itens, error } = await sb
        .from("itens")
        .select("id, nome_na_loja, url, monitorando, preco_meta, lojas(nome), produtos(categoria), historico_precos(preco, disponivel, coletado_em)")
        .order("nome_na_loja", { ascending: true })
        .order("coletado_em", { referencedTable: "historico_precos", ascending: false })
        .limit(1, { referencedTable: "historico_precos" }));
    }

    if (error) { showToast("Erro ao carregar dados", "error"); return; }
    if (!itens?.length) { setDados([]); return; }

    setDados(itens.map((item) => {
      const ult = item.historico_precos?.[0] || {};
      return {
        item_id: item.id, nome_na_loja: item.nome_na_loja, url: item.url || null,
        loja: item.lojas?.nome || "—", categoria: item.produtos?.categoria || "—",
        monitorando: item.monitorando, preco_meta: item.preco_meta,
        preco: ult.preco ?? null, disponivel: ult.disponivel ?? false,
        coletado_em: ult.coletado_em ?? null,
        // Dono do item (visão de admin; usuário normal só recebe os seus via RLS)
        dono_id:    item.user_id || null,
        dono_email: item.usuarios?.email || null,
        dono_nome:  item.usuarios?.nome  || null,
      };
    }));
  }, [showToast]);

  const carregarAlertas = useCallback(async () => {
    const sb   = await getSupabase();
    const { data } = await sb
      .from("alertas")
      .select("id, tipo, preco_gatilho, preco_anterior, criado_em, itens(nome_na_loja, url, lojas(nome))")
      .gte("criado_em", inicioDoDiaBRT())
      .order("criado_em", { ascending: false })
      .limit(20);
    setAlertas(data || []);
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
  // "Abaixo da meta" (todo:65, decisão 05/07/2026): oportunidades AGORA —
  // itens ativos cujo preço atual está abaixo do preço-meta definido.
  // Substitui o antigo "Alertas hoje" (quase sempre 0 com 1 coleta/dia,
  // zerava à meia-noite e contava em dobro abaixo_meta + queda_preco).
  const comMeta    = ativos.filter((d) => d.preco_meta);
  const abaixoMeta = comMeta.filter((d) => d.preco && d.preco < d.preco_meta);

  // Filtro + busca + sort
  const dadosFiltrados = (() => {
    let d = filtro === "all" ? [...dados] : dados.filter((x) => x.categoria === filtro);
    if (isAdmin && filtroUsuario !== "all") {
      d = d.filter((x) => x.dono_id === filtroUsuario);
    }
    if (termoBusca.trim()) {
      const q = termoBusca.toLowerCase();
      d = d.filter((x) =>
        (x.nome_na_loja || "").toLowerCase().includes(q) ||
        (x.loja || "").toLowerCase().includes(q) ||
        (x.categoria || "").toLowerCase().includes(q)
      );
    }
    if (filtroLoja !== "all") {
      const q = filtroLoja.toLowerCase();
      d = d.filter(x => (x.loja || "").toLowerCase().includes(q));
    }
    if (filtroProduto !== "all") {
      d = d.filter(x => x.item_id === filtroProduto);
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

  // ── Escopo de coleta (Sprint 4: coleta segmentada) ───────────
  // Produtos da loja selecionada (para o filtro "produto de loja")
  const produtosDaLoja = filtroLoja === "all" ? [] :
    dados
      .filter((x) => (x.loja || "").toLowerCase().includes(filtroLoja))
      .sort((a, b) => (a.nome_na_loja || "").localeCompare(b.nome_na_loja || "", "pt-BR"));

  const lojaAtiva = LOJAS_FILTER.find((l) => l.key === filtroLoja);
  const escopado  = filtro !== "all" || filtroLoja !== "all" || (isAdmin && filtroUsuario !== "all");

  // Admin: donos distintos dos itens carregados (usuário normal só recebe os seus)
  const donos = isAdmin
    ? [...new Map(dados.filter((x) => x.dono_id).map((x) =>
        [x.dono_id, { id: x.dono_id, rotulo: x.dono_nome || x.dono_email || x.dono_id.slice(0, 8) }]
      )).values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"))
    : [];
  const rotuloDono = (item) =>
    item.dono_id === user?.id ? "você" : (item.dono_nome || item.dono_email || "—");

  // Ao trocar de loja, o filtro de produto (que pertence à loja) é limpo
  const selecionarLoja = (key) => { setFiltroLoja(key); setFiltroProduto("all"); };

  /**
   * Resolve o escopo da coleta a partir dos filtros ativos na toolbar:
   *   produto selecionado → pontual (item_id)
   *   categoria/loja      → segmentada (inputs combináveis)
   *   ◈ USUÁRIOS (admin)  → segmentada por dono (user_id)
   *   sem filtros         → completa
   * Usuário NORMAL sempre coleta só os próprios itens (user_id — Sprint 9);
   * o admin coleta global, exceto quando filtra por um dono.
   * `total` = quantos itens o coletor vai pegar (mesma semântica do main.py).
   */
  const escopoColeta = () => {
    if (filtroLoja !== "all" && filtroProduto !== "all") {
      const prod = dados.find((x) => x.item_id === filtroProduto);
      // pontual coleta mesmo com monitoramento pausado
      return { item_id: filtroProduto, total: 1, descricao: `apenas "${prod?.nome_na_loja || "produto selecionado"}"` };
    }
    const esc    = {};
    const partes = [];
    if (filtro !== "all")     { esc.categoria = filtro;         partes.push(`categoria ${CAT_LABEL[filtro] || filtro}`); }
    if (filtroLoja !== "all") { esc.loja = lojaAtiva?.slug;     partes.push(`loja ${lojaAtiva?.label}`); }
    if (isAdmin) {
      if (filtroUsuario !== "all") {
        esc.user_id = filtroUsuario;
        const dono  = donos.find((d) => d.id === filtroUsuario);
        partes.push(filtroUsuario === user?.id ? "apenas os seus produtos" : `usuário ${dono?.rotulo || "selecionado"}`);
      }
    } else if (user?.id) {
      esc.user_id = user.id;
      partes.push("apenas os seus produtos");
    }
    // Contagem com os mesmos critérios do coletor: monitorando=true +
    // categoria + loja (comparada pelo slug, como no dict SCRAPERS) + dono
    const slugLoja = (nome) => (nome || "").toLowerCase().replace(/ /g, "");
    esc.total = dados.filter((x) =>
      x.monitorando &&
      (!esc.categoria || x.categoria === esc.categoria) &&
      (!esc.loja      || slugLoja(x.loja) === esc.loja) &&
      (!esc.user_id   || x.dono_id === esc.user_id)
    ).length;
    esc.descricao = partes.length ? partes.join(" + ") : "todos os produtos monitorados";
    return esc;
  };

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

  const iniciarColeta = async (escopo = {}) => {
    setColetando(true);
    const descricao = escopo.descricao || "todos os produtos";
    setProgresso({ visible: true, txt: "Conectando ao servidor...", pct: 15 });

    try {
      setProgresso({ visible: true, txt: "Disparando workflow...", pct: 40 });

      // Corpo do dispatch (mesma semântica do main.py):
      //   item_id → pontual; categoria/loja/user_id → segmentada; vazio → completa
      const body = {};
      if (escopo.item_id) {
        body.item_id = escopo.item_id;
      } else {
        if (escopo.categoria) body.categoria = escopo.categoria;
        if (escopo.loja)      body.loja      = escopo.loja;
        if (escopo.user_id)   body.user_id   = escopo.user_id;
      }

      const resp = await fetch("/api/trigger-coleta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();

      if (resp.ok && data.ok) {
        setProgresso({ visible: true, txt: "Workflow disparado com sucesso!", pct: 100 });
        showToast(`⚡ Coleta iniciada (${descricao}) no GitHub Actions!`, "ok");
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

  const opcColetar = (item) => {
    setOpcoesItem(null);
    confirmar(
      "COLETAR AGORA",
      `Disparar uma coleta imediata de preço <strong>apenas para este produto</strong>:<br><br><strong>${item.nome_na_loja}</strong><br><br>O processo roda no GitHub Actions e pode levar alguns minutos.`,
      "⚡",
      () => iniciarColeta({ item_id: item.item_id, descricao: `"${item.nome_na_loja}"` }),
      false,
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
          <div className="stat-label">Abaixo da meta</div>
          <div className="stat-value amber">{abaixoMeta.length}</div>
          <div className="stat-sub">
            {comMeta.length
              ? `de ${comMeta.length} com meta definida`
              : "nenhum item com meta"}
          </div>
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
                {horaBRT(ultColeta.coletado_em, { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="stat-sub">
                {dataBRT(ultColeta.coletado_em)}
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
            {/* Linha 1: Busca e Ação */}
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
              <button className="btn-coletar" disabled={coletando} onClick={() => {
                const esc = escopoColeta();
                const segmentada = esc.item_id || esc.categoria || esc.loja || (isAdmin && esc.user_id);
                const qtd = esc.total > 0
                  ? `⚡ <strong>${esc.total} ${esc.total === 1 ? "item será coletado" : "itens serão coletados"}</strong>`
                  : `<span style="color:var(--amber)">⚠ Nenhum item monitorado nesse escopo — nada será coletado</span>`;
                confirmar(
                  "COLETAR AGORA",
                  segmentada
                    ? `Isso irá disparar uma coleta imediata <strong>segmentada pelos filtros ativos</strong>:<br><br><strong>${esc.descricao}</strong><br><br>${qtd}<br><br>O processo pode levar alguns minutos.`
                    : `Isso irá disparar uma coleta imediata de preços de <strong>todos os ${isAdmin ? "produtos monitorados" : "seus produtos monitorados"}</strong>.<br><br>${qtd}<br><br>O processo pode levar alguns minutos.`,
                  "⚡",
                  () => iniciarColeta(esc),
                  false,
                );
              }}>
                <span>⚡</span>
                <span>{coletando ? "DISPARANDO..." : escopado ? "COLETAR FILTRADOS" : "COLETAR AGORA"}</span>
              </button>
            </div>

            {/* Linha admin: filtro por usuário — Todos · Eu · dropdown (Sprint 11) */}
            {isAdmin && donos.length > 0 && (
              <div className="toolbar-row">
                <div className="filters">
                  <span className="user-filter-tag">◈ USUÁRIOS</span>
                  <button
                    className={`filter-btn filter-btn-user${filtroUsuario === "all" ? " active" : ""}`}
                    onClick={() => setFiltroUsuario("all")}
                  >
                    Todos ({dados.length})
                  </button>
                  <button
                    className={`filter-btn filter-btn-user${filtroUsuario === user?.id ? " active" : ""}`}
                    title={user?.id}
                    onClick={() => setFiltroUsuario(user?.id)}
                  >
                    Eu ({dados.filter((x) => x.dono_id === user?.id).length})
                  </button>
                  {/* Dropdown com os demais donos: escala melhor que uma fileira
                      de chips quando há muitos usuários com itens */}
                  {donos.some((d) => d.id !== user?.id) && (
                    <select
                      className="produto-select"
                      value={donos.some((d) => d.id === filtroUsuario && d.id !== user?.id) ? filtroUsuario : ""}
                      onChange={(e) => setFiltroUsuario(e.target.value || "all")}
                      title="Filtrar por um usuário específico"
                    >
                      <option value="">— usuário específico —</option>
                      {donos.filter((d) => d.id !== user?.id).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.rotulo} ({dados.filter((x) => x.dono_id === d.id).length})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Linha 2: Filtros de categoria + contagem de resultados */}
            <div className="toolbar-row">
              <div className="filters">
                {FILTROS_CAT.map((f) => (
                  <button key={f} className={`filter-btn${filtro === f ? " active" : ""}`} onClick={() => setFiltro(f)}>
                    {CAT_LABEL[f] || f}
                  </button>
                ))}
              </div>
              <div className="result-count">
                {dadosFiltrados.length === dados.length
                  ? `${dados.length} produto(s)`
                  : `${dadosFiltrados.length} de ${dados.length}`}
              </div>
            </div>

            {/* Linha 3: filtros por loja (esquerda) + ordenação NOME/PREÇO (direita) */}
            <div className="toolbar-row">
              <div className="filters">
                {LOJAS_FILTER.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`filter-btn filter-btn-loja${filtroLoja === key ? " active" : ""}`}
                    onClick={() => selecionarLoja(key)}
                  >
                    {label}
                  </button>
                ))}
                {filtroLoja !== "all" && (
                  <select
                    className="produto-select"
                    value={filtroProduto}
                    onChange={(e) => setFiltroProduto(e.target.value)}
                    title={`Filtrar por um produto da ${lojaAtiva?.label}`}
                  >
                    <option value="all">Todos os produtos · {lojaAtiva?.label}</option>
                    {produtosDaLoja.map((p) => (
                      <option key={p.item_id} value={p.item_id}>
                        {p.nome_na_loja}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="sort-controls sort-controls-right">
                {[["nome", "Nome"], ["preco", "Preço"]].map(([campo, label]) => (
                  <button key={campo} className={`sort-btn${sortCampo === campo ? " active" : ""}`} onClick={() => toggleSort(campo)}>
                    <span>{label}</span>
                    <span style={{ fontSize: ".7rem", opacity: .7 }}>
                      {sortCampo === campo ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                ))}
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
                <colgroup>
                  <col className="col-produto" />
                  <col className="col-loja" />
                  <col className="col-preco" />
                  <col className="col-status" />
                  <col className="col-acoes" />
                </colgroup>
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
                          <div className="prod-cat">
                            {item.categoria}
                            {isAdmin && item.dono_id && (
                              <span className={`prod-dono${item.dono_id === user?.id ? " prod-dono-voce" : ""}`}>
                                ◈ {rotuloDono(item)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td><span className="loja-badge">{item.loja}</span></td>
                        <td>
                          {precoFmt
                            ? <>
                                <div className="price-current">{precoFmt}</div>
                                {item.preco_meta && (
                                  <div className="price-meta">
                                    meta: R$ {Number(item.preco_meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </div>
                                )}
                                {item.coletado_em && (
                                  <div className="price-timestamp">
                                    {dataHoraBRT(item.coletado_em, {
                                      day:    "2-digit",
                                      month:  "2-digit",
                                      year:   "numeric",
                                      hour:   "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                )}
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
                const dt    = dataHoraBRT(a.criado_em, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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