/**
 * components/Ordenavel.jsx — PROTOCOL FPS
 *
 * Padrão único de "cabeçalho clicável + seta ▲/▼" do projeto (Sprint 73/V6).
 *
 * Por que existe: o mesmo padrão já tinha sido escrito DUAS vezes de forma
 * independente — `thOrdenavel` em `pages/Admin.jsx` (Sprint 43) e `ThOrdenavel`
 * em `pages/Dashboard/components/ProductTable.jsx` (Sprint 50) —, com as
 * classes `.sortable`/`.sort-arrow` duplicadas nos dois arquivos de CSS. A
 * Sprint 73 (todo:312) seria a terceira cópia; em vez disso o padrão virou este
 * módulo. Admin e Dashboard continuam com as versões locais deles (funcionam e
 * estão validadas); quem for mexer neles a seguir deve migrar para cá.
 *
 * `CabecalhoOrdenavel` aceita `as` porque nem toda lista do projeto é uma
 * <table>: a do CollectionDayDialog é um grid de <div>s, e converter a lista
 * inteira em tabela só para ganhar um <th> mudaria o layout responsivo que já
 * está validado.
 */
import { useState } from "react";

/**
 * Estado de ordenação: 1º clique num campo novo ordena asc; clicar de novo no
 * mesmo campo inverte a direção (mesmo comportamento do `toggleSort` de
 * useDashboardFilters, para o usuário não encontrar duas convenções).
 */
export function useOrdenacao(campoInicial, ascInicial = true) {
  const [ordem, setOrdem] = useState({ campo: campoInicial, asc: ascInicial });
  const alternar = (campo) =>
    setOrdem((o) => (o.campo === campo ? { campo, asc: !o.asc } : { campo, asc: true }));
  return { ordem, alternar };
}

/**
 * Ordena uma cópia da lista. `valor(item, campo)` devolve string (comparada em
 * pt-BR) ou número/null. Itens sem valor (`null`/`undefined`) vão SEMPRE para o
 * fim, nas duas direções — mesma regra dos preços ausentes na tabela principal:
 * "sem dado" não é o menor valor, é ausência de dado.
 */
export function ordenarPor(lista, campo, asc, valor) {
  return [...lista].sort((a, b) => {
    const va = valor(a, campo);
    const vb = valor(b, campo);
    const vazioA = va == null || va === "";
    const vazioB = vb == null || vb === "";
    if (vazioA && vazioB) return 0;
    if (vazioA) return 1;
    if (vazioB) return -1;
    if (typeof va === "string" || typeof vb === "string") {
      const cmp = String(va).localeCompare(String(vb), "pt-BR", { sensitivity: "base" });
      return asc ? cmp : -cmp;
    }
    return asc ? va - vb : vb - va;
  });
}

export function CabecalhoOrdenavel({ campo, label, ordem, alternar, as: Tag = "th", className = "" }) {
  const ativo = ordem.campo === campo;
  return (
    <Tag
      className={`sortable${className ? ` ${className}` : ""}`}
      onClick={() => alternar(campo)}
      title={`Ordenar por ${label}`}
    >
      {label}{ativo && <span className="sort-arrow">{ordem.asc ? "▲" : "▼"}</span>}
    </Tag>
  );
}
