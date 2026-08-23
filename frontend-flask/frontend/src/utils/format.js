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

/**
 * Bytes em unidade legível (ex.: 1328000 → "1.3 MB"), no mesmo estilo do
 * pg_size_pretty do Postgres — usado para valores calculados no cliente
 * (ex.: espaço restante da cota) que não vêm prontos do banco.
 */
export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${Math.round(bytes)} bytes`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} kB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};
