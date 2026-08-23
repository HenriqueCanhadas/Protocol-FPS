/**
 * components/NavDrawer.jsx — PROTOCOL FPS
 */
import { Link, useLocation } from "react-router-dom";

const ITEMS = [
  { href: "/",             icon: "⚡", label: "Dashboard"    },
  { href: "/novo-produto", icon: "＋", label: "Novo Produto" },
];

// Visível apenas para admins (usuarios.nivel >= 2)
const ITEMS_ADMIN = [
  { href: "/usuarios", icon: "◈", label: "Usuários" },
];

// Visível apenas para quem tem usuarios.ver_banco=true (Sprint 32b) — não é
// ligado a isAdmin: por padrão só o dono da conta, liberado individualmente
// pela tela Usuários.
const ITEM_BANCO = { href: "/admin", icon: "▣", label: "Admin" };

const ITEMS_CONTA = [
  { href: "/conta", icon: "◉", label: "Minha Conta" },
];

export default function NavDrawer({ open, onClose, user, isAdmin = false, podeVerBanco = false, onLogout }) {
  const { pathname } = useLocation();
  let items = isAdmin ? [...ITEMS, ...ITEMS_ADMIN] : ITEMS;
  if (podeVerBanco) items = [...items, ITEM_BANCO];

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
          {items.map(({ href, icon, label }) => (
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