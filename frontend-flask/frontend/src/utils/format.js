// utils/format.js — PROTOCOL FPS
// Formatação de valores monetários e de tempo, sempre em pt-BR.

/** Preço em Real (ex.: R$ 3.299,90). Aceita number ou string numérica. */
export const formatBRL = (v) =>
  `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Duração em mm:ss (ex.: 29:58). Usado pelo temporizador de sessão no AppHeader. */
export const formatMMSS = (ms) => {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
};
