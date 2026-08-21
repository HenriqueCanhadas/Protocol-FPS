/**
 * hooks/useAutoLogout.js — PROTOCOL FPS
 * Logout automático por inatividade (Sprint 13, todo:122).
 *
 * Encerra a sessão após 30 minutos sem interação — inclusive com a janela
 * fechada: a última atividade fica em localStorage, então ao reabrir a página
 * com o timestamp vencido a sessão é derrubada antes de qualquer uso.
 * Atividade em QUALQUER aba conta (localStorage é compartilhado); interação
 * contínua nunca desloga.
 */
import { useEffect, useRef } from "react";

const CHAVE = "fps_ultima_atividade";
// Exportada para o useSessionTimer (temporizador do AppHeader) ler a mesma
// chave sem duplicar a string.
export const CHAVE_ULTIMA_ATIVIDADE = CHAVE;
export const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos
const THROTTLE_GRAVACAO_MS = 15 * 1000;              // grava no máx. a cada 15s

export function useAutoLogout(user, onExpirar) {
  // ref evita que a identidade do callback (recriado a cada render do App)
  // re-execute o efeito — ele só liga/desliga quando a sessão muda
  const expirarRef = useRef(onExpirar);
  expirarRef.current = onExpirar;
  // Distingue "carregando (user ainda null)" de "acabou de deslogar": a chave
  // só é limpa na transição logado → deslogado. Limpá-la com user null no
  // mount apagaria o timestamp vencido ANTES de a sessão ser restaurada — e
  // a expiração por "janela fechada" nunca dispararia.
  const tinhaUsuario = useRef(false);

  useEffect(() => {
    if (!user) {
      if (tinhaUsuario.current) localStorage.removeItem(CHAVE);
      tinhaUsuario.current = false;
      return;
    }
    tinhaUsuario.current = true;

    // Sessão recém-restaurada: janela ficou fechada por 30+ min → derruba já
    const agora = Date.now();
    const ultima = Number(localStorage.getItem(CHAVE)) || 0;
    if (ultima && agora - ultima > LIMITE_INATIVIDADE_MS) {
      expirarRef.current();
      return;
    }
    localStorage.setItem(CHAVE, String(agora));

    let ultimaGravacao = agora;
    const registrarAtividade = () => {
      const t = Date.now();
      if (t - ultimaGravacao >= THROTTLE_GRAVACAO_MS) {
        ultimaGravacao = t;
        localStorage.setItem(CHAVE, String(t));
      }
    };
    const verificar = () => {
      const ult = Number(localStorage.getItem(CHAVE)) || 0;
      if (Date.now() - ult > LIMITE_INATIVIDADE_MS) expirarRef.current();
    };
    // aba voltou a ficar visível (troca de aba/minimizada) → confere na hora
    const aoMudarVisibilidade = () => { if (!document.hidden) verificar(); };

    const eventos = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    eventos.forEach((e) => window.addEventListener(e, registrarAtividade, { passive: true }));
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    const timer = setInterval(verificar, 60 * 1000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, registrarAtividade));
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      clearInterval(timer);
    };
  }, [user]);
}
