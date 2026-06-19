/**
 * components/NavDrawer.jsx — PROTOCOL FPS
 */
import { Link, useLocation } from "react-router-dom";

const ITEMS = [
  { href: "/",             icon: "⚡", label: "Dashboard"    },
  { href: "/novo-produto", icon: "＋", label: "Novo Produto" },
];

const ITEMS_CONTA = [
  { href: "/conta", icon: "◉", label: "Minha Conta" },
];

export default function NavDrawer({ open, onClose, user, onLogout }) {
  const { pathname } = useLocation();

  return (
    <>
      <div className={`nav-drawer-overlay${open ? " open" : ""}`} onClick={onClose} />
      <div className={`nav-drawer${open ? " open" : ""}`}>
        <div className="nav-drawer-header">
          <div>
            <div className="nav-drawer-logo">FPS</div>
            <div className="nav-drawer-subtitle">Protocol v2</div>
          </div>
        </div>

        <nav className="nav-drawer-items">
          {ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              to={href}
              className={`nav-drawer-item${pathname === href ? " active" : ""}`}
              onClick={onClose}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </Link>
          ))}

          <div className="nav-drawer-separator" />

          {ITEMS_CONTA.map(({ href, icon, label }) => (
            <Link
              key={href}
              to={href}
              className={`nav-drawer-item${pathname === href ? " active" : ""}`}
              onClick={onClose}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-drawer-footer">
          <div className="nav-drawer-user">{user?.email || "—"}</div>
          <button className="btn-logout" style={{ width: "100%" }} onClick={onLogout}>
            ENCERRAR SESSÃO
          </button>
        </div>
      </div>
    </>
  );
}