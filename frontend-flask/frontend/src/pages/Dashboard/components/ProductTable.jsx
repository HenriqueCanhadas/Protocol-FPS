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
 *
 * Sprint 50/V5 (todo:256): cabeçalho de cada coluna (Produto/Loja/Categoria/
 * Preço atual/Status) fica clicável para ordenar — mesmo sortCampo/sortDir/
 * toggleSort já acionados pelo dropdown "Ordenar" da ControlBar (useDashboardFilters),
 * então os dois ficam sincronizados; mesmo padrão visual (▲/▼) já usado na
 * tabela "Detalhe por usuário e item" do Admin (Sprint 43). Abaixo de 700px
 * o <thead> já é escondido (Sprint 39, layout de cards) — cabeçalho clicável
 * é um recurso de desktop, o dropdown continua sendo o único caminho no celular.
 *
 * Sprint 74/V6 (todo:318): itens sem preço-meta ganham um marcador ◌ ao lado
 * do valor — neutro, na mesma linha (não é um estado de Status) e clicável,
 * abrindo o modal de meta já no modo de edição.
 */
import { dataBRT, dataHoraBRT } from "@/utils/datas";
import { formatBRL } from "@/utils/format";
import { statusItem, CAT_LABEL } from "@/pages/Dashboard/Dashboard.constants";

function ThOrdenavel({ campo, label, sortCampo, sortDir, toggleSort }) {
  return (
    <th className="sortable" onClick={() => toggleSort(campo)}>
      {label}{sortCampo === campo && <span className="sort-arrow">{sortDir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}

export default function ProductTable({
  dados, dadosFiltrados, termoBusca, filtroDia, isAdmin, user, rotuloDono,
  selectedId, onSelectRow, sortCampo, sortDir, toggleSort, onDefinirMeta,
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
            <col className="col-categoria" />
            <col className="col-preco" />
            <col className="col-status" />
          </colgroup>
          <thead>
            <tr>
              <ThOrdenavel campo="nome" label="Produto" sortCampo={sortCampo} sortDir={sortDir} toggleSort={toggleSort} />
              <ThOrdenavel campo="loja" label="Loja" sortCampo={sortCampo} sortDir={sortDir} toggleSort={toggleSort} />
              <ThOrdenavel campo="categoria" label="Categoria" sortCampo={sortCampo} sortDir={sortDir} toggleSort={toggleSort} />
              <ThOrdenavel campo="preco" label="Preço atual" sortCampo={sortCampo} sortDir={sortDir} toggleSort={toggleSort} />
              <ThOrdenavel campo="status" label="Status" sortCampo={sortCampo} sortDir={sortDir} toggleSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {dadosFiltrados.map((item) => {
              const monitorando  = item.monitorando !== false;
              const { classe: statusClass, texto: statusTxt } = statusItem(item);
              const precoFmt     = item.preco ? formatBRL(item.preco) : null;
              const selecionada  = item.item_id === selectedId;
              /* Sprint 74 (todo:318): marcador de item sem preço-meta — fica na
                 MESMA linha do valor (glifo, não uma tag em bloco abaixo dele:
                 isso devolvia à célula a altura que a Sprint 25/V4 tinha tirado,
                 e só em algumas linhas, deixando a tabela irregular). Neutro de
                 propósito — âmbar/verde/vermelho/azul são a escala de Status, e
                 "sem meta" é configuração ausente, não alerta. Clicar abre o
                 modal de meta já no modo de edição (stopPropagation: não deve
                 selecionar/deselecionar a linha por baixo). */
              const marcadorSemMeta = item.preco_meta ? null : (
                <button
                  type="button"
                  className="price-sem-meta"
                  aria-label={`Sem preço-meta — definir meta para ${item.nome_na_loja}`}
                  onClick={(e) => { e.stopPropagation(); onDefinirMeta?.(item); }}
                >
                  ◌
                </button>
              );
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
                    {isAdmin && item.dono_id && (
                      <div className="prod-cat">
                        <span className={`prod-dono${item.dono_id === user?.id ? " prod-dono-voce" : ""}`}>
                          ◈ {rotuloDono(item)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td><span className="loja-badge">{item.loja}</span></td>
                  <td className="td-categoria">{CAT_LABEL[item.categoria] || item.categoria}</td>
                  <td>
                    {/* Sprint 74 (todo:318): valor (ou "indisponível") e tooltip
                        passaram a dividir o MESMO .price-hover — antes o ramo sem
                        preço não tinha tooltip nenhum, e um item esgotado também
                        tem meta/★ menor/última coleta para mostrar */}
                    <div className="price-hover" tabIndex={0}>
                      {precoFmt
                        ? <div className="price-current">{precoFmt}{marcadorSemMeta}</div>
                        : <div className="price-unavailable">indisponível{marcadorSemMeta}</div>}
                      <div className="price-tooltip" onClick={(e) => e.stopPropagation()}>
                        {item.preco_meta ? (
                          <div>meta: {formatBRL(item.preco_meta)}</div>
                        ) : (
                          <div className="pt-sem-meta">◌ meta: não definida</div>
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
                    </div>
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
