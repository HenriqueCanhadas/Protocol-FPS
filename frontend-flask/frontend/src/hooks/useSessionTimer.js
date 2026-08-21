// hooks/useSessionTimer.js — PROTOCOL FPS
// Tempo restante até o logout automático por inatividade (Sprint 28/V4,
// todo:212) — lê a mesma chave de localStorage que o useAutoLogout
// (Sprint 13) já mantém atualizada, então atividade em qualquer aba reseta
// a contagem aqui também, sem precisar ligar os dois hooks entre si.
import { useState, useEffect } from "react";
import { CHAVE_ULTIMA_ATIVIDADE, LIMITE_INATIVIDADE_MS } from "@/hooks/useAutoLogout";

export function useSessionTimer() {
  const [restanteMs, setRestanteMs] = useState(LIMITE_INATIVIDADE_MS);

  useEffect(() => {
    const tick = () => {
      const ultima = Number(localStorage.getItem(CHAVE_ULTIMA_ATIVIDADE)) || Date.now();
      setRestanteMs(Math.max(0, LIMITE_INATIVIDADE_MS - (Date.now() - ultima)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return restanteMs;
}
