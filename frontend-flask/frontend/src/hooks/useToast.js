/**
 * hooks/useToast.js — PROTOCOL FPS
 */
import { useState, useRef } from "react";

export function useToast() {
  const [toast, setToast] = useState({ msg: "", tipo: "", visible: false });
  const timerRef = useRef(null);

  const showToast = (msg, tipo = "ok") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, tipo, visible: true });
    timerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  };

  return { toast, showToast };
}
