/**
 * components/LoginScreen.jsx — PROTOCOL FPS
 */
import { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [email,  setEmail]  = useState("");
  const [senha,  setSenha]  = useState("");
  const [erro,   setErro]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) { setErro("Preencha email e senha."); return; }
    setLoading(true); setErro("");
    const { error } = await onLogin(email, senha);
    if (error) { setErro("Credenciais inválidas."); setLoading(false); }
  };

  return (
    <div id="login-screen">
      <div>
        <div className="login-logo glow">PROTOCOL<br />FPS</div>
        <div className="login-subtitle">
          <strong className="green">H</strong>ardware{" "}
          <strong className="green">P</strong>rice{" "}
          <strong className="green">C</strong>ontroller
        </div>
      </div>

      <div className="login-box">
        <div>
          <div className="field-label">Acesso</div>
          <input
            className="field-input" type="email" placeholder="email@dominio.com"
            autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("senha-input")?.focus()}
          />
        </div>
        <div>
          <div className="field-label">Senha</div>
          <input
            id="senha-input"
            className="field-input" type="password" placeholder="••••••••"
            autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div className="login-error">{erro}</div>
        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "AUTENTICANDO..." : "INICIAR SESSÃO"}
        </button>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", textAlign: "center" }}>
          Acesso restrito — usuários autorizados
        </div>
      </div>

      <div className="login-footer">
        <span className="blink">_</span> SYS READY &nbsp;·&nbsp; AWAITING AUTH
      </div>
    </div>
  );
}
