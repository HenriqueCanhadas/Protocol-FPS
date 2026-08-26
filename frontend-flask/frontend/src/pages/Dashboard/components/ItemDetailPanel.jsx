/**
 * pages/Dashboard/components/ItemDetailPanel.jsx — PROTOCOL FPS
 * Painel da sidebar (Sprint 21/V3): resumo tabular do item selecionado +
 * feed de atividade recente REAL (últimas leituras do sistema).
 *
 * O protótipo de referência tem um "log de scraping ao vivo" 100% mockado
 * (timestamps fixos, sem endpoint/tabela real). Decisão validada com o
 * usuário: substituir por um feed genuíno — as últimas leituras já
 * registradas em historico_precos — em vez de inventar dado ou remover a
 * seção inteira.
 */
import { useState, useEffect } from "react";
import { formatBRL } from "@/utils/format";
import { horaBRT, dataHoraBRT } from "@/utils/datas";
import { buscarAtividadeRecente } from "@/services/dashboard.service";
import { statusItem } from "@/pages/Dashboard/Dashboard.constants";

const ATUALIZA_MS = 60000; // acompanha o ritmo de "algo vivo" sem exagerar em queries

export default function ItemDetailPanel({ item }) {
  const [atividade, setAtividade] = useState(null);

  useEffect(() => {
    let ativo = true;
    const carregar = () => buscarAtividadeRecente().then((d) => { if (ativo) setAtividade(d); });
    carregar();
    const id = setInterval(carregar, ATUALIZA_MS);
    return () => { ativo = false; clearInterval(id); };
  }, []);

  const { classe: statusClass, texto: statusTxt } = item ? statusItem(item) : { classe: "", texto: "" };
  const deltaMeta = item?.preco && item?.preco_meta ? ((item.preco - item.preco_meta) / item.preco_meta) * 100 : null;

  return (
    <div className="item-detail-panel">
      <div className="sidebar-panel-header">
        <span className="sidebar-panel-title">▤ Detalhe do item</span>
      </div>

      {!item ? (
        <div className="sidebar-panel-empty">Selecione um item para ver o detalhe</div>
      ) : (
        <dl className="item-detail-kv">
          <div><dt>Produto</dt><dd>{item.nome_na_loja}</dd></div>
          <div><dt>Loja</dt><dd>{item.loja}</dd></div>
          <div><dt>Categoria</dt><dd>{item.categoria}</dd></div>
          <div><dt>Preço atual</dt><dd>{item.preco ? formatBRL(item.preco) : "indisponível"}</dd></div>
          <div>
            <dt>Meta</dt>
            <dd>
              {item.preco_meta ? formatBRL(item.preco_meta) : "—"}
              {deltaMeta != null && (
                <span className={deltaMeta <= 0 ? " green" : " amber"}> ({deltaMeta > 0 ? "+" : ""}{deltaMeta.toFixed(1)}%)</span>
              )}
            </dd>
          </div>
          <div><dt>Status</dt><dd><span className={`status-badge ${statusClass}`}>{statusTxt}</span></dd></div>
          <div><dt>★ Menor já visto</dt><dd>{item.menor != null ? formatBRL(item.menor) : "—"}</dd></div>
          <div>
            <dt>Última coleta</dt>
            <dd>{item.coletado_em ? dataHoraBRT(item.coletado_em, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</dd>
          </div>
        </dl>
      )}

      <div className="item-detail-atividade">
        <div className="item-detail-atividade-title">Atividade recente</div>
        {!atividade ? (
          <div className="loading"><div className="spinner" /></div>
        ) : atividade.length === 0 ? (
          <div className="sidebar-panel-empty">Sem leituras registradas</div>
        ) : (
          <ul className="atividade-list">
            {atividade.map((a) => (
              <li key={a.id}>
                <span className="atividade-hora dim">{horaBRT(a.coletado_em, { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="atividade-nome">{a.itens?.nome_na_loja || "—"}</span>
                <span className={a.preco ? "green" : "red"}>{a.preco ? formatBRL(a.preco) : a.encontrado === false ? "não localizado" : "esgotado"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
