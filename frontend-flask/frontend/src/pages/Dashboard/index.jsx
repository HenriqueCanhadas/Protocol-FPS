/**
 * pages/Dashboard/index.jsx — PROTOCOL FPS
 * Página principal: KPIs, tabela de preços, botão coletar.
 *
 * Reorganizada em Sprint 17/V3 a partir do antigo pages/Dashboard.jsx
 * (arquivo único de ~1620 linhas) na estrutura de pastas do protótipo de
 * referência (project/project-complete.zip) — components/, dialogs/,
 * hooks/, services/, utils/format.js.
 *
 * Sprint 19/V3: a tabela ganhou seleção de linha (useProductSelection) e os
 * 3 botões por linha (Histórico/Opções/Remover) viraram uma ActionBar única
 * que opera sobre o item selecionado — modelo do protótipo de referência.
 *
 * Sprint 20/V3: os 4 modais de ação (Opções/Meta/Renomear/Categoria) viraram
 * um único ProductActionsDialog com "modos" internos; todos os dialogs agora
 * usam o TerminalModal genérico (foco preso + Esc fecha).
 *
 * Sprint 21/V3: Sidebar com PriceChartPanel (gráfico sempre visível do item
 * selecionado). CollectionsPanel/ItemDetailPanel/CollectionDayDialog do
 * protótipo ainda não existem aqui de propósito — seguem nesta mesma sprint
 * (ver project/sprint_v3.md).
 *
 * V4: a ActionBar (Histórico/Opções/Remover) foi absorvida pela ControlBar —
 * Opções/Remover viraram parte do painel de filtros (habilitados só com item
 * selecionado) e o botão de Histórico saiu, pois o PriceChartPanel/EXPANDIR
 * da sidebar já cobre essa função. O KpiRibbon saiu do topo full-width e virou
 * um painel a mais na sidebar, ao lado do gráfico/detalhe do item.
 */
import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/services/supabase";
import { buscarItens, removerNoServidor } from "@/services/dashboard.service";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useProductSelection } from "@/hooks/useProductSelection";
import { dataBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";
import { CAT_LABEL } from "./Dashboard.constants";

import ConfirmModal from "@/components/ConfirmModal";
import ControlBar from "./components/ControlBar";
import ProductTable from "./components/ProductTable";
import Sidebar from "./components/Sidebar";
import ProductHistoryDialog from "./dialogs/ProductHistoryDialog";
import ProductActionsDialog from "./dialogs/ProductActionsDialog";
import CollectionDayDialog from "./dialogs/CollectionDayDialog";

/* ── estilos locais ─────────────────────────────────────────── */
const css = `
#app { display:flex; flex-direction:column; min-height:100vh; }
/* KPIs (V4: painel da sidebar — era faixa full-width no topo) */
.kpi-panel { background:var(--bg2); border:1px solid var(--border2); padding:1.1rem 1.25rem; }
.kpi-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.1rem 1rem; }
.kpi-cell { display:flex; flex-direction:column; gap:.15rem; }
.stat-label { font-size:var(--fs-xs); letter-spacing:.2em; color:var(--text-dim); text-transform:uppercase; }
.stat-value { font-family:var(--display); font-size:1.2rem; letter-spacing:.03em; color:var(--green); line-height:1.1; }
.stat-sub   { font-size:var(--fs-xs); color:var(--text-muted); line-height:1.2; word-break:break-word; }
.stat-value.amber { color:var(--amber); }
.stat-value.red { color:var(--red); }

.dash-main { flex:1; padding:1.75rem 1.5rem; display:flex; flex-direction:column; gap:2rem; }

/* grid conteúdo + sidebar (Sprint 21) */
.dash-grid { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:2rem; align-items:start; }
.dash-content { display:flex; flex-direction:column; gap:2rem; min-width:0; }
.dash-sidebar { display:flex; flex-direction:column; gap:1.25rem; position:sticky; top:1.75rem; }

.sidebar-panel-header { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:.55rem; }
.sidebar-panel-title { font-size:var(--fs-sm); letter-spacing:.15em; text-transform:uppercase; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sidebar-panel-expand { background:none; border:1px solid var(--border2); color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; padding:.35rem .7rem; cursor:pointer; transition:all .15s; white-space:nowrap; flex-shrink:0; }
.sidebar-panel-expand:hover { border-color:var(--green-dim); color:var(--green); }
.sidebar-panel-empty { color:var(--text-muted); letter-spacing:.1em; font-size:var(--fs-sm); text-align:center; padding:1.5rem 0; }
.sidebar-panel-meta { display:flex; justify-content:space-between; font-size:var(--fs-xs); letter-spacing:.08em; margin-bottom:.45rem; }

.price-chart-panel { background:var(--bg2); border:1px solid var(--border2); padding:.75rem 1rem; }
.price-chart-panel .hist-grafico { margin-bottom:0; }

/* últimos dias de coleta (Sprint 21) */
.collections-panel { background:var(--bg2); border:1px solid var(--border2); padding:1.1rem 1.25rem; }
.collections-list { display:flex; flex-direction:column; gap:.35rem; }
.collections-list li { display:flex; align-items:center; gap:.4rem; }
.collections-list li.sel .collections-dia { border-color:var(--green); background:var(--green-soft); }
.collections-dia { flex:1; display:grid; grid-template-columns:44px 1fr 28px; align-items:center; gap:.6rem; background:none; border:1px solid transparent; padding:.4rem .5rem; cursor:pointer; transition:all .15s; }
.collections-dia:hover { border-color:var(--border2); }
.collections-data { font-size:var(--fs-xs); color:var(--text-dim); letter-spacing:.05em; white-space:nowrap; }
.collections-bar-track { height:6px; background:var(--bg3); position:relative; overflow:hidden; }
.collections-bar-fill { position:absolute; left:0; top:0; bottom:0; background:var(--green-dim); }
.collections-count { font-size:var(--fs-xs); color:var(--text); text-align:right; }
.collections-expand { background:none; border:1px solid var(--border2); color:var(--text-muted); font-size:var(--fs-xs); padding:.3rem .45rem; cursor:pointer; transition:all .15s; }
.collections-expand:hover { border-color:var(--green-dim); color:var(--green); }

/* detalhe de um dia específico (CollectionDayDialog, Sprint 21) */
.dia-detalhe-list { display:flex; flex-direction:column; gap:.5rem; }
.dia-detalhe-row { display:grid; grid-template-columns:64px 1fr auto auto; gap:.9rem; align-items:center; font-size:var(--fs-sm); padding:.4rem 0; border-bottom:1px solid var(--border); }
.dia-detalhe-row:last-child { border-bottom:none; }
.dia-detalhe-nome { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dia-detalhe-preco { color:var(--text); text-align:right; white-space:nowrap; }
.dia-detalhe-var { text-align:right; font-size:var(--fs-xs); min-width:56px; }

/* detalhe do item + atividade recente (Sprint 21) */
.item-detail-panel { background:var(--bg2); border:1px solid var(--border2); padding:1.1rem 1.25rem; }
.item-detail-kv { display:flex; flex-direction:column; gap:.55rem; }
.item-detail-kv > div { display:flex; justify-content:space-between; gap:.75rem; font-size:var(--fs-sm); border-bottom:1px solid var(--border); padding-bottom:.5rem; }
.item-detail-kv > div:last-child { border-bottom:none; padding-bottom:0; }
.item-detail-kv dt { color:var(--text-dim); letter-spacing:.08em; text-transform:uppercase; font-size:var(--fs-xs); flex-shrink:0; }
.item-detail-kv dd { color:var(--text); text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.item-detail-atividade { margin-top:1.1rem; padding-top:1rem; border-top:1px dashed var(--border); }
.item-detail-atividade-title { font-size:var(--fs-xs); letter-spacing:.2em; text-transform:uppercase; color:var(--text-dim); margin-bottom:.65rem; }
.atividade-list { display:flex; flex-direction:column; gap:.4rem; max-height:220px; overflow-y:auto; }
.atividade-list li { display:grid; grid-template-columns:auto 1fr auto; gap:.6rem; align-items:center; font-size:var(--fs-xs); }
.atividade-hora { font-family:var(--mono); white-space:nowrap; }
.atividade-nome { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

@media (max-width:1100px) {
  .dash-grid { grid-template-columns:1fr; }
  .dash-sidebar { position:static; }
}

/* Sem barra de rolagem na página (pedido do usuário): a partir daqui só a
   tabela e a sidebar (que agora carrega os KPIs também — V4) rolam por
   dentro de si mesmas — o resto (header, toolbar, footer) fica sempre
   visível. Só em telas largas o suficiente para o grid de duas colunas
   (mesmo corte de 1100px de cima); abaixo disso a página volta a rolar
   normalmente, como no celular. O componente trava a altura de #app via JS
   (useEffect), não CSS. */
@media (min-width:1101px) {
  .dash-main { min-height:0; overflow:hidden; }
  /* .dash-grid e .price-section precisam de flex:1 para de fato ocupar a
     altura disponível — sem isso os dois ficam do tamanho do próprio
     conteúdo (flex-grow padrão é 0), sobra espaço em branco acima do rodapé
     e a tabela, "espremida" nesse espaço menor que o real, cria rolagem
     interna sem necessidade (reportado pelo usuário na Sprint 25/V4, mas já
     existia antes — ficou muito mais visível com as linhas mais baixas) */
  .dash-grid { flex:1; min-height:0; align-items:stretch; }
  .dash-content { min-height:0; overflow:hidden; }
  .price-section { flex:1; display:flex; flex-direction:column; min-height:0; }
  .price-table-wrap { flex:1; min-height:0; overflow-y:auto; }
  .dash-sidebar { min-height:0; overflow-y:auto; padding-right:.4rem; }
}
.section-header { display:flex; align-items:center; gap:.9rem; margin-bottom:1.25rem; }
.section-title  { font-size:var(--fs-sm); letter-spacing:.3em; text-transform:uppercase; color:var(--text-dim); white-space:nowrap; }
.section-line   { flex:1; height:1px; background:linear-gradient(to right,var(--border2),transparent); }

/* toolbar */
.toolbar { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1.25rem; }
/* busca — vira ícone na linha de filtros, some quando não em uso */
.search-icon-btn {
  background:var(--bg3); border:1px solid var(--border2); color:var(--green);
  font-size:1.05rem; padding:.48rem .7rem; cursor:pointer; transition:all .15s; line-height:1;
}
.search-icon-btn:hover { border-color:var(--green-dim); background:var(--green-soft); }
.search-icon-btn.active { border-color:var(--green); background:var(--green-soft); box-shadow:0 0 8px var(--green-glow); }

.btn-coletar {
  display:flex; align-items:center; gap:.6rem;
  background:transparent; border:1px solid var(--amber);
  color:var(--amber); font-family:var(--mono); font-size:var(--fs-sm);
  letter-spacing:.18em; padding:.7rem 1.5rem; cursor:pointer; text-transform:uppercase;
  transition:background .2s,box-shadow .2s;
}
.btn-coletar:hover { background:rgba(255,184,0,.1); box-shadow:0 0 20px rgba(255,184,0,.2); }
.btn-coletar:disabled { opacity:.4; cursor:not-allowed; }
.filters-row .btn-coletar { align-self:center; }

.prod-dono { margin-left:.75rem; color:var(--blue); opacity:.85; letter-spacing:.06em; }
.prod-dono-voce { color:var(--green); }

/* painel único de filtros — dropdowns compactos em vez de fileiras de chips
   (pedido do usuário: sobrar espaço vertical para a tabela) */
.filters-row { display:flex; flex-wrap:wrap; align-items:flex-end; gap:.85rem 1rem; padding:.85rem 1rem; background:var(--bg2); border:1px solid var(--border2); }
.filter-group { display:flex; flex-direction:column; gap:.3rem; }
.filter-group-label { font-size:var(--fs-xs); letter-spacing:.18em; text-transform:uppercase; color:var(--text-dim); white-space:nowrap; }
.filter-select {
  background:var(--bg3); border:1px solid var(--border2);
  color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-sm);
  letter-spacing:.04em; padding:.5rem .6rem; cursor:pointer;
  /* largura reduzida (era 220px) — margem extra para nunca estourar a
     largura do card de filtros em navegadores que renderizam <select>
     nativo um pouco mais largo (ex.: Opera GX) */
  max-width:180px; outline:none; transition:border-color .15s,box-shadow .15s,color .15s;
}
.filter-select:hover,.filter-select:focus { border-color:var(--green-dim); color:var(--text); }
.filter-select.active { border-color:var(--green); color:var(--green); background:var(--green-soft); }
.filter-select option { background:var(--bg2); color:var(--text); }
.filter-sep { align-self:stretch; width:1px; background:var(--border2); margin:0 .1rem; }
.sort-compact { display:flex; gap:.4rem; }
.sort-dir-btn {
  background:var(--bg3); border:1px solid var(--border2); color:var(--text-dim);
  font-size:.85rem; padding:.5rem .65rem; cursor:pointer; transition:all .15s; line-height:1;
}
.sort-dir-btn:hover { border-color:var(--green-dim); color:var(--green); }
.filters-row .filter-actions-group { margin-left:auto; }
.filter-actions { display:flex; align-items:center; gap:.6rem; }
.filter-actions .action-btn { position:static; width:auto; padding:.55rem 1rem; }
.filter-actions .action-btn .ab-icon { position:static; transform:none; }

/* filtro por dia de coleta (Sprint 14) — acoplado à barra de ordenação */
.dia-coleta-wrap { display:flex; align-items:center; gap:.35rem; }
.dia-coleta-input {
  background:var(--bg2); border:1px solid var(--border2);
  color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-xs);
  letter-spacing:.08em; padding:.45rem .6rem; cursor:pointer; outline:none;
  color-scheme:dark; transition:border-color .15s,box-shadow .15s,color .15s;
}
.dia-coleta-input:hover,.dia-coleta-input:focus { border-color:var(--green-dim); color:var(--text); }
.dia-coleta-input.on { border-color:var(--green); color:var(--green); background:var(--green-soft); }
.dia-coleta-clear { background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:.85rem; padding:.2rem .3rem; transition:color .15s; }
.dia-coleta-clear:hover { color:var(--red); }

/* progresso */
.coleta-progress { background:var(--bg2); border:1px solid var(--border2); padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.6rem; }
.coleta-status { display:flex; justify-content:space-between; align-items:center; font-size:var(--fs-sm); color:var(--text-dim); letter-spacing:.1em; }
.coleta-status .item-atual { color:var(--text); max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.progress-bar { height:3px; background:var(--border2); position:relative; overflow:hidden; }
.progress-fill { position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg,var(--green-dim),var(--green)); transition:width .4s ease; box-shadow:0 0 10px rgba(57,255,20,.3); }

/* tabela */
.price-table-wrap { overflow-x:auto; border:1px solid var(--border2); }
table { width:100%; border-collapse:collapse; font-size:var(--fs-base); table-layout:fixed; min-width:760px; }
/* Larguras fixas das colunas (Sprint 19: coluna Ações saiu, virou ActionBar) */
.col-produto { width:45%; }
.col-loja    { width:17%; }
.col-preco   { width:20%; }
.col-status  { width:18%; }
thead { background:var(--bg3); position:sticky; top:0; z-index:2; }
th { text-align:left; padding:.85rem 1.1rem; font-size:var(--fs-xs); letter-spacing:.25em; text-transform:uppercase; color:var(--text-dim); border-bottom:1px solid var(--border2); white-space:nowrap; }
tbody tr { border-bottom:1px solid var(--border); transition:background .15s; cursor:pointer; }
tbody tr:hover { background:rgba(57,255,20,.025); }
tbody tr:last-child { border-bottom:none; }
tbody tr.row-off { opacity:.55; }
tbody tr.row-off:hover { opacity:.75; }
tbody tr.row-selected { background:var(--green-soft); box-shadow:inset 3px 0 0 var(--green); }
tbody tr.row-selected:hover { background:var(--green-soft); }
/* Sprint 25/V4: padding vertical reduzido (era .9rem) — linhas mais baixas,
   mais itens visíveis sem rolar; a célula de preço também encolheu ao virar
   só o valor atual + tooltip (ver .price-hover) */
td { padding:.55rem 1.1rem; vertical-align:middle; }
.td-produto { min-width:220px; }
.prod-nome { font-size:var(--fs-base); font-weight:500; line-height:1.35; }
.prod-cat  { font-size:var(--fs-xs); color:var(--text-dim); margin-top:.15rem; letter-spacing:.1em; text-transform:uppercase; }
.loja-badge { display:inline-block; border:1px solid var(--border2); padding:.25rem .45rem; font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); }
.price-current { font-family:var(--display); font-size:1.3rem; letter-spacing:.03em; color:var(--green); }
/* meta/★ menor/data de coleta saíram da célula e viraram tooltip no hover
   do preço atual (Sprint 25/V4 — antes ficavam sempre visíveis, 3 linhas
   extras por célula) */
.price-hover { position:relative; display:inline-block; cursor:default; }
/* max-height:0+overflow:hidden por padrão (Sprint 25/V4, correção): mesmo
   escondido por opacity/visibility, um elemento posicionado abaixo da linha
   ainda contava no scrollHeight da tabela — a última linha "esticava" o fim
   da lista com um vão vazio que a rolagem nunca alcançava (reportado pelo
   usuário). Zerar também padding/border por padrão é necessário: com
   max-height:0 sozinho, o border-box ainda "empresta" a altura do padding+
   borda (o max-height não encolhe esses dois abaixo do valor especificado) */
.price-tooltip {
  position:absolute; left:0; top:100%; margin-top:.4rem; z-index:5;
  background:var(--bg2); border:1px solid transparent; padding:0;
  font-size:var(--fs-xs); color:var(--text-dim); line-height:1.6; white-space:nowrap;
  opacity:0; visibility:hidden; max-height:0; overflow:hidden;
  transition:opacity .12s ease;
  pointer-events:none;
}
.price-hover:hover .price-tooltip,
.price-hover:focus-visible .price-tooltip {
  opacity:1; visibility:visible; max-height:none; overflow:visible;
  border-color:var(--green-dim); padding:.5rem .7rem;
  box-shadow:0 4px 14px rgba(0,0,0,.55);
}
.price-tooltip .pt-menor { color:var(--amber); }
.catm-grid { display:flex; flex-wrap:wrap; gap:.6rem; }
.catm-chip { background:var(--bg3); border:1px solid var(--border2); color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-sm); letter-spacing:.12em; text-transform:uppercase; padding:.55rem 1rem; cursor:pointer; transition:all .15s; user-select:none; }
.catm-chip:hover { border-color:var(--green-dim); color:var(--text); }
.catm-chip.sel { border-color:var(--green); color:var(--green); background:var(--green-soft); }
.price-unavailable { color:var(--text-muted); font-size:var(--fs-sm); }
.status-badge { font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; padding:.3rem .5rem; border:1px solid; white-space:nowrap; }
.status-badge.ok    { color:var(--green); border-color:var(--green-dim); }
.status-badge.out   { color:var(--text-muted); border-color:var(--border); }
.status-badge.alert { color:var(--amber); border-color:var(--amber); }
.status-badge.off   { color:var(--red); border-color:rgba(255,68,68,.4); }
.prod-nome-link { color:inherit; text-decoration:none; border-bottom:1px solid transparent; transition:color .15s,border-color .15s; }
.prod-nome-link:hover { color:var(--green); border-bottom-color:var(--green-dim); }
/* Sprint 27/V4 (todo:206): URL completa em tooltip ao passar o mouse sobre
   o nome do produto — mesmo padrão visual/estrutural do .price-tooltip
   (Sprint 25), com word-break porque URLs de produto podem ser bem longas */
.prod-nome-hover { position:relative; display:inline-block; }
.prod-nome-tooltip {
  position:absolute; left:0; top:100%; margin-top:.4rem; z-index:5;
  background:var(--bg2); border:1px solid transparent; padding:0;
  font-size:var(--fs-xs); color:var(--text-dim); line-height:1.5;
  opacity:0; visibility:hidden; max-height:0; overflow:hidden;
  transition:opacity .12s ease; pointer-events:none;
  max-width:360px; word-break:break-all;
}
.prod-nome-hover:hover .prod-nome-tooltip,
.prod-nome-hover:focus-within .prod-nome-tooltip {
  opacity:1; visibility:visible; max-height:none; overflow:visible;
  border-color:var(--green-dim); padding:.5rem .7rem;
  box-shadow:0 4px 14px rgba(0,0,0,.55);
}

/* ações sobre o item selecionado — V4: viveram na ActionBar (Sprint 19),
   agora fazem parte do painel de filtros (Opções/Remover; Histórico saiu) */
.action-btn { position:relative; display:flex; align-items:center; justify-content:center; background:none; border:1px solid transparent; font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.1em; padding:.35rem .65rem .35rem 1.75rem; cursor:pointer; text-transform:uppercase; transition:all .18s; white-space:nowrap; width:100%; }
.action-btn .ab-icon { position:absolute; left:.6rem; top:50%; transform:translateY(-50%); flex-shrink:0; }
.action-btn .ab-label { text-align:center; }
.action-btn.remove { color:var(--text-muted); border-color:transparent; }
.action-btn.remove:not(:disabled) { color:var(--red); border-color:rgba(255,68,68,.4); }
.action-btn.remove:hover:not(:disabled) { border-color:var(--red); background:rgba(255,68,68,.08); box-shadow:0 0 12px rgba(255,68,68,.2); }
.action-btn:disabled { opacity:.35; cursor:not-allowed; }
.action-btn:disabled:hover { background:none; box-shadow:none; }

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
.meta-modal::before { content:attr(data-label); position:absolute; top:-1px; left:1.5rem; background:var(--bg2); color:var(--amber); font-size:var(--fs-xs); letter-spacing:.3em; padding:0 .6rem; transform:translateY(-50%); text-transform:uppercase; }
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

/* botão "Opções" do painel de filtros */
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

/* footer */
.site-footer { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.5rem; border-top:1px solid var(--border); background:var(--bg2); font-size:.75rem; letter-spacing:.08em; color:var(--text-dim); text-transform:uppercase; user-select:none; }
.footer-phrase { display:flex; align-items:center; gap:.2rem; }
.footer-dots { flex:1; margin:0 1.5rem; border-top:1px dashed var(--border); }

.empty { text-align:center; padding:3rem 1.5rem; color:var(--text-dim); font-size:var(--fs-base); letter-spacing:.1em; line-height:2; }

/* Sprint 39/V5 (todo:235): abaixo do min-width da tabela (760px) a rolagem
   horizontal contida (.price-table-wrap) escondia Loja/Preço/Status fora da
   tela sem nenhuma indicação visual de que havia mais conteúdo ao lado —
   pior ainda, uma tentativa anterior aqui simplesmente escondia a coluna
   Status via display:none, perdendo informação. Substituído por um layout
   de cards: cada linha vira um cartão empilhado com todos os dados
   visíveis, sem esconder nada e sem depender de rolagem lateral. */
@media (max-width:700px) {
  .dash-main { padding:1.25rem 1rem; }
  .price-table-wrap table { min-width:0; }
  .price-table-wrap thead { display:none; }
  .price-table-wrap table, .price-table-wrap tbody { display:block; }
  .price-table-wrap tbody tr {
    display:flex; flex-wrap:wrap; align-items:center;
    gap:.35rem .7rem; padding:.75rem .9rem;
  }
  .price-table-wrap td { display:block; padding:0; }
  .price-table-wrap .td-produto { flex:1 1 100%; order:1; min-width:0; }
  .price-table-wrap td:nth-child(2) { order:2; }
  .price-table-wrap td:nth-child(3) { order:3; margin-left:auto; }
  .price-table-wrap td:nth-child(4) { order:4; }
  /* .price-tooltip (nowrap, sem max-width) ficava invisível mas ainda
     contava no scrollWidth do .price-table-wrap ao extrapolar a largura do
     card — rolagem horizontal "fantasma" reportada pelo usuário no celular
     mesmo a página inteira não vazando. Ancorado no <tr> (padding-box vira o
     containing block) em vez de no preço, com quebra de linha normal: o
     tooltip fica sempre contido dentro da largura do próprio cartão. */
  .price-table-wrap tbody tr { position:relative; }
  .price-hover { position:static; }
  .price-tooltip {
    left:.9rem; right:.9rem; white-space:normal; max-width:none;
  }
}
@media (max-width:480px) {
  .kpi-grid { grid-template-columns:1fr; }
}
`;

export default function Dashboard({ showToast, isAdmin = false, user = null }) {
  const [dados,         setDados]         = useState([]);
  const [coletando,     setColetando]     = useState(false);
  const [progresso,     setProgresso]     = useState({ visible: false, txt: "", pct: 0 });
  const [historicoItem, setHistoricoItem] = useState(null);
  const [acoesItem,     setAcoesItem]     = useState(null); // ProductActionsDialog (Sprint 20: era metaItem/nomeItem/catItem/opcoesItem separados)
  const [diaDetalhe,    setDiaDetalhe]    = useState(null); // CollectionDayDialog (Sprint 21)
  const [confirm,       setConfirm]       = useState(null);

  const filters = useDashboardFilters({ dados, isAdmin, user });
  const { filtro, filtroLoja, filtroProduto, filtroUsuario, filtroDia, setFiltroDia, dadosFiltrados, lojaAtiva, donos } = filters;

  // Sprint 19/V3: seleção de linha da ActionBar + navegação por teclado.
  // Desabilitada enquanto qualquer modal está aberto, para não competir com
  // atalhos/inputs dos próprios modais.
  const algumDialogAberto = !!(historicoItem || acoesItem || diaDetalhe || confirm);
  const abrirHistorico = (itemId) => {
    const item = dadosFiltrados.find((x) => x.item_id === itemId);
    if (item) setHistoricoItem({ id: item.item_id, nome: item.nome_na_loja });
  };
  const selecao = useProductSelection({
    items: dadosFiltrados,
    enabled: !algumDialogAberto,
    onOpenHistory: abrirHistorico,
  });

  // Carrega dados
  const carregarPrecos = useCallback(async () => {
    const itens = await buscarItens();
    if (itens === null) { showToast("Erro ao carregar dados", "error"); return; }
    setDados(itens);
  }, [showToast]);

  useEffect(() => {
    carregarPrecos();
  }, [carregarPrecos]);

  // Sem barra de rolagem na página (pedido do usuário): a Dashboard passa a
  // ocupar exatamente a viewport, com a tabela e a sidebar rolando por dentro
  // de si mesmas. Só entra em telas largas (>1100px, mesmo corte do grid
  // conteúdo+sidebar) — no layout empilhado de tela estreita a página volta a
  // rolar normalmente, como o usuário já espera num celular. Mexe só no DOM
  // (inline style de #app + body), nunca no App.jsx — desfeito ao sair da
  // Dashboard, então as outras páginas não são afetadas.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1101px)");
    const appEl = document.getElementById("app");
    const travar = () => {
      if (!appEl) return;
      if (mq.matches) {
        appEl.style.height = "100vh";
        appEl.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      } else {
        appEl.style.height = "";
        appEl.style.overflow = "";
        document.body.style.overflow = "";
      }
    };
    travar();
    mq.addEventListener("change", travar);
    return () => {
      mq.removeEventListener("change", travar);
      if (appEl) { appEl.style.height = ""; appEl.style.overflow = ""; }
      document.body.style.overflow = "";
    };
  }, []);

  /**
   * Resolve o escopo da coleta a partir dos filtros ativos na toolbar:
   *   produto selecionado  → pontual (item_id — coleta mesmo pausado)
   *   qualquer outro filtro → LISTA (item_ids — Sprint 14): exatamente os
   *     itens visíveis na lista filtrada (categoria/loja/usuário/busca/dia),
   *     apenas os monitorados — pausado não coleta em lote, mesma regra da
   *     coleta completa/segmentada do main.py
   *   sem filtros          → completa
   * Usuário NORMAL sempre coleta só os próprios itens (user_id — Sprint 9);
   * o admin coleta global, exceto quando filtra.
   * `total` = quantos itens o coletor vai pegar (mesma semântica do main.py).
   */
  const escopoColeta = () => {
    if (filtroLoja !== "all" && filtroProduto !== "all") {
      const prod = dados.find((x) => x.item_id === filtroProduto);
      // pontual coleta mesmo com monitoramento pausado
      return { item_id: filtroProduto, total: 1, descricao: `apenas "${prod?.nome_na_loja || "produto selecionado"}"` };
    }
    const partes = [];
    if (filtro !== "all")     partes.push(`categoria ${CAT_LABEL[filtro] || filtro}`);
    if (filtroLoja !== "all") partes.push(`loja ${lojaAtiva?.label}`);
    if (isAdmin && filtroUsuario !== "all") {
      const dono = donos.find((d) => d.id === filtroUsuario);
      partes.push(filtroUsuario === user?.id ? "somente os seus produtos" : `usuário ${dono?.rotulo || "selecionado"}`);
    }
    if (filters.termoBusca.trim()) partes.push(`busca "${filters.termoBusca.trim()}"`);
    if (filtroDia)                 partes.push(`coletados em ${dataBRT(`${filtroDia}T12:00:00-03:00`)}`);

    // Filtro ativo → coleta em LISTA: os IDs monitorados visíveis na tabela
    if (partes.length) {
      const ids = dadosFiltrados.filter((x) => x.monitorando).map((x) => x.item_id);
      return { item_ids: ids, total: ids.length, descricao: `os itens da lista filtrada (${partes.join(" + ")})` };
    }

    // Sem filtros: completa (admin/cron) ou só os itens do dono (Sprint 9)
    const esc = {};
    if (!isAdmin && user?.id) esc.user_id = user.id;
    esc.total = dados.filter((x) =>
      x.monitorando && (!esc.user_id || x.dono_id === esc.user_id)
    ).length;
    esc.descricao = esc.user_id ? "apenas os seus produtos" : "todos os produtos monitorados";
    return esc;
  };

  // Ações
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
    setAcoesItem(null);
    showToast(valor === null ? "Meta removida." : `✓ Meta definida em ${formatBRL(valor)}`, "ok");
    carregarPrecos();
  };

  // Sprint 12: renomear e reclassificar direto em itens (RLS dono/admin,
  // mesmo caminho do Editar Meta)
  const salvarNome = async (itemId, nome) => {
    const sb = await getSupabase();
    const { error } = await sb.from("itens").update({ nome_na_loja: nome }).eq("id", itemId);
    if (error) { showToast("Erro ao renomear: " + error.message, "error"); return; }
    setAcoesItem(null);
    showToast(`✓ Produto renomeado para "${nome}".`, "ok");
    carregarPrecos();
  };

  const salvarCategoria = async (itemId, categoria) => {
    const sb = await getSupabase();
    // categoria → produtos.id (mesmo lookup do cadastro no NovoProduto)
    const { data: prods, error: e1 } = await sb
      .from("produtos").select("id").eq("categoria", categoria).limit(1);
    if (e1 || !prods?.length) {
      showToast(`Categoria "${categoria}" não encontrada no banco.`, "error");
      return;
    }
    const { error } = await sb.from("itens").update({ produto_id: prods[0].id }).eq("id", itemId);
    if (error) { showToast("Erro ao alterar categoria: " + error.message, "error"); return; }
    setAcoesItem(null);
    showToast(`✓ Categoria alterada para ${CAT_LABEL[categoria] || categoria}.`, "ok");
    carregarPrecos();
  };

  const iniciarColeta = async (escopo = {}) => {
    // Lista filtrada sem nenhum item monitorado: não dispara nada — um corpo
    // sem escopo viraria coleta COMPLETA no coletor, o oposto do filtro
    if (escopo.item_ids && escopo.item_ids.length === 0) {
      showToast("Nenhum item monitorado na lista filtrada — nada para coletar.", "error");
      return;
    }
    setColetando(true);
    const descricao = escopo.descricao || "todos os produtos";
    setProgresso({ visible: true, txt: "Conectando ao servidor...", pct: 15 });

    try {
      setProgresso({ visible: true, txt: "Disparando workflow...", pct: 40 });

      // Corpo do dispatch (mesma semântica do main.py): item_id → pontual;
      // item_ids → lista filtrada (Sprint 14); categoria/loja/user_id →
      // segmentada; vazio → completa
      const body = {};
      if (escopo.item_id) {
        body.item_id = escopo.item_id;
      } else if (escopo.item_ids) {
        body.item_ids = escopo.item_ids;
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

  const onColetarClick = () => {
    const esc = escopoColeta();
    const segmentada = esc.item_id || !!esc.item_ids;
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
  };

  // ── Ações disparadas pelo menu de Ações (ProductActionsDialog/ActionBar) ──
  const opcColetar = (item) => {
    setAcoesItem(null);
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
    setAcoesItem(null);
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
    setAcoesItem(null);
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
      <ProductHistoryDialog
        itemId={historicoItem?.id} nome={historicoItem?.nome}
        onClose={() => setHistoricoItem(null)}
        showToast={showToast} onChange={carregarPrecos}
      />
      <ProductActionsDialog
        item={acoesItem}
        onClose={() => setAcoesItem(null)}
        onSalvarMeta={salvarMeta}
        onSalvarNome={salvarNome}
        onSalvarCategoria={salvarCategoria}
        onColetar={opcColetar}
        onToggle={opcToggle}
      />

      <main className="dash-main">
      <div className="dash-grid">
      <div className="dash-content">
        {/* Tabela */}
        <section className="price-section">
          <div className="section-header">
            <div className="section-title">Monitor de Preços</div>
            <div className="section-line" />
          </div>

          <ControlBar
            dados={dados}
            isAdmin={isAdmin}
            user={user}
            coletando={coletando}
            onColetarClick={onColetarClick}
            filters={filters}
            selected={selecao.selected}
            onOpcoes={(item) => setAcoesItem(item)}
            onRemover={opcRemover}
          />

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

          <ProductTable
            dados={dados}
            dadosFiltrados={dadosFiltrados}
            termoBusca={filters.termoBusca}
            filtroDia={filtroDia}
            isAdmin={isAdmin}
            user={user}
            rotuloDono={filters.rotuloDono}
            selectedId={selecao.selectedId}
            onSelectRow={selecao.select}
          />
        </section>
      </div>

      <Sidebar
        dados={dados}
        selected={selecao.selected}
        onExpandChart={(item) => setHistoricoItem({ id: item.item_id, nome: item.nome_na_loja })}
        filtroDia={filtroDia}
        onSelectDia={setFiltroDia}
        onOpenDia={(dia) => setDiaDetalhe(dia)}
      />
      </div>
      </main>

      <CollectionDayDialog dia={diaDetalhe} onClose={() => setDiaDetalhe(null)} />

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
