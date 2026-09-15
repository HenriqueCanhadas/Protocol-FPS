/**
 * hooks/useKonami.js — PROTOCOL FPS
 * Easter Egg: captura a sequência clássica do Konami Code:
 * ↑ ↑ ↓ ↓ ← → ← → B A
 *
 * Cuidados técnicos essenciais (Sprint 79):
 * 1. Não interfere na digitação em inputs, textareas e selects.
 * 2. Não chama preventDefault nas setas para conviver pacificamente com a
 *    navegação por teclado da tabela do Dashboard (useProductSelection.js).
 * 3. Áudio tocado sob demanda (após gesto do usuário), com tratamento de erro
 *    silencioso e fallback para sintetizador Web Audio API.
 */
import { useEffect, useRef } from "react";

export const KONAMI_SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a"
];

function normalizarTecla(key) {
  if (!key) return "";
  const k = key.toLowerCase();
  if (k === "arrowup" || k === "up") return "arrowup";
  if (k === "arrowdown" || k === "down") return "arrowdown";
  if (k === "arrowleft" || k === "left") return "arrowleft";
  if (k === "arrowright" || k === "right") return "arrowright";
  return k;
}

/**
 * Toca o efeito sonoro retrô do Konami Code.
 * Tenta primeiro o arquivo estático /konami.wav (servido pelo Vite/Flask/Vercel);
 * se o navegador bloquear ou o arquivo falhar, utiliza o sintetizador nativo
 * Web Audio API com onda quadrada de 8-bit.
 */
export function playKonamiSound() {
  try {
    const audio = new Audio("/konami.wav");
    audio.volume = 0.6;
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        tocarSintetizadorWebAudio();
      });
    }
  } catch {
    tocarSintetizadorWebAudio();
  }
}

function tocarSintetizadorWebAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Melodia arpeggiada clássica 8-bit
    const notas = [
      { freq: 523.25, dur: 0.08, time: 0.00 }, // C5
      { freq: 659.25, dur: 0.08, time: 0.08 }, // E5
      { freq: 783.99, dur: 0.08, time: 0.16 }, // G5
      { freq: 1046.50, dur: 0.12, time: 0.24 }, // C6
      { freq: 783.99, dur: 0.08, time: 0.36 }, // G5
      { freq: 1046.50, dur: 0.35, time: 0.44 }, // C6
    ];

    notas.forEach(({ freq, dur, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch {
    // Falhas de áudio tratadas em silêncio absoluto
  }
}

export function useKonami(onTrigger, enabled = true) {
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    if (!enabled) return;

    let buffer = [];

    const onKeyDown = (e) => {
      // Ignora digitação em campos de formulário
      const tag = document.activeElement?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      const tecla = normalizarTecla(e.key);
      if (!tecla) return;

      buffer.push(tecla);
      if (buffer.length > KONAMI_SEQUENCE.length) {
        buffer.shift();
      }

      // Verifica se as últimas 10 teclas batem exatamente com o Konami Code
      if (
        buffer.length === KONAMI_SEQUENCE.length &&
        buffer.every((k, idx) => k === KONAMI_SEQUENCE[idx])
      ) {
        buffer = [];
        onTriggerRef.current?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
