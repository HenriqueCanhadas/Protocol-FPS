/**
 * pages/Dashboard/dialogs/FiltersDialog.jsx — PROTOCOL FPS
 * Pop-up dos filtros da tabela (Sprint 70/V6, todo:306) — Categoria, Loja,
 * Produto da loja e Usuário (admin) saíram da linha de filtros e passaram a
 * morar aqui, atrás de um botão só. Mesma família visual do SearchDialog
 * (TerminalModal + .meta-modal), que já tinha feito o mesmo com a busca na
 * Sprint 24.
 *
 * Não guarda estado próprio: escreve direto no useDashboardFilters, então cada
 * troca já recorta a tabela atrás do modal (mesmo comportamento dos selects
 * antigos, que aplicavam na hora — não há "aplicar").
 */
import TerminalModal from "@/components/TerminalModal";
import { rotuloCategoria, LOJAS_FILTER } from "@/pages/Dashboard/Dashboard.constants";

export default function FiltersDialog({
  open, onClose, dados, categorias, isAdmin, user, filters, totalVisivel, onAbrirTodos,
}) {
  const {
    filtro, setFiltro,
    filtroLoja, selecionarLoja,
    filtroProduto, setFiltroProduto,
    filtroUsuario, setFiltroUsuario,
    filtroMeta, setFiltroMeta,
    produtosDaLoja, lojaAtiva, donos,
    filtrosAtivos, limparFiltros,
  } = filters;

  const semMeta = dados.filter((x) => !x.preco_meta).length;

  if (!open) return null;

  return (
    <TerminalModal open onClose={onClose} overlayClassName="meta-modal-overlay" className="meta-modal filtros-modal" data-label="FILTROS">
      <div className="meta-modal-header">
        <div className="meta-modal-produto">
          <div className="mm-label">Recorte da tabela</div>
          <div>
            <span className="green">{totalVisivel}</span> de {dados.length} item(ns) visível(is)
          </div>
        </div>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="meta-modal-body filtros-grid">
        <div className="filtro-campo">
          <div className="field-label">Categoria</div>
          <select
            className={`filter-select${filtro !== "all" ? " active" : ""}`}
            value={filtro} onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="all">Todos</option>
            {categorias.map((c) => (
              <option key={c.categoria} value={c.categoria}>{rotuloCategoria(c.categoria, c.nome)}</option>
            ))}
          </select>
        </div>

        <div className="filtro-campo">
          <div className="field-label">Loja</div>
          <select
            className={`filter-select${filtroLoja !== "all" ? " active" : ""}`}
            value={filtroLoja} onChange={(e) => selecionarLoja(e.target.value)}
          >
            {LOJAS_FILTER.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Produto é sub-filtro da loja (trocar de loja zera ele, ver
            selecionarLoja) — por isso veio junto para o pop-up: deixá-lo
            sozinho na barra, dependendo de uma loja escolhida aqui dentro,
            seria o único filtro sem o seu contexto por perto */}
        {filtroLoja !== "all" && (
          <div className="filtro-campo">
            <div className="field-label">Produto da loja</div>
            <select
              className={`filter-select${filtroProduto !== "all" ? " active" : ""}`}
              value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)}
            >
              <option value="all">Todos · {lojaAtiva?.label}</option>
              {produtosDaLoja.map((p) => (
                <option key={p.item_id} value={p.item_id}>{p.nome_na_loja}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sprint 74 (todo:318): recorte por preço-meta. É o par "de lista" do
            marcador ◌ da tabela e do card "Itens sem meta" do KpiRibbon (que
            liga/desliga a opção "sem" daqui) — marcar item a item mostra quem
            está sem meta, este filtro é o que permite resolver todos de uma vez */}
        <div className="filtro-campo">
          <div className="field-label">Meta de preço</div>
          <select
            className={`filter-select${filtroMeta !== "all" ? " active" : ""}`}
            value={filtroMeta} onChange={(e) => setFiltroMeta(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="sem">Sem meta definida ({semMeta})</option>
            <option value="com">Com meta definida ({dados.length - semMeta})</option>
          </select>
        </div>

        {isAdmin && donos.length > 0 && (
          <div className="filtro-campo">
            <div className="field-label">Usuário</div>
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
      </div>

      {/* Sprint 72 (todo:316): mesma ação do botão "Abrir todos" da barra —
          chama a MESMA função do Dashboard (onAbrirTodos), para os dois pontos
          de entrada não poderem divergir no limite/confirmação/aviso */}
      <div className="filtros-abrir-todos">
        <button
          className="action-btn abrir-todos"
          disabled={totalVisivel === 0}
          onClick={() => { onClose(); onAbrirTodos(); }}
          title={`Abrir os ${totalVisivel} item(ns) desta lista em novas abas`}
        >
          <span className="ab-icon">⧉</span>
          <span className="ab-label">Abrir todos os itens ({totalVisivel})</span>
        </button>
      </div>

      <div className="meta-modal-footer">
        <button
          className="btn-secondary btn-limpar-filtros"
          disabled={filtrosAtivos === 0}
          title="Limpa todos os filtros, inclusive a busca e o dia de coleta"
          onClick={() => { limparFiltros(); onClose(); }}
        >
          REMOVER FILTROS
        </button>
        <button className="btn-primary" onClick={onClose}>FECHAR</button>
      </div>
    </TerminalModal>
  );
}
