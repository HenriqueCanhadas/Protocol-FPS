/**
 * pages/Dashboard/components/KpiRibbon.jsx — PROTOCOL FPS
 * Painel da sidebar: Itens monitorados, Itens não monitorados, Loja mais
 * monitorada e Última coleta.
 *
 * Sprint 36 (todo:229): "Abaixo da meta" e "Menor preço hoje" saíram do
 * painel — o pedido do usuário nomeava só 3 dos 4 slots (Itens monitorados /
 * Itens não monitorados / Última coleta) e deixava o 4° livre; escolhido
 * "Loja mais monitorada" entre as opções levantadas no planejamento.
 *
 * Sprint 74 (todo:318): faixa "Itens sem meta" abaixo da grade 2×2 — é a
 * única forma de saber, sem rolar a tabela inteira, quantos itens ficaram sem
 * preço-alvo; clicar liga/desliga o filtro "sem meta" da lista. Entrou como
 * faixa de largura total, e não como 5º card, para não quebrar a grade 2×2.
 */
import { dataBRT, horaBRT } from "@/utils/datas";

export default function KpiRibbon({ dados, filtroMeta = "all", onAlternarSemMeta }) {
  const ativos      = dados.filter((d) => d.monitorando !== false);
  const pausados    = dados.filter((d) => d.monitorando === false);
  const ultColeta   = [...dados].filter((d) => d.coletado_em).sort((a, b) => new Date(b.coletado_em) - new Date(a.coletado_em))[0];

  const contagemPorLoja = ativos.reduce((acc, d) => {
    if (d.loja) acc[d.loja] = (acc[d.loja] || 0) + 1;
    return acc;
  }, {});
  const lojaTop = Object.entries(contagemPorLoja).sort((a, b) => b[1] - a[1])[0];

  // Conta sobre TODOS os itens (não só os ativos): é o mesmo conjunto que o
  // filtro "sem meta" recorta, então contador e lista nunca divergem.
  const semMeta   = dados.filter((d) => !d.preco_meta).length;
  const filtroOn  = filtroMeta === "sem";

  return (
    <div className="kpi-panel">
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">▦ Visão geral</span>
      </div>
      <div className="kpi-grid">
        <div className="kpi-cell">
          <div className="stat-label">Itens monitorados</div>
          <div className="stat-value">{ativos.length}</div>
          <div className="stat-sub">produtos ativos</div>
        </div>
        <div className="kpi-cell">
          <div className="stat-label">Itens não monitorados</div>
          <div className="stat-value red">{pausados.length}</div>
          <div className="stat-sub">produtos pausados</div>
        </div>
        <div className="kpi-cell">
          <div className="stat-label">Loja mais monitorada</div>
          <div className="stat-value">{lojaTop ? lojaTop[0] : "—"}</div>
          <div className="stat-sub">
            {lojaTop ? `${lojaTop[1]} item(ns) ativo(s)` : "nenhum item ativo"}
          </div>
        </div>
        <div className="kpi-cell">
          <div className="stat-label">Última coleta</div>
          {ultColeta ? (
            <>
              <div className="stat-value">
                {horaBRT(ultColeta.coletado_em, { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="stat-sub">
                {dataBRT(ultColeta.coletado_em)}
              </div>
            </>
          ) : <div className="stat-value">—</div>}
        </div>

        <button
          type="button"
          className={`kpi-cell kpi-sem-meta${filtroOn ? " on" : ""}`}
          disabled={semMeta === 0 && !filtroOn}
          onClick={onAlternarSemMeta}
          title={
            semMeta === 0
              ? "Todos os itens cadastrados têm preço-meta definido"
              : filtroOn
              ? "Filtro ativo — clique para voltar a ver a lista completa"
              : `Mostrar só os ${semMeta} item(ns) sem preço-meta definido`
          }
        >
          <div className="stat-label">◌ Itens sem meta</div>
          <div className="kpi-sem-meta-linha">
            <span className={`stat-value${semMeta > 0 ? " muted" : ""}`}>{semMeta}</span>
            <span className="stat-sub">
              {semMeta === 0
                ? "todos com preço-alvo"
                : filtroOn
                ? "filtro ativo · clique para limpar"
                : "clique para filtrar a lista"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
