/**
 * components/AppHeader.jsx — PROTOCOL FPS
 */
import { Link } from "react-router-dom";
import { useClock } from "@/hooks/useClock";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import { formatMMSS } from "@/utils/format";

export default function AppHeader({ onMenuClick, menuOpen }) {
  const { time } = useClock();
  const restanteMs = useSessionTimer();

  return (
    <header>
      <button
        className={`hamburger-btn${menuOpen ? " open" : ""}`}
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>
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
