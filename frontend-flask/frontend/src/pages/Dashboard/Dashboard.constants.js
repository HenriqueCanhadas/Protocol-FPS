// pages/Dashboard/Dashboard.constants.js — PROTOCOL FPS
// Constantes compartilhadas entre os componentes/dialogs da Dashboard.

export const FILTROS_CAT = ["all", "GPU", "CPU", "RAM", "PSU", "MOBO", "STORAGE", "DIVERSOS"];

// Rótulos amigáveis para as siglas de categoria salvas em produtos.categoria
export const CAT_LABEL = {
  all:      "Todos",
  PSU:      "Fonte",
  MOBO:     "Placa Mãe",
  STORAGE:  "Armazenamento",
  DIVERSOS: "Diversos",
};

// `slug` = chave do dict SCRAPERS no main.py (usado na coleta segmentada por loja)
export const LOJAS_FILTER = [
  { key: "all",       label: "Todas Lojas", slug: null           },
  { key: "kabum",     label: "KaBuM",       slug: "kabum"        },
  { key: "terabyte",  label: "Terabyte",    slug: "terabyteshop" },
  { key: "pichau",    label: "Pichau",      slug: "pichau"       },
];
