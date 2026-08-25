// pages/Dashboard/Dashboard.constants.js — PROTOCOL FPS
// Constantes compartilhadas entre os componentes/dialogs da Dashboard.

// Rótulos amigáveis para as siglas de categoria salvas em produtos.categoria
export const CAT_LABEL = {
  all:      "Todos",
  PSU:      "Fonte",
  MOBO:     "Placa Mãe",
  STORAGE:  "Armazenamento",
  DIVERSOS: "Diversos",
};

// Ordem fixa das categorias originais; categorias criadas depois (via "+ Nova
// categoria"/"Criar categoria" em Novo Produto, Sprints 31/33) entram na
// sequência ordenadas por nome — mesma convenção usada em NovoProduto.jsx.
const CATEGORIA_ORDEM_FIXA = ["GPU", "CPU", "RAM", "PSU", "MOBO", "STORAGE", "DIVERSOS"];

export function ordenarCategorias(lista) {
  return [...lista].sort((a, b) => {
    const ia = CATEGORIA_ORDEM_FIXA.indexOf(a.categoria);
    const ib = CATEGORIA_ORDEM_FIXA.indexOf(b.categoria);
    if (ia === -1 && ib === -1) return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// Rótulo de exibição de uma categoria: rótulo fixo conhecido > nome salvo no
// banco (produtos.nome, o que o admin digitou ao criá-la) > sigla crua.
export function rotuloCategoria(categoria, nome) {
  return CAT_LABEL[categoria] || nome || categoria;
}

// `slug` = chave do dict SCRAPERS no main.py (usado na coleta segmentada por loja)
export const LOJAS_FILTER = [
  { key: "all",          label: "Todas Lojas",  slug: null           },
  { key: "kabum",        label: "KaBuM",        slug: "kabum"        },
  { key: "terabyte",     label: "Terabyte",     slug: "terabyteshop" },
  { key: "pichau",       label: "Pichau",       slug: "pichau"       },
  { key: "tuyo",         label: "Tuyo",         slug: "tuyo"         },
  { key: "playstation",  label: "Playstation",  slug: "playstation"  },
  { key: "logitec",      label: "Logitec",      slug: "logitec"      },
  { key: "tangleteezer", label: "Tangle Teezer",slug: "tangleteezer" },
  { key: "amazon",       label: "Amazon",       slug: "amazon"       },
  { key: "shopee",       label: "Shopee",       slug: "shopee"       },
];

/**
 * Deriva o badge de status de um item (Sprint 41/V5, todo:204) — usado por
 * ProductTable e ItemDetailPanel, que antes duplicavam a mesma lógica com
 * só 3 estados (OFF/ESGOTADO/ALERTA/OK). Ganhou um 4º estado, NÃO LOCALIZADO
 * (item.encontrado === false): a última leitura não confirmou nada sobre o
 * produto (erro, timeout, challenge/bloqueio ou seletor ausente) — distinto
 * de um esgotamento real confirmado pelo scraper.
 */
export function statusItem(item) {
  const monitorando = item.monitorando !== false;
  if (!monitorando) return { classe: "off", texto: "OFF" };
  if (item.encontrado === false) return { classe: "notfound", texto: "NÃO LOCALIZADO" };
  if (!item.disponivel) return { classe: "out", texto: "ESGOTADO" };
  const abaixoDaMeta = item.preco_meta && item.preco && item.preco < item.preco_meta;
  if (abaixoDaMeta) return { classe: "alert", texto: "ALERTA" };
  return { classe: "ok", texto: "OK" };
}
