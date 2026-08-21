/**
 * pages/Dashboard/components/CollectionsPanel.jsx — PROTOCOL FPS
 * Últimos 7 dias de coleta com contagem real de itens por dia (Sprint 21/V3).
 * Clicar num dia aplica o MESMO filtro de dia de coleta já usado na toolbar
 * (useDashboardFilters) — não é um filtro paralelo. "⤢" abre o detalhe do
 * dia (CollectionDayDialog).
 *
 * Escopo desta sprint: só a contagem por dia. O indicador "quantos itens
 * atualizaram de preço" (variação dia a dia) foi deixado de fora — o
 * plano (project/sprint_v3.md) já marcava isso como opcional, por exigir
 * uma comparação item a item entre dias consecutivos.
 */
import { useState, useEffect } from "react";
import { dataBRT } from "@/utils/datas";
import { buscarColetasPorDia } from "@/services/dashboard.service";

export default function CollectionsPanel({ filtroDia, onSelectDia, onOpenDia }) {
  const [dias, setDias] = useState(null);

  useEffect(() => {
    buscarColetasPorDia(7).then(setDias);
  }, []);

  const max = dias?.length ? Math.max(1, ...dias.map((d) => d.itens)) : 1;

  return (
    <div className="collections-panel">
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">▦ Últimos 7 dias</span>
      </div>
      {!dias ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <ul className="collections-list">
          {dias.map((d) => {
            const ativo = filtroDia === d.dia;
            return (
              <li key={d.dia} className={ativo ? "sel" : ""}>
                <button
                  className="collections-dia"
                  onClick={() => onSelectDia(ativo ? "" : d.dia)}
                  title="Filtrar a tabela por este dia"
                >
                  <span className="collections-data">{dataBRT(`${d.dia}T12:00:00-03:00`, { day: "2-digit", month: "2-digit" })}</span>
                  <span className="collections-bar-track">
                    <span className="collections-bar-fill" style={{ width: `${(d.itens / max) * 100}%` }} />
                  </span>
                  <span className="collections-count">{d.itens}</span>
                </button>
                <button className="collections-expand" title="Ver detalhe do dia" onClick={() => onOpenDia(d.dia)}>⤢</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
