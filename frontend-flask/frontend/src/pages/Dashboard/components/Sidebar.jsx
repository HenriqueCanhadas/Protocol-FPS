/**
 * pages/Dashboard/components/Sidebar.jsx — PROTOCOL FPS
 * Coluna lateral da Dashboard (Sprint 21/V3): gráfico do item selecionado,
 * últimos dias de coleta e detalhe/atividade.
 *
 * V4: ganhou o KpiRibbon (Itens monitorados/Abaixo da meta/Menor preço
 * hoje/Última coleta), que saiu da faixa full-width no topo da página e
 * virou mais um painel aqui, no mesmo estilo dos demais.
 */
import KpiRibbon from "./KpiRibbon";
import PriceChartPanel from "./PriceChartPanel";
import CollectionsPanel from "./CollectionsPanel";
import ItemDetailPanel from "./ItemDetailPanel";

export default function Sidebar({ dados, selected, onExpandChart, filtroDia, onSelectDia, onOpenDia }) {
  return (
    <aside className="dash-sidebar">
      <KpiRibbon dados={dados} />
      <PriceChartPanel item={selected} onExpand={onExpandChart} />
      <CollectionsPanel filtroDia={filtroDia} onSelectDia={onSelectDia} onOpenDia={onOpenDia} />
      <ItemDetailPanel item={selected} />
    </aside>
  );
}
