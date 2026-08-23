/**
 * components/TerminalModal.jsx — PROTOCOL FPS
 * Wrapper genérico de modal (Sprint 20/V3): foco preso (Tab/Shift+Tab não
 * escapa) + Esc fecha — feature nova, nenhum modal do app tinha isso antes.
 * Mantém as classes CSS de cada modal existente via `overlayClassName`/
 * `className`, para não precisar re-estilizar nada nesta sprint.
 */
import { useEffect, useRef } from "react";

const SELETOR_FOCAVEL = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function TerminalModal({
  open, onClose, overlayClassName = "modal-overlay", className = "modal",
  children, ...rest
}) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const focaveis = () => Array.from(boxRef.current?.querySelectorAll(SELETOR_FOCAVEL) || []);
    // Sprint 25/V4: se algum campo já pegou foco via `autoFocus` nativo (ex.:
    // o campo de texto do SearchDialog/"Alterar nome"), não roubar de volta
    // para o primeiro elemento focável (normalmente o botão ✕ do cabeçalho)
    if (!boxRef.current?.contains(document.activeElement)) {
      focaveis()[0]?.focus();
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape") { onClose?.(); return; }
      if (e.key !== "Tab") return;
      const els = focaveis();
      if (!els.length) return;
      const primeiro = els[0], ultimo = els[els.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={overlayClassName} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={className} ref={boxRef} {...rest}>
        {children}
      </div>
    </div>
  );
}
