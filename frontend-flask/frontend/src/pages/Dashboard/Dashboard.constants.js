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

// Comparador único de rótulos do projeto (Sprint 71, todo:314): pt-BR com
// sensitivity "base" — acento e caixa não mudam a posição, então "AliExpress"
// e "Amazon" ordenam por a/m, não por A maiúsculo vs. minúsculo.
export const compararRotulos = (a, b) =>
  (a || "").localeCompare(b || "", "pt-BR", { sensitivity: "base" });

/**
 * Sprint 71 (todo:314): a ordem das categorias era FIXA POR HISTÓRICO — um
 * array `["GPU","CPU","RAM","PSU","MOBO","STORAGE","DIVERSOS"]` na ordem em que
 * as categorias originais foram criadas, e toda categoria nova (criada por um
 * admin em Novo Produto, Sprints 31/33) ia para o fim da lista. Agora é
 * alfabética pelo RÓTULO EXIBIDO, não pela sigla: ordenar por sigla colocaria
 * "STORAGE" longe de "Armazenamento", que é o texto que o usuário lê na tela.
 * A opção agregadora ("Todos") não passa por aqui — é uma <option> fixa antes
 * do map, então continua sendo sempre a primeira.
 */
export function ordenarCategorias(lista) {
  return [...lista].sort((a, b) =>
    compararRotulos(rotuloCategoria(a.categoria, a.nome), rotuloCategoria(b.categoria, b.nome)));
}

// Rótulo de exibição de uma categoria: rótulo fixo conhecido > nome salvo no
// banco (produtos.nome, o que o admin digitou ao criá-la) > sigla crua.
export function rotuloCategoria(categoria, nome) {
  return CAT_LABEL[categoria] || nome || categoria;
}

// `slug` = chave do dict SCRAPERS no main.py (usado na coleta segmentada por loja)
// A ordem da lista abaixo é a de CADASTRO das lojas no projeto (KaBuM primeiro,
// Mercado Livre por último) e é irrelevante para a exibição: quem monta o
// <select> é LOJAS_FILTER (logo abaixo), que ordena alfabeticamente. Mantida
// assim para continuar legível como histórico de quando cada loja entrou.
const LOJAS = [
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
  { key: "aliexpress",   label: "AliExpress",   slug: "aliexpress"   },
  { key: "mocadopop",    label: "Mocadopop",    slug: "mocadopop"    },
  { key: "mercadolivre", label: "Mercado Livre",slug: "mercadolivre" },
];

/**
 * Sprint 71 (todo:314): "Todas Lojas" primeiro, as demais em ordem alfabética.
 * O agregador é fixado na cabeça da lista em vez de entrar na ordenação —
 * ordenado junto, "Todas Lojas" cairia entre Shopee e Terabyte.
 */
export const LOJAS_FILTER = [
  LOJAS[0],
  ...LOJAS.slice(1).sort((a, b) => compararRotulos(a.label, b.label)),
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
