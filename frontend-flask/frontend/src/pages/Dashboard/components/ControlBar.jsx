/**
 * pages/Dashboard/components/ControlBar.jsx — PROTOCOL FPS
 * Toolbar da Dashboard: um painel único e compacto que reúne o botão de
 * coleta, os filtros (busca e o pop-up de filtros — categoria, loja/produto e
 * usuário admin —, ordenação, dia de coleta) e as ações sobre o item selecionado
 * (Opções/Remover — Sprint V4: a antiga ActionBar separada foi absorvida
 * aqui; o botão de Histórico saiu, pois o PriceChartPanel da sidebar já
 * cobre essa função). A busca é só um ícone que abre o SearchDialog em
 * pop-up (Sprint 24/V4 — antes abria um campo de texto inline na própria
 * linha de filtros); o termo continua salvo entre sessões (ver
 * useDashboardFilters). Recebe o retorno de useDashboardFilters em `filters`.
 */
import { useState } from "react";
import SearchDialog from "@/pages/Dashboard/dialogs/SearchDialog";
import FiltersDialog from "@/pages/Dashboard/dialogs/FiltersDialog";

// Sprint 50 (todo:256): ganhou loja/categoria/status — mesmos critérios que
// o clique no cabeçalho da coluna da tabela agora também aciona (ver
// ProductTable/toggleSort) — dropdown e cabeçalho ficam sincronizados por
// compartilharem o mesmo sortCampo/sortDir de useDashboardFilters.
const CRITERIOS_ORDENACAO = [
  ["nome",      "Nome"],
  ["loja",      "Loja"],
  ["categoria", "Categoria"],
  ["preco",     "Preço Atual"],
  ["menor",     "Menor Preço"],
  ["meta",      "Meta"],
  ["status",    "Status"],
  ["data",      "Coleta"],
];

export default function ControlBar({
  dados, categorias, isAdmin, user, coletando, onColetarClick, filters,
  selected, onOpcoes, onRemover, onAbrirTodos,
}) {
  const [buscaAberta, setBuscaAberta]     = useState(false); // controla o pop-up SearchDialog
  const [filtrosAberto, setFiltrosAberto] = useState(false); // controla o pop-up FiltersDialog (Sprint 70)
  const {
    termoBusca, setTermoBusca,
    sortCampo, sortDir, toggleSort,
    filtroDia, setFiltroDia,
    filtrosPopup, filtrosAtivos, limparFiltros,
    dadosFiltrados,
  } = filters;

  return (
    <div className="toolbar">
      {/* Painel único: coleta + filtros (Busca/Categoria/Loja/Produto/Usuário |
          Ordenar/Dia) + ações sobre o item selecionado (Opções/Remover) */}
      <div className="filters-row">
        <button className="btn-coletar" disabled={coletando} onClick={onColetarClick}>
          <span>⚡</span>
          <span>{coletando ? "DISPARANDO..." : "COLETAR"}</span>
        </button>

        <div className="filter-sep" />

        <div className="filter-group">
          <label className="filter-group-label">Buscar</label>
          <button
            className={`search-icon-btn${termoBusca ? " active" : ""}`}
            title={termoBusca ? `Busca ativa: "${termoBusca}" — clique para editar` : "Buscar por produto ou loja"}
            onClick={() => setBuscaAberta(true)}
          >
            ⌕
          </button>
        </div>

        {/* Sprint 70 (todo:306): Categoria/Loja/Produto/Usuário viraram um
            pop-up só (FiltersDialog). O botão fica verde — e mostra quantos —
            quando há filtro aplicado; o "REMOVER FILTROS" só existe enquanto
            houver o que remover, e limpa TUDO (busca e dia inclusive). */}
        <div className="filter-group">
          <label className="filter-group-label">Filtros</label>
          <button
            className={`filtros-btn${filtrosPopup > 0 ? " active" : ""}`}
            title={filtrosPopup > 0 ? `${filtrosPopup} filtro(s) aplicado(s) — clique para editar` : "Filtrar por categoria, loja ou usuário"}
            onClick={() => setFiltrosAberto(true)}
          >
            <span className="fb-icon">▽</span>
            <span className="fb-label">Filtros</span>
            {filtrosPopup > 0 && <span className="fb-badge">{filtrosPopup}</span>}
          </button>
        </div>

        {filtrosAtivos > 0 && (
          <div className="filter-group">
            <label className="filter-group-label">&nbsp;</label>
            <button
              className="limpar-filtros-btn"
              title="Remover todos os filtros, inclusive a busca e o dia de coleta"
              onClick={limparFiltros}
            >
              <span className="fb-icon">✕</span>
              <span className="fb-label">Remover filtros</span>
            </button>
          </div>
        )}

        <div className="filter-sep" />

        <div className="filter-group">
          <label className="filter-group-label">Ordenar</label>
          <div className="sort-compact">
            <select className="filter-select" value={sortCampo} onChange={(e) => toggleSort(e.target.value)}>
              {CRITERIOS_ORDENACAO.map(([campo, label]) => (
                <option key={campo} value={campo}>{label}</option>
              ))}
            </select>
            <button
              className="sort-dir-btn"
              title={sortDir === "asc" ? "Ordem crescente — clique para inverter" : "Ordem decrescente — clique para inverter"}
              onClick={() => toggleSort(sortCampo)}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-group-label">Dia</label>
          {/* Sprint 14: só itens que tiveram coleta neste dia (BRT); combina
              com busca/categoria/loja/usuário e qualquer ordenação */}
          <div className="dia-coleta-wrap" title="Mostrar só itens que tiveram coleta neste dia (horário de Brasília)">
            <input
              className={`dia-coleta-input${filtroDia ? " on" : ""}`}
              type="date"
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch { /* precisa de gesto do usuário */ } }}
            />
            {filtroDia && (
              <button className="dia-coleta-clear" title="Limpar o dia de coleta" onClick={() => setFiltroDia("")}>✕</button>
            )}
          </div>
        </div>

        {/* Sprint 24/V4: nome do item selecionado saiu daqui — já aparece no
            destaque da linha selecionada e no ▤ Detalhe do item da sidebar */}
        <div className="filter-group filter-actions-group">
          <label className="filter-group-label">Ações</label>
          <div className="filter-actions">
            {/* Sprint 72 (todo:298): age sobre a LISTA visível (não sobre o
                item selecionado), por isso não depende de `selected` */}
            <button
              className="action-btn abrir-todos"
              disabled={dadosFiltrados.length === 0}
              onClick={onAbrirTodos}
              title={`Abrir os ${dadosFiltrados.length} item(ns) da lista filtrada em novas abas`}
            >
              <span className="ab-icon">⧉</span><span className="ab-label">Abrir todos</span>
            </button>
            <button
              className="action-btn opcoes-trigger" disabled={!selected}
              onClick={() => selected && onOpcoes(selected)}
              title={selected ? `Opções — ${selected.nome_na_loja}` : "Selecione um item da tabela"}
            >
              <span className="ab-icon">⋯</span><span className="ab-label">Opções</span>
            </button>
            <button
              className="action-btn remove" disabled={!selected}
              onClick={() => selected && onRemover(selected)}
              title={selected ? `Remover — ${selected.nome_na_loja}` : "Selecione um item da tabela"}
            >
              <span className="ab-icon">✕</span><span className="ab-label">Remover</span>
            </button>
          </div>
        </div>
      </div>

      <SearchDialog
        open={buscaAberta}
        termoBusca={termoBusca}
        onChange={setTermoBusca}
        onClose={() => setBuscaAberta(false)}
      />

      <FiltersDialog
        open={filtrosAberto}
        onClose={() => setFiltrosAberto(false)}
        dados={dados}
        categorias={categorias}
        isAdmin={isAdmin}
        user={user}
        filters={filters}
        totalVisivel={dadosFiltrados.length}
        onAbrirTodos={onAbrirTodos}
      />
    </div>
  );
}
