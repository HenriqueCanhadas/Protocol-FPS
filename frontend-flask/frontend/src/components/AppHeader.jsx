/**
 * components/AppHeader.jsx — PROTOCOL FPS
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function AppHeader({ onMenuClick, menuOpen }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
      </div>
    </header>
  );
}
