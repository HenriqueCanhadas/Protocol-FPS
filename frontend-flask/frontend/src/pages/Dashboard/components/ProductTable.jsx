/**
 * pages/Dashboard/components/ProductTable.jsx — PROTOCOL FPS
 * Tabela de produtos monitorados: nome/link/categoria/dono, loja, preço e
 * status. Linha clicável — seleciona o item para as ações da ControlBar
 * (Sprint 19/V3; clicar de novo na linha já selecionada deseleciona,
 * Sprint 25/V4 — ver useProductSelection).
 *
 * Sprint 25/V4: a célula de preço mostra só o valor atual; meta, ★ menor
 * preço histórico e data/hora da última coleta saíram do corpo da célula
 * (que ficava com até 4 linhas) e passaram a um tooltip só ao passar o
 * mouse — linhas mais baixas, mesma informação disponível.
 *
 * Sprint 27/V4 (todo:206): passar o mouse sobre o nome do produto mostra
 * a URL completa de origem num tooltip (mesma linguagem visual do
 * .price-tooltip da Sprint 25) — o nome em si já é um link (item.url).
 */
import { dataBRT, dataHoraBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";

export default function ProductTable({
  dados, dadosFiltrados, termoBusca, filtroDia, isAdmin, user, rotuloDono,
  selectedId, onSelectRow,
}) {
  return (
    <div className="price-table-wrap">
      {dados.length === 0 ? (
        <div className="loading"><div className="spinner" /> CARREGANDO DADOS...</div>
      ) : dadosFiltrados.length === 0 ? (
        <div className="empty">
          {termoBusca
            ? <>Nenhum resultado para "<span className="green">{termoBusca}</span>".</>
            : filtroDia
            ? <>Nenhum item com coleta em <span className="green">{dataBRT(`${filtroDia}T12:00:00-03:00`)}</span>.</>
            : <>Nenhum item nesta categoria.<br /><a href="/novo-produto" style={{ color: "var(--green)", fontSize: "var(--fs-sm)" }}>+ Adicionar produto</a></>}
        </div>
      ) : (
        <table>
          <colgroup>
            <col className="col-produto" />
            <col className="col-loja" />
            <col className="col-preco" />
            <col className="col-status" />
          </colgroup>
          <thead>
            <tr>
              <th>Produto</th><th>Loja</th><th>Preço atual</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dadosFiltrados.map((item) => {
              const monitorando  = item.monitorando !== false;
              const abaixoDaMeta = monitorando && item.preco_meta && item.preco && item.preco < item.preco_meta;
              const statusClass  = !monitorando ? "off" : !item.disponivel ? "out" : abaixoDaMeta ? "alert" : "ok";
              const statusTxt    = !monitorando ? "OFF" : !item.disponivel ? "ESGOTADO" : abaixoDaMeta ? "ALERTA" : "OK";
              const precoFmt     = item.preco ? formatBRL(item.preco) : null;
              const selecionada  = item.item_id === selectedId;
              return (
                <tr
                  key={item.item_id}
                  className={`${!monitorando ? "row-off" : ""}${selecionada ? " row-selected" : ""}`}
                  onClick={() => onSelectRow(item.item_id)}
                >
                  <td className="td-produto">
                    <div className="prod-nome">
                      {item.url
                        ? <div className="prod-nome-hover">
                            <a className="prod-nome-link" href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{item.nome_na_loja}</a>
                            <div className="prod-nome-tooltip" onClick={(e) => e.stopPropagation()}>{item.url}</div>
                          </div>
                        : item.nome_na_loja}
                    </div>
                    <div className="prod-cat">
                      {item.categoria}
                      {isAdmin && item.dono_id && (
                        <span className={`prod-dono${item.dono_id === user?.id ? " prod-dono-voce" : ""}`}>
                          ◈ {rotuloDono(item)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td><span className="loja-badge">{item.loja}</span></td>
                  <td>
                    {precoFmt
                      ? <div className="price-hover" tabIndex={0}>
                          <div className="price-current">{precoFmt}</div>
                          {(item.preco_meta || item.menor != null || item.coletado_em) && (
                            <div className="price-tooltip" onClick={(e) => e.stopPropagation()}>
                              {item.preco_meta && (
                                <div>meta: {formatBRL(item.preco_meta)}</div>
                              )}
                              {item.menor != null && (
                                <div className="pt-menor">
                                  ★ menor: {formatBRL(item.menor)}
                                  {item.menor_em && ` · ${dataHoraBRT(item.menor_em, { day: "2-digit", month: "2-digit", year: "numeric" })}`}
                                </div>
                              )}
                              {item.coletado_em && (
                                <div>
                                  coleta: {dataHoraBRT(item.coletado_em, {
                                    day:    "2-digit",
                                    month:  "2-digit",
                                    year:   "numeric",
                                    hour:   "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      : <div className="price-unavailable">indisponível</div>}
                  </td>
                  <td><span className={`status-badge ${statusClass}`}>{statusTxt}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
