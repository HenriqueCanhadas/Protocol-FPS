/**
 * components/LoginScreen.jsx — PROTOCOL FPS
 */
import { useState } from "react";

/**
 * Sprint 78 (todo:310): uma conta bloqueada é banida na admin API do
 * Supabase (`ban_duration`), e o GoTrue responde a esse login com "User is
 * banned" / código `user_banned` — que, traduzido como "Credenciais
 * inválidas", faria a pessoa ficar tentando de novo achando que errou a
 * senha. Qualquer outra falha continua sendo credencial inválida.
 */
function mensagemDeErro(error) {
  const texto = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  if (texto.includes("banned")) {
    return "Acesso bloqueado — fale com o administrador do sistema.";
  }
  return "Credenciais inválidas.";
}

export default function LoginScreen({ onLogin }) {
  const [email,  setEmail]  = useState("");
  const [senha,  setSenha]  = useState("");
  const [erro,   setErro]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) { setErro("Preencha email e senha."); return; }
    setLoading(true); setErro("");
    const { error } = await onLogin(email, senha);
    if (error) { setErro(mensagemDeErro(error)); setLoading(false); }
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
