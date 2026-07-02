/**
 * pages/Conta.jsx — PROTOCOL FPS
 * Página de conta do usuário: info de sessão, troca de senha, encerrar sessões.
 */
import { Link } from "react-router-dom";
import { dataHoraBRT } from "../utils/datas";

const css = `
.conta-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap-sm { width:min(680px,100%); display:flex; flex-direction:column; gap:2rem; }
.breadcrumb { display:flex; align-items:center; gap:.6rem; font-size:var(--fs-sm); letter-spacing:.15em; color:var(--text-dim); text-transform:uppercase; }
.breadcrumb a { color:var(--text-dim); text-decoration:none; transition:color .15s; }
.breadcrumb a:hover { color:var(--green); }
.page-title-sm { font-family:var(--display); font-size:clamp(2.5rem,7vw,4rem); letter-spacing:.08em; color:var(--green); text-shadow:0 0 24px var(--green-dim); line-height:1; }

.info-card { background:var(--bg2); border:1px solid var(--border2); border-top:2px solid var(--green-dim); position:relative; }
.info-card::before { content:attr(data-label); position:absolute; top:-1px; left:1.75rem; background:var(--bg2); color:var(--green-dim); font-size:var(--fs-xs); letter-spacing:.3em; padding:0 .6rem; transform:translateY(-50%); text-transform:uppercase; }
.info-body { padding:1.75rem; display:flex; flex-direction:column; gap:1.5rem; }
.info-row { display:flex; justify-content:space-between; align-items:center; padding:.85rem 0; border-bottom:1px solid var(--border); }
.info-row:last-child { border-bottom:none; }
.info-key   { font-size:var(--fs-sm); letter-spacing:.2em; text-transform:uppercase; color:var(--text-dim); }
.info-value { font-size:var(--fs-md); color:var(--text); }
.badge-active { font-size:var(--fs-xs); letter-spacing:.15em; text-transform:uppercase; padding:.3rem .75rem; border:1px solid var(--green-dim); color:var(--green); }
.field-group { display:flex; flex-direction:column; }
.conta-form-actions { display:flex; gap:.9rem; justify-content:flex-end; padding:1.4rem 1.75rem; border-top:1px solid var(--border2); background:var(--bg3); }
.danger-zone { border-top-color:var(--red) !important; }
.danger-zone::before { color:var(--red) !important; }

@media (max-width:640px) {
  .conta-main { padding:1.25rem 1rem; }
  .info-body { padding:1.25rem; }
  .conta-form-actions { flex-direction:column; }
  .info-row { flex-direction:column; align-items:flex-start; gap:.4rem; }
}
`;

import { useState } from "react";

export default function Conta({ user, updatePassword, signOut, showToast }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confSenha, setConfSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [erroConf,  setErroConf]  = useState("");
  const [salvando,  setSalvando]  = useState(false);

  const salvarSenha = async () => {
    setErroSenha(""); setErroConf("");
    let ok = true;
    if (novaSenha.length < 8) { setErroSenha("Senha deve ter pelo menos 8 caracteres"); ok = false; }
    if (novaSenha !== confSenha) { setErroConf("As senhas não coincidem"); ok = false; }
    if (!ok) return;
    setSalvando(true);
    const { error } = await updatePassword(novaSenha);
    setSalvando(false);
    if (error) { showToast("Erro: " + error.message, "error"); }
    else { setNovaSenha(""); setConfSenha(""); showToast("✓ Senha atualizada com sucesso!"); }
  };

  const lastLogin = user?.last_sign_in_at
    ? dataHoraBRT(user.last_sign_in_at)
    : "—";

  return (
    <>
      <style>{css}</style>
      <main className="conta-main">
        <div className="page-wrap-sm">
          <nav className="breadcrumb">
            <Link to="/">Dashboard</Link>
            <span>›</span><span>Conta</span>
          </nav>

          <div className="page-title-sm">CONTA</div>

          {/* Sessão */}
          <div className="info-card" data-label="SESSÃO ATIVA">
            <div className="info-body">
              <div className="info-row">
                <div className="info-key">Email</div>
                <div className="info-value">{user?.email || "—"}</div>
              </div>
              <div className="info-row">
                <div className="info-key">ID de usuário</div>
                <div className="info-value dim" style={{ fontSize: "var(--fs-sm)", wordBreak: "break-all" }}>{user?.id || "—"}</div>
              </div>
              <div className="info-row">
                <div className="info-key">Status</div>
                <div className="info-value"><span className="badge-active">ATIVO</span></div>
              </div>
              <div className="info-row">
                <div className="info-key">Último acesso</div>
                <div className="info-value">{lastLogin}</div>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="info-card" data-label="SEGURANÇA">
            <div className="info-body">
              <div className="field-group">
                <div className="field-label">Nova senha</div>
                <input className="field-input" type="password" placeholder="••••••••"
                  autoComplete="new-password" value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)} />
                <div className="field-hint">Mínimo 8 caracteres</div>
                {erroSenha && <div className="field-error">{erroSenha}</div>}
              </div>
              <div className="field-group">
                <div className="field-label">Confirmar nova senha</div>
                <input className="field-input" type="password" placeholder="••••••••"
                  autoComplete="new-password" value={confSenha}
                  onChange={(e) => setConfSenha(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && salvarSenha()} />
                {erroConf && <div className="field-error">{erroConf}</div>}
              </div>
            </div>
            <div className="conta-form-actions">
              <button className="btn-primary" onClick={salvarSenha} disabled={salvando}>
                {salvando ? "SALVANDO..." : "ATUALIZAR SENHA"}
              </button>
            </div>
          </div>

          {/* Zona de perigo */}
          <div className="info-card danger-zone" data-label="SESSÃO">
            <div className="info-body">
              <div style={{ fontSize: "var(--fs-base)", color: "var(--text-dim)", lineHeight: 1.7 }}>
                Encerra a sessão atual em todos os dispositivos conectados.
              </div>
            </div>
            <div className="conta-form-actions">
              <button className="btn-danger" onClick={() => signOut("global")}>
                ENCERRAR TODAS AS SESSÕES
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
