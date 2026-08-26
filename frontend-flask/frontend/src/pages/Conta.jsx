/**
 * pages/Conta.jsx — PROTOCOL FPS
 * Página de conta do usuário: info de sessão e encerrar sessões.
 * A troca de senha própria foi removida (Sprint 13, todo:120): senhas são
 * gerenciadas apenas pelo fluxo admin (página Usuários); o card Segurança
 * orienta a pedir a um admin, sem revelar quem são os admins.
 */
import { dataHoraBRT } from "@/utils/datas";

const css = `
.conta-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap-sm { width:min(680px,100%); display:flex; flex-direction:column; gap:2rem; }

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
.seguranca-card { border-top-color:var(--blue) !important; }
.seguranca-card::before { color:var(--blue) !important; }
.aviso-senha { display:flex; align-items:center; gap:.9rem; border:1px solid rgba(77,166,255,.35); background:rgba(77,166,255,.07); color:var(--blue); padding:1rem 1.2rem; font-size:var(--fs-base); line-height:1.6; letter-spacing:.03em; }
.aviso-senha .as-ic { font-size:1.2rem; }

@media (max-width:640px) {
  .conta-main { padding:1.25rem 1rem; }
  .info-body { padding:1.25rem; }
  .conta-form-actions { flex-direction:column; }
  .info-row { flex-direction:column; align-items:flex-start; gap:.4rem; }
}
`;

export default function Conta({ user, perfil, signOut }) {
  const lastLogin = user?.last_sign_in_at
    ? dataHoraBRT(user.last_sign_in_at)
    : "—";

  return (
    <>
      <style>{css}</style>
      <main className="conta-main">
        <div className="page-wrap-sm">
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
                <div className="info-key">Papel</div>
                <div className="info-value">
                  <span className="badge-active" style={(perfil?.nivel ?? 1) >= 2
                    ? { borderColor: "var(--amber)", color: "var(--amber)" } : undefined}>
                    {(perfil?.nivel ?? 1) >= 2 ? "ADMIN" : "NORMAL"}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-key">Último acesso</div>
                <div className="info-value">{lastLogin}</div>
              </div>
            </div>
          </div>

          {/* Segurança — troca de senha só pelo fluxo admin (Sprint 13) */}
          <div className="info-card seguranca-card" data-label="SEGURANÇA">
            <div className="info-body">
              <div className="aviso-senha">
                <span className="as-ic">⚿</span>
                <span>Solicite ao usuário admin para alterar sua senha.</span>
              </div>
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
