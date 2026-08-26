/**
 * pages/Dashboard/dialogs/CollectionDayDialog.jsx — PROTOCOL FPS
 * Detalhe de um dia de coleta específico: todas as leituras daquele dia com
 * a variação % vs. a leitura anterior de cada item (Sprint 21/V3) — lógica
 * nova, o filtro de dia atual só recortava a tabela, não calculava variação.
 */
import { useState, useEffect } from "react";
import TerminalModal from "@/components/TerminalModal";
import { horaBRT, dataBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";
import { buscarDetalheDia } from "@/services/dashboard.service";

export default function CollectionDayDialog({ dia, onClose }) {
  const [itens, setItens] = useState(null);

  useEffect(() => {
    if (!dia) return;
    setItens(null);
    buscarDetalheDia(dia).then(setItens);
  }, [dia]);

  if (!dia) return null;

  return (
    <TerminalModal open onClose={onClose} overlayClassName="modal-overlay" className="modal">
      <div className="modal-header">
        <div className="modal-title">COLETAS — {dataBRT(`${dia}T12:00:00-03:00`)}</div>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        {!itens ? (
          <div className="loading"><div className="spinner" /></div>
        ) : itens.length === 0 ? (
          <div className="empty">Nenhuma leitura neste dia.</div>
        ) : (
          <div className="dia-detalhe-list">
            {itens.map((it) => (
              <div key={it.id} className="dia-detalhe-row">
                <div className="dia-detalhe-hora dim">{horaBRT(it.coletadoEm, { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="dia-detalhe-nome">
                  {it.nome}
                  <span className="loja-badge" style={{ marginLeft: ".6rem" }}>{it.loja}</span>
                </div>
                <div className="dia-detalhe-preco">{it.preco ? formatBRL(it.preco) : it.encontrado === false ? "não localizado" : "esgotado"}</div>
                <div className={`dia-detalhe-var${it.variacao == null || it.variacao === 0 ? " dim" : it.variacao < 0 ? " green" : " red"}`}>
                  {it.variacao == null ? "—" : `${it.variacao > 0 ? "+" : ""}${it.variacao.toFixed(1)}%`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TerminalModal>
  );
}
