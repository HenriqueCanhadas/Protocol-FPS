// utils/datas.js — PROTOCOL FPS
// Formatação de datas SEMPRE no horário de Brasília (UTC-3),
// independente do fuso do navegador do usuário.
//
// O banco (Supabase/Postgres) armazena timestamptz em UTC e retorna
// ISO com sufixo "+00:00" — o new Date() interpreta corretamente e o
// timeZone abaixo converte a exibição para America/Sao_Paulo.

export const TZ_BRT = "America/Sao_Paulo";

/** Data no formato pt-BR (ex.: 01/07/2026), em horário de Brasília. */
export const dataBRT = (valor, opcoes = {}) =>
  new Date(valor).toLocaleDateString("pt-BR", { timeZone: TZ_BRT, ...opcoes });

/** Hora no formato pt-BR (ex.: 09:12), em horário de Brasília. */
export const horaBRT = (valor, opcoes = {}) =>
  new Date(valor).toLocaleTimeString("pt-BR", { timeZone: TZ_BRT, ...opcoes });

/** Data + hora no formato pt-BR (ex.: 01/07/2026 09:12), em horário de Brasília. */
export const dataHoraBRT = (valor, opcoes = {}) =>
  new Date(valor).toLocaleString("pt-BR", { timeZone: TZ_BRT, ...opcoes });

/**
 * Meia-noite de HOJE em Brasília, como ISO com offset (-03:00).
 * Usar em filtros .gte("criado_em", ...) do Supabase — "hoje" passa a
 * significar o dia civil de Brasília, não o do fuso do navegador.
 */
export const inicioDoDiaBRT = () => {
  // en-CA gera YYYY-MM-DD; Brasil não tem mais horário de verão (UTC-3 fixo)
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: TZ_BRT });
  return `${hoje}T00:00:00-03:00`;
};
