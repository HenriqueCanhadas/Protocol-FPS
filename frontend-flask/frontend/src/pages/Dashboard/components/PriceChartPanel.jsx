/**
 * pages/Dashboard/components/PriceChartPanel.jsx — PROTOCOL FPS
 * Painel fixo da sidebar (Sprint 21/V3): gráfico de preço sempre visível do
 * item selecionado na tabela, sem precisar abrir o modal de histórico.
 * Reaproveita o GraficoHistorico (SVG) e a mesma busca paginada do
 * ProductHistoryDialog — não usa o StepChart do protótipo de referência,
 * para manter um único estilo de gráfico no app.
 */
import { useState, useEffect } from "react";
import GraficoHistorico from "./GraficoHistorico";
import { formatBRL } from "@/utils/format";
import { buscarHistoricoCompleto } from "@/services/dashboard.service";

export default function PriceChartPanel({ item, onExpand }) {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    if (!item) { setDados(null); return; }
    setDados(null);
    buscarHistoricoCompleto(item.item_id).then(setDados);
  }, [item?.item_id]);

  if (!item) {
    return (
      <div className="price-chart-panel">
        <div className="sidebar-panel-header">
          <span className="sidebar-panel-title">◈ Gráfico de preço</span>
        </div>
        <div className="sidebar-panel-empty">Selecione um item na tabela</div>
      </div>
    );
  }

  const precos = (dados || []).filter((d) => d.preco).map((d) => d.preco);
  const minPreco = precos.length ? Math.min(...precos) : null;

  return (
    <div className="price-chart-panel">
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">◈ {item.nome_na_loja}</span>
        <button className="sidebar-panel-expand" onClick={() => onExpand(item)}>EXPANDIR ⤢</button>
      </div>
      {!dados ? (
        <div className="loading"><div className="spinner" /></div>
      ) : dados.length < 2 ? (
        <div className="sidebar-panel-empty">Histórico insuficiente para o gráfico</div>
      ) : (
        <>
          <div className="sidebar-panel-meta">
            <span>★ menor: <span className="amber">{formatBRL(minPreco)}</span></span>
            <span className="dim">{dados.length} leitura(s)</span>
          </div>
          <GraficoHistorico dados={dados} onPontoClick={() => onExpand(item)} dica={false} />
        </>
      )}
    </div>
  );
}
