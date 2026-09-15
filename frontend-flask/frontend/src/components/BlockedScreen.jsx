/**
 * components/BlockedScreen.jsx — PROTOCOL FPS
 * Tela mostrada quando a conta logada está com `usuarios.bloqueado = true`
 * (Sprint 78, todo:310).
 *
 * É a camada de EXPERIÊNCIA do bloqueio, não a barreira: quem barra de fato
 * é o `ban_duration` na admin API do Supabase (impede o login) e o veto do
 * RLS (nega todo dado mesmo numa sessão já aberta) — ver a migração
 * sprint78_bloquear_usuario.sql. Aqui a única função é dizer o que houve,
 * em vez de deixar a pessoa diante de um app vazio e quebrado.
 *
 * Reaproveita a moldura da tela de login (#login-screen/.login-box), em
 * vermelho em vez de verde — é o mesmo momento do fluxo (fora do app,
 * antes de qualquer dado), com o sinal invertido.
 */

const css = `
.blocked-box { border-top-color: var(--red); }
.blocked-box::before { content: 'ACESSO BLOQUEADO'; color: var(--red); }
.blocked-icone { font-size: 2.5rem; color: var(--red); text-align: center; line-height: 1; }
.blocked-titulo {
  font-family: var(--display); font-size: 1.5rem; letter-spacing: .12em;
  color: var(--red); text-align: center; line-height: 1.2;
}
.blocked-texto {
  font-size: var(--fs-sm); color: var(--text-dim); line-height: 1.7;
  text-align: center; letter-spacing: .04em;
}
.blocked-conta {
  font-family: var(--mono); font-size: var(--fs-sm); color: var(--text);
  text-align: center; word-break: break-all;
  padding: .6rem .8rem; background: var(--bg3); border: 1px solid var(--border2);
}
.blocked-box .btn-primary { border-color: var(--red); color: var(--red); }
.blocked-box .btn-primary:hover { background: rgba(255,68,68,.1); }
`;

export default function BlockedScreen({ email, onSair }) {
  return (
    <div id="login-screen">
      <style>{css}</style>

      <div>
        <div className="login-logo glow">PROTOCOL<br />FPS</div>
        <div className="login-subtitle">
          <strong className="green">H</strong>ardware{" "}
          <strong className="green">P</strong>rice{" "}
          <strong className="green">C</strong>ontroller
        </div>
      </div>

      <div className="login-box blocked-box">
        <div className="blocked-icone">⊘</div>
        <div className="blocked-titulo">Acesso bloqueado</div>
        <div className="blocked-texto">
          Esta conta foi bloqueada pelo administrador do sistema.<br />
          Nenhum dado fica visível enquanto o bloqueio estiver ativo.
        </div>
        {email && <div className="blocked-conta">{email}</div>}
        <div className="blocked-texto">
          Se acredita que isso é um engano, fale com o administrador
          para liberar o acesso novamente.
        </div>
        <button className="btn-primary" onClick={onSair}>SAIR</button>
      </div>

      <div className="login-footer">
        <span className="blink">_</span> SYS LOCKED &nbsp;·&nbsp; ACCESS DENIED
      </div>
    </div>
  );
}
