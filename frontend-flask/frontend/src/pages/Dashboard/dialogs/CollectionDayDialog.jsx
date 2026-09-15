/**
 * pages/Dashboard/dialogs/CollectionDayDialog.jsx — PROTOCOL FPS
 * Detalhe de um dia de coleta específico: todas as leituras daquele dia com
 * a variação % vs. a leitura anterior de cada item (Sprint 21/V3) — lógica
 * nova, o filtro de dia atual só recortava a tabela, não calculava variação.
 */
import { useState, useEffect, useMemo } from "react";
import TerminalModal from "@/components/TerminalModal";
import { horaBRT, dataBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";
import { buscarDetalheDia } from "@/services/dashboard.service";
import { useOrdenacao, ordenarPor, CabecalhoOrdenavel } from "@/components/Ordenavel";

// Sprint 73 (todo:312): valor de cada critério de ordenação. `preco` e
// `variacao` podem ser null (leitura "esgotado"/"não localizado", e o 1º
// registro de um item, que não tem leitura anterior para comparar) — o
// ordenarPor manda esses para o fim nas duas direções.
const VALOR_ORDEM = (item, campo) => {
  if (campo === "hora")  return item.coletadoEm ? new Date(item.coletadoEm).getTime() : null;
  if (campo === "preco") return item.preco ?? null;
  if (campo === "var")   return item.variacao ?? null;
  return item.nome || "";
};

export default function CollectionDayDialog({ dia, onClose }) {
  const [itens, setItens] = useState(null);
  // Começa por horário decrescente: é a ordem em que buscarDetalheDia já
  // devolve (coletado_em desc), então abrir o pop-up não reembaralha nada.
  const { ordem, alternar } = useOrdenacao("hora", false);

  useEffect(() => {
    if (!dia) return;
    setItens(null);
    buscarDetalheDia(dia).then(setItens);
  }, [dia]);

  // Só reordena o array já carregado — nenhuma consulta nova ao Supabase
  const itensOrdenados = useMemo(
    () => (itens ? ordenarPor(itens, ordem.campo, ordem.asc, VALOR_ORDEM) : null),
    [itens, ordem.campo, ordem.asc],
  );

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
            {/* Cabeçalho criado nesta sprint: a lista não tinha nenhum, então
                não havia onde clicar. Mesmas 4 colunas do grid das linhas. */}
            <div className="dia-detalhe-row dia-detalhe-head">
              <CabecalhoOrdenavel as="div" campo="hora"  label="Hora"    ordem={ordem} alternar={alternar} />
              <CabecalhoOrdenavel as="div" campo="nome"  label="Produto" ordem={ordem} alternar={alternar} />
              <CabecalhoOrdenavel as="div" campo="preco" label="Preço"   ordem={ordem} alternar={alternar} className="col-dir" />
              <CabecalhoOrdenavel as="div" campo="var"   label="Var. %"  ordem={ordem} alternar={alternar} className="col-dir" />
            </div>
            {itensOrdenados.map((it) => (
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
