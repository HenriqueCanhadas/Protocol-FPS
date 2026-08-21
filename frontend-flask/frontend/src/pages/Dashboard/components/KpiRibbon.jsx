/**
 * pages/Dashboard/components/KpiRibbon.jsx — PROTOCOL FPS
 * Painel da sidebar (V4: era a faixa full-width no topo da página, virou mais
 * um painel ao lado do gráfico/detalhe do item): Itens monitorados, Abaixo da
 * meta, Menor preço hoje e Última coleta. Mesmas fórmulas de sempre.
 */
import { dataBRT, horaBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";

export default function KpiRibbon({ dados }) {
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
          <div className="stat-label">Abaixo da meta</div>
          <div className="stat-value amber">{abaixoMeta.length}</div>
          <div className="stat-sub">
            {comMeta.length
              ? `de ${comMeta.length} com meta definida`
              : "nenhum item com meta"}
          </div>
        </div>
        <div className="kpi-cell">
          <div className="stat-label">Menor preço hoje</div>
          <div className="stat-value">
            {menor ? formatBRL(menor.preco) : "—"}
          </div>
          <div className="stat-sub">{menor?.nome_na_loja || "—"}</div>
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
      </div>
    </div>
  );
}
