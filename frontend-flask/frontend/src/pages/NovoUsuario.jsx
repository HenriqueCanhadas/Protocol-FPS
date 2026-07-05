/**
 * pages/NovoUsuario.jsx — PROTOCOL FPS
 * Gestão de usuários — SOMENTE ADMIN (usuarios.nivel >= 2).
 *
 * Criação de usuário (email + senha + papel Normal/Admin) e troca de senha
 * de qualquer usuário. As operações rodam server-side em /api/usuarios
 * (Flask em dev, Vercel Function em produção) com a SERVICE_KEY; o browser
 * só envia o access_token da sessão do admin para autorização.
 */
import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { getSupabase } from "@/services/supabase";
import ConfirmModal from "@/components/ConfirmModal";

const css = `
.nu-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap { width:min(800px,100%); display:flex; flex-direction:column; gap:2rem; }
.breadcrumb { display:flex; align-items:center; gap:.6rem; font-size:var(--fs-sm); letter-spacing:.15em; color:var(--text-dim); text-transform:uppercase; }
.breadcrumb a { color:var(--text-dim); text-decoration:none; transition:color .15s; }
.breadcrumb a:hover { color:var(--green); }
.page-title { font-family:var(--display); font-size:clamp(2.5rem,7vw,4rem); letter-spacing:.08em; color:var(--green); text-shadow:0 0 24px var(--green-dim); line-height:1; }
.page-subtitle { font-size:var(--fs-base); color:var(--text-dim); letter-spacing:.1em; margin-top:.4rem; }

.form-card { background:var(--bg2); border:1px solid var(--border2); border-top:2px solid var(--green-dim); position:relative; }
.form-card::before { content:attr(data-label); position:absolute; top:-1px; left:1.75rem; background:var(--bg2); color:var(--green-dim); font-size:var(--fs-xs); letter-spacing:.3em; padding:0 .6rem; transform:translateY(-50%); text-transform:uppercase; }
.form-card.card-amber { border-top-color:var(--amber); }
.form-card.card-amber::before { color:var(--amber); }
.form-body { padding:2rem; display:flex; flex-direction:column; gap:1.75rem; }
.fields-grid { display:grid; gap:1.5rem; }
.fields-grid.cols-2 { grid-template-columns:1fr 1fr; }
.field-group { display:flex; flex-direction:column; }
.form-actions { display:flex; gap:.9rem; justify-content:flex-end; padding:1.4rem 2rem; border-top:1px solid var(--border2); background:var(--bg3); }

.papel-chips { display:flex; gap:.6rem; flex-wrap:wrap; }
.papel-chip { background:var(--bg3); border:1px solid var(--border2); color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-sm); letter-spacing:.12em; text-transform:uppercase; padding:.55rem 1rem; cursor:pointer; transition:all .15s; user-select:none; display:flex; flex-direction:column; gap:.2rem; }
.papel-chip .pc-sub { font-size:var(--fs-xs); color:var(--text-muted); text-transform:none; letter-spacing:.02em; }
.papel-chip:hover { border-color:var(--green-dim); color:var(--text); }
.papel-chip.sel-normal { border-color:var(--green); color:var(--green); background:var(--green-soft); }
.papel-chip.sel-admin  { border-color:var(--amber); color:var(--amber); background:rgba(255,184,0,.08); }

.user-select {
  background:var(--bg3); border:1px solid var(--border2); color:var(--text);
  font-family:var(--mono); font-size:var(--fs-sm); letter-spacing:.04em;
  padding:.65rem .9rem; outline:none; cursor:pointer; transition:border-color .2s;
}
.user-select:hover,.user-select:focus { border-color:var(--amber); }
.user-select option { background:var(--bg2); color:var(--text); }
.nivel-badge { font-size:var(--fs-xs); letter-spacing:.15em; text-transform:uppercase; padding:.25rem .6rem; border:1px solid var(--border2); color:var(--text-dim); }

@media (max-width:640px) {
  .nu-main { padding:1.25rem 1rem; }
  .form-body { padding:1.25rem; }
  .form-actions { padding:1.1rem 1.25rem; flex-direction:column; }
  .fields-grid.cols-2 { grid-template-columns:1fr; }
}
`;

async function chamarApiUsuarios(body) {
  const sb = await getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  const resp = await fetch("/api/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data;
}

export default function NovoUsuario({ showToast, isAdmin }) {
  const [confirm, setConfirm] = useState(null);

  // ── Criar usuário ──────────────────────────────────────────
  const [email,     setEmail]     = useState("");
  const [senha,     setSenha]     = useState("");
  const [confSenha, setConfSenha] = useState("");
  const [nivel,     setNivel]     = useState(1);
  const [erros,     setErros]     = useState({});
  const [criando,   setCriando]   = useState(false);

  // ── Trocar senha ───────────────────────────────────────────
  const [usuarios,   setUsuarios]   = useState([]);
  const [alvoId,     setAlvoId]     = useState("");
  const [novaSenha,  setNovaSenha]  = useState("");
  const [confNova,   setConfNova]   = useState("");
  const [errosTs,    setErrosTs]    = useState({});
  const [trocando,   setTrocando]   = useState(false);

  const carregarUsuarios = useCallback(async () => {
    // Admin lê todos os perfis via RLS (usuarios_select libera para nivel >= 2)
    const sb = await getSupabase();
    const { data } = await sb
      .from("usuarios")
      .select("id, email, nome, nivel")
      .order("email", { ascending: true });
    setUsuarios(data || []);
  }, []);

  useEffect(() => { if (isAdmin) carregarUsuarios(); }, [isAdmin, carregarUsuarios]);

  // Não-admin não tem o que fazer aqui (o item nem aparece no menu)
  if (!isAdmin) return <Navigate to="/" replace />;

  const validarSenha = (s, conf) => {
    if (s.length < 8) return "Senha deve ter pelo menos 8 caracteres";
    if (s !== conf)   return "As senhas não coincidem";
    return null;
  };

  const criar = () => {
    const e = {};
    if (!email.includes("@") || !email.includes(".")) e.email = "Informe um email válido";
    const erroSenha = validarSenha(senha, confSenha);
    if (erroSenha) e.senha = erroSenha;
    setErros(e);
    if (Object.keys(e).length) return;

    setConfirm({
      titulo: "CRIAR USUÁRIO",
      corpo: `Criar o usuário <strong>${email}</strong> com papel <strong>${nivel === 2 ? "ADMIN" : "NORMAL"}</strong>?` +
        (nivel === 2 ? "<br><br><span style='color:var(--amber)'>⚠ Admins veem e gerenciam os itens de todos os usuários.</span>" : ""),
      icone: "◈", isDanger: nivel === 2,
      cb: async () => {
        setCriando(true);
        try {
          await chamarApiUsuarios({ acao: "criar", email, senha, nivel });
          showToast(`✓ Usuário ${email} criado (${nivel === 2 ? "admin" : "normal"}).`, "ok");
          setEmail(""); setSenha(""); setConfSenha(""); setNivel(1); setErros({});
          carregarUsuarios();
        } catch (err) {
          showToast("Erro ao criar usuário: " + err.message, "error");
        }
        setCriando(false);
      },
    });
  };

  const trocarSenha = () => {
    const e = {};
    if (!alvoId) e.alvo = "Selecione o usuário";
    const erroSenha = validarSenha(novaSenha, confNova);
    if (erroSenha) e.senha = erroSenha;
    setErrosTs(e);
    if (Object.keys(e).length) return;

    const alvo = usuarios.find((u) => u.id === alvoId);
    setConfirm({
      titulo: "ALTERAR SENHA",
      corpo: `Definir uma nova senha para <strong>${alvo?.email}</strong>?<br><br>A senha atual deixará de funcionar imediatamente.`,
      icone: "⚿", isDanger: true,
      cb: async () => {
        setTrocando(true);
        try {
          await chamarApiUsuarios({ acao: "trocar_senha", user_id: alvoId, senha: novaSenha });
          showToast(`✓ Senha de ${alvo?.email} alterada.`, "ok");
          setAlvoId(""); setNovaSenha(""); setConfNova(""); setErrosTs({});
        } catch (err) {
          showToast("Erro ao alterar senha: " + err.message, "error");
        }
        setTrocando(false);
      },
    });
  };

  return (
    <>
      <style>{css}</style>
      <ConfirmModal confirm={confirm} onCancel={() => setConfirm(null)}
        onOk={() => { confirm?.cb(); setConfirm(null); }} />

      <main className="nu-main">
        <div className="page-wrap">
          <nav className="breadcrumb">
            <Link to="/">Dashboard</Link>
            <span>›</span><span>Novo Usuário</span>
          </nav>

          <div>
            <div className="page-title">NOVO<br />USUÁRIO</div>
            <div className="page-subtitle">Gestão de acesso — visível apenas para administradores</div>
          </div>

          {/* CRIAR USUÁRIO */}
          <div className="form-card" data-label="CRIAR USUÁRIO">
            <div className="form-body">
              <div className="field-group">
                <div className="field-label">Email <span className="red">*</span></div>
                <input className="field-input" type="email" placeholder="usuario@email.com"
                  autoComplete="off" value={email}
                  onChange={(e) => { setEmail(e.target.value); setErros((x) => ({ ...x, email: null })); }} />
                {erros.email && <div className="field-error">{erros.email}</div>}
              </div>

              <div className="fields-grid cols-2">
                <div className="field-group">
                  <div className="field-label">Senha <span className="red">*</span></div>
                  <input className="field-input" type="password" placeholder="••••••••"
                    autoComplete="new-password" value={senha}
                    onChange={(e) => { setSenha(e.target.value); setErros((x) => ({ ...x, senha: null })); }} />
                  <div className="field-hint">Mínimo 8 caracteres</div>
                </div>
                <div className="field-group">
                  <div className="field-label">Confirmar senha <span className="red">*</span></div>
                  <input className="field-input" type="password" placeholder="••••••••"
                    autoComplete="new-password" value={confSenha}
                    onChange={(e) => { setConfSenha(e.target.value); setErros((x) => ({ ...x, senha: null })); }} />
                  {erros.senha && <div className="field-error">{erros.senha}</div>}
                </div>
              </div>

              <div className="field-group">
                <div className="field-label">Papel <span className="red">*</span></div>
                <div className="papel-chips">
                  <div className={`papel-chip${nivel === 1 ? " sel-normal" : ""}`} onClick={() => setNivel(1)}>
                    <span>Usuário padrão</span>
                    <span className="pc-sub">Vê e gerencia apenas os próprios itens</span>
                  </div>
                  <div className={`papel-chip${nivel === 2 ? " sel-admin" : ""}`} onClick={() => setNivel(2)}>
                    <span>Admin</span>
                    <span className="pc-sub">Vê os itens de todos e gerencia usuários</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={criar} disabled={criando}>
                {criando ? "CRIANDO..." : "CRIAR USUÁRIO"}
              </button>
            </div>
          </div>

          {/* TROCAR SENHA */}
          <div className="form-card card-amber" data-label="ALTERAR SENHA DE USUÁRIO">
            <div className="form-body">
              <div className="field-group">
                <div className="field-label">Usuário <span className="red">*</span></div>
                <select className="user-select" value={alvoId}
                  onChange={(e) => { setAlvoId(e.target.value); setErrosTs((x) => ({ ...x, alvo: null })); }}>
                  <option value="">— selecione o usuário —</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email} {u.nivel >= 2 ? "· ADMIN" : ""}
                    </option>
                  ))}
                </select>
                {errosTs.alvo && <div className="field-error">{errosTs.alvo}</div>}
              </div>

              <div className="fields-grid cols-2">
                <div className="field-group">
                  <div className="field-label">Nova senha <span className="red">*</span></div>
                  <input className="field-input" type="password" placeholder="••••••••"
                    autoComplete="new-password" value={novaSenha}
                    onChange={(e) => { setNovaSenha(e.target.value); setErrosTs((x) => ({ ...x, senha: null })); }} />
                  <div className="field-hint">Mínimo 8 caracteres</div>
                </div>
                <div className="field-group">
                  <div className="field-label">Confirmar nova senha <span className="red">*</span></div>
                  <input className="field-input" type="password" placeholder="••••••••"
                    autoComplete="new-password" value={confNova}
                    onChange={(e) => { setConfNova(e.target.value); setErrosTs((x) => ({ ...x, senha: null })); }}
                    onKeyDown={(e) => e.key === "Enter" && trocarSenha()} />
                  {errosTs.senha && <div className="field-error">{errosTs.senha}</div>}
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" style={{ borderColor: "var(--amber)", color: "var(--amber)" }}
                onClick={trocarSenha} disabled={trocando}>
                {trocando ? "ALTERANDO..." : "ALTERAR SENHA"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
