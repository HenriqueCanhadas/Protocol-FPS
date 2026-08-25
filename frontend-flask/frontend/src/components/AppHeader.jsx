/**
 * components/AppHeader.jsx — PROTOCOL FPS
 */
import { Link, useLocation } from "react-router-dom";
import { useClock } from "@/hooks/useClock";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { formatMMSS } from "@/utils/format";

// Rótulo da página atual, exibido ao lado do menu hambúrguer (Sprint 60,
// todo:276) — no lugar do título grande que cada página tinha no corpo.
// Mesmo nome usado no NavDrawer; App.jsx já redireciona toda rota legada
// para uma destas 5 antes de renderizar, então não precisa de fallback.
const PAGE_LABELS = {
  "/": "Dashboard",
  "/novo-produto": "Novo Produto",
  "/usuarios": "Usuários",
  "/admin": "Admin",
  "/conta": "Conta",
};

export default function AppHeader({ onMenuClick, menuOpen }) {
  const { time } = useClock();
  const restanteMs = useSessionTimer();
  const { pathname } = useLocation();

  return (
    <header>
      <div className="header-left">
        <button
          className={`hamburger-btn${menuOpen ? " open" : ""}`}
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
        <span className="header-page-name">{PAGE_LABELS[pathname]}</span>
      </div>
      <Link to="/" className="header-logo">PROTOCOL FPS</Link>
      <div className="header-meta">
        <div className="status-dot" />
        <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>{time}</div>
        <div
          style={{ fontSize: "var(--fs-sm)", color: "var(--amber)" }}
          title="Tempo até o logout automático por inatividade"
        >
          {formatMMSS(restanteMs)}
        </div>
      </div>
    </header>
  );
}
