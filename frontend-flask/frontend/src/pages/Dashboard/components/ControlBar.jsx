/**
 * pages/Dashboard/components/ControlBar.jsx — PROTOCOL FPS
 * Toolbar da Dashboard: um painel único e compacto que reúne o botão de
 * coleta, os filtros (busca, categoria, loja/produto, usuário admin,
 * ordenação, dia de coleta) e as ações sobre o item selecionado na tabela
 * (Opções/Remover — Sprint V4: a antiga ActionBar separada foi absorvida
 * aqui; o botão de Histórico saiu, pois o PriceChartPanel da sidebar já
 * cobre essa função). A busca é só um ícone que abre o SearchDialog em
 * pop-up (Sprint 24/V4 — antes abria um campo de texto inline na própria
 * linha de filtros); o termo continua salvo entre sessões (ver
 * useDashboardFilters). Recebe o retorno de useDashboardFilters em `filters`.
 */
import { useState } from "react";
import { FILTROS_CAT, CAT_LABEL, LOJAS_FILTER } from "@/pages/Dashboard/Dashboard.constants";
import SearchDialog from "@/pages/Dashboard/dialogs/SearchDialog";

const CRITERIOS_ORDENACAO = [
  ["nome",  "Nome"],
  ["preco", "Preço Atual"],
  ["menor", "Menor Preço"],
  ["meta",  "Meta"],
  ["data",  "Coleta"],
];

export default function ControlBar({
  dados, isAdmin, user, coletando, onColetarClick, filters,
  selected, onOpcoes, onRemover,
}) {
  const [buscaAberta, setBuscaAberta] = useState(false); // controla o pop-up SearchDialog
  const {
    termoBusca, setTermoBusca,
    sortCampo, sortDir, toggleSort,
    filtro, setFiltro,
    filtroLoja, selecionarLoja,
    filtroProduto, setFiltroProduto,
    filtroUsuario, setFiltroUsuario,
    filtroDia, setFiltroDia,
    dadosFiltrados,
    produtosDaLoja,
    lojaAtiva,
    donos,
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

        <div className="filter-group">
          <label className="filter-group-label">Categoria</label>
          <select
            className={`filter-select${filtro !== "all" ? " active" : ""}`}
            value={filtro} onChange={(e) => setFiltro(e.target.value)}
          >
            {FILTROS_CAT.map((f) => (
              <option key={f} value={f}>{CAT_LABEL[f] || f}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-group-label">Loja</label>
          <select
            className={`filter-select${filtroLoja !== "all" ? " active" : ""}`}
            value={filtroLoja} onChange={(e) => selecionarLoja(e.target.value)}
          >
            {LOJAS_FILTER.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {filtroLoja !== "all" && (
          <div className="filter-group">
            <label className="filter-group-label">Produto</label>
            <select
              className={`filter-select${filtroProduto !== "all" ? " active" : ""}`}
              value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)}
              title={`Filtrar por um produto da ${lojaAtiva?.label}`}
            >
              <option value="all">Todos · {lojaAtiva?.label}</option>
              {produtosDaLoja.map((p) => (
                <option key={p.item_id} value={p.item_id}>{p.nome_na_loja}</option>
              ))}
            </select>
          </div>
        )}

        {isAdmin && donos.length > 0 && (
          <div className="filter-group">
            <label className="filter-group-label">Usuário</label>
            <select
              className={`filter-select${filtroUsuario !== "all" ? " active" : ""}`}
              value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}
            >
              <option value="all">Todos ({dados.length})</option>
              <option value={user?.id}>Eu ({dados.filter((x) => x.dono_id === user?.id).length})</option>
              {donos.filter((d) => d.id !== user?.id).map((d) => (
                <option key={d.id} value={d.id}>{d.rotulo} ({dados.filter((x) => x.dono_id === d.id).length})</option>
              ))}
            </select>
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
    </div>
  );
}
