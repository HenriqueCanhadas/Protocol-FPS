/**
 * pages/Usuarios.jsx — PROTOCOL FPS
 * Gestão de usuários — SOMENTE ADMIN (usuarios.nivel >= 2).
 *
 * Página única de gestão (Sprint 11): listagem de todos os usuários
 * (último acesso, papel, status, nº de itens, Telegram por usuário e
 * exclusão em cascata), criação de usuário (email + senha + papel) e
 * troca de senha de qualquer usuário. As operações rodam server-side
 * em /api/usuarios (Flask em dev, Vercel Function em produção) com a
 * SERVICE_KEY; o browser só envia o access_token da sessão do admin.
 */
import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { getSupabase } from "@/services/supabase";
import { dataHoraBRT } from "@/utils/datas";
import ConfirmModal from "@/components/ConfirmModal";

const css = `
.nu-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap { width:min(960px,100%); display:flex; flex-direction:column; gap:2rem; }
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

/* ── Listagem de usuários ─────────────────────────────────── */
.users-scroll { overflow-x:auto; }
.users-table { width:100%; border-collapse:collapse; font-family:var(--mono); font-size:var(--fs-sm); }
.users-table th { text-align:left; padding:.7rem .55rem; color:var(--text-dim); font-size:var(--fs-xs); letter-spacing:.2em; text-transform:uppercase; border-bottom:1px solid var(--border2); white-space:nowrap; }
.users-table td { padding:.8rem .55rem; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; white-space:nowrap; }
.users-table tr:last-child td { border-bottom:none; }
.users-table tr:hover td { background:var(--bg3); }
.u-email { display:flex; flex-direction:column; gap:.15rem; }
.u-email .ue-nome { font-size:var(--fs-xs); color:var(--text-muted); }
.u-voce { color:var(--green); font-size:var(--fs-xs); letter-spacing:.15em; }
.badge { display:inline-block; font-size:var(--fs-xs); letter-spacing:.15em; text-transform:uppercase; padding:.25rem .6rem; border:1px solid var(--border2); color:var(--text-dim); }
.badge.b-admin  { border-color:var(--amber); color:var(--amber); background:rgba(255,184,0,.08); }
.badge.b-normal { border-color:var(--border2); color:var(--text-dim); }
.badge.b-ativo  { border-color:var(--green-dim); color:var(--green); }
.badge.b-pend   { border-color:var(--amber); color:var(--amber); }
.tg-toggle { background:var(--bg3); border:1px solid var(--border2); color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.15em; padding:.35rem .7rem; cursor:pointer; transition:all .15s; text-transform:uppercase; }
.tg-toggle:hover { border-color:var(--green-dim); }
.tg-toggle.on { border-color:var(--green); color:var(--green); background:var(--green-soft); }
.tg-toggle:disabled { opacity:.4; cursor:not-allowed; }
.btn-excluir { background:transparent; border:1px solid var(--border2); color:var(--red); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.15em; padding:.35rem .8rem; cursor:pointer; transition:all .15s; text-transform:uppercase; }
.btn-excluir:hover:not(:disabled) { border-color:var(--red); background:rgba(255,60,60,.08); }
.btn-excluir:disabled { opacity:.35; cursor:not-allowed; }
.users-empty { padding:1.5rem; color:var(--text-dim); font-size:var(--fs-sm); letter-spacing:.08em; }

@media (max-width:640px) {
  .nu-main { padding:1.25rem 1rem; }
  .form-body { padding:1.25rem; }
  .form-actions { padding:1.1rem 1.25rem; flex-direction:column; }
  .fields-grid.cols-2 { grid-template-columns:1fr; }
}
`;

// Único email que pode liberar/revogar o acesso de outra pessoa a /admin
// (Sprint 32b, pedido do usuário) — a checagem real fica no endpoint
// /api/usuarios; isto só decide se o botão aparece habilitado aqui.
const DONO_EMAIL = "pedrosacanhadas@gmail.com";

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

export default function Usuarios({ showToast, isAdmin, perfilLoading, user }) {
  const [confirm, setConfirm] = useState(null);

  // ── Listagem ───────────────────────────────────────────────
  const [usuarios,    setUsuarios]    = useState([]);
  const [telegramOk,  setTelegramOk]  = useState(true);
  const [verBancoOk,  setVerBancoOk]  = useState(true);
  const [carregando,  setCarregando]  = useState(true);
  const [ocupadoId,   setOcupadoId]   = useState(null); // linha com ação em andamento

  const souDono = (user?.email || "").toLowerCase() === DONO_EMAIL;

  // ── Criar usuário ──────────────────────────────────────────
  const [email,     setEmail]     = useState("");
  const [senha,     setSenha]     = useState("");
  const [confSenha, setConfSenha] = useState("");
  const [nivel,     setNivel]     = useState(1);
  const [erros,     setErros]     = useState({});
  const [criando,   setCriando]   = useState(false);

  // ── Trocar senha ───────────────────────────────────────────
  const [alvoId,     setAlvoId]     = useState("");
  const [novaSenha,  setNovaSenha]  = useState("");
  const [confNova,   setConfNova]   = useState("");
  const [errosTs,    setErrosTs]    = useState({});
  const [trocando,   setTrocando]   = useState(false);

  const carregarUsuarios = useCallback(async () => {
    // Listagem server-side (/api/usuarios acao=listar): junta os perfis
    // (usuarios) com auth.users (último acesso, confirmação) — campos que
    // só a admin API enxerga — e a contagem de itens por dono.
    setCarregando(true);
    try {
      const data = await chamarApiUsuarios({ acao: "listar" });
      setUsuarios(data.usuarios || []);
      setTelegramOk(Boolean(data.telegram_disponivel));
      setVerBancoOk(Boolean(data.ver_banco_disponivel));
    } catch (err) {
      showToast("Erro ao listar usuários: " + err.message, "error");
    }
    setCarregando(false);
  }, [showToast]);

  useEffect(() => { if (isAdmin) carregarUsuarios(); }, [isAdmin, carregarUsuarios]);

  // Não-admin não tem o que fazer aqui (o item nem aparece no menu).
  // Num deep-link direto o perfil ainda pode estar carregando — espera
  // antes de redirecionar, senão o próprio admin é expulso da página.
  if (!isAdmin) {
    if (perfilLoading) {
      return (
        <main className="nu-main">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div className="spinner" />
          </div>
        </main>
      );
    }
    return <Navigate to="/" replace />;
  }

  const validarSenha = (s, conf) => {
    if (s.length < 8) return "Senha deve ter pelo menos 8 caracteres";
    if (s !== conf)   return "As senhas não coincidem";
    return null;
  };

  const alternarTelegram = async (u) => {
    setOcupadoId(u.id);
    try {
      const data = await chamarApiUsuarios({ acao: "telegram", user_id: u.id, ativo: !u.notificar_telegram });
      setUsuarios((lista) => lista.map((x) =>
        x.id === u.id ? { ...x, notificar_telegram: data.notificar_telegram } : x));
      showToast(`✓ Telegram ${data.notificar_telegram ? "ativado" : "desativado"} para ${u.email}.`, "ok");
    } catch (err) {
      showToast("Erro ao alterar Telegram: " + err.message, "error");
    }
    setOcupadoId(null);
  };

  const alternarVerBanco = async (u) => {
    setOcupadoId(u.id);
    try {
      const data = await chamarApiUsuarios({ acao: "ver_banco", user_id: u.id, ativo: !u.ver_banco });
      setUsuarios((lista) => lista.map((x) =>
        x.id === u.id ? { ...x, ver_banco: data.ver_banco } : x));
      showToast(`✓ Acesso ao banco ${data.ver_banco ? "liberado" : "revogado"} para ${u.email}.`, "ok");
    } catch (err) {
      showToast("Erro ao alterar acesso ao banco: " + err.message, "error");
    }
    setOcupadoId(null);
  };

  const excluirUsuario = (u) => {
    setConfirm({
      titulo: "EXCLUIR USUÁRIO",
      corpo: `Excluir <strong>${u.email}</strong> definitivamente?<br><br>` +
        `<span style='color:var(--red)'>⚠ Ação irreversível:</span> a conta, ` +
        `<strong>${u.itens}</strong> item(ns) monitorado(s) e TODO o histórico ` +
        `de preços e alertas dele serão apagados em cascata.`,
      icone: "✕", isDanger: true,
      cb: async () => {
        setOcupadoId(u.id);
        try {
          const data = await chamarApiUsuarios({ acao: "excluir", user_id: u.id });
          const r = data.removed || {};
          showToast(`✓ ${u.email} excluído (${r.itens || 0} itens, ${r.leituras || 0} leituras, ${r.alertas || 0} alertas).`, "ok");
          carregarUsuarios();
        } catch (err) {
          showToast("Erro ao excluir usuário: " + err.message, "error");
        }
        setOcupadoId(null);
      },
    });
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
            <span>›</span><span>Usuários</span>
          </nav>

          <div>
            <div className="page-title">USUÁRIOS</div>
            <div className="page-subtitle">Gestão de acesso — visível apenas para administradores</div>
          </div>

          {/* LISTAGEM */}
          <div className="form-card" data-label="USUÁRIOS CADASTRADOS">
            {carregando ? (
              <div className="users-empty">Carregando usuários…</div>
            ) : !usuarios.length ? (
              <div className="users-empty">Nenhum usuário encontrado.</div>
            ) : (
              <div className="users-scroll">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Papel</th>
                      <th>Último acesso</th>
                      <th>Status</th>
                      <th>Itens</th>
                      {telegramOk && <th>Telegram</th>}
                      {verBancoOk && <th>Banco</th>}
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => {
                      const souEu = u.id === user?.id;
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="u-email">
                              <span>{u.email} {souEu && <span className="u-voce">· VOCÊ</span>}</span>
                              {u.nome && <span className="ue-nome">{u.nome}</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${u.nivel >= 2 ? "b-admin" : "b-normal"}`}>
                              {u.nivel >= 2 ? "Admin" : "Normal"}
                            </span>
                          </td>
                          <td>{u.ultimo_acesso ? dataHoraBRT(u.ultimo_acesso, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "nunca"}</td>
                          <td>
                            <span className={`badge ${u.confirmado ? "b-ativo" : "b-pend"}`}>
                              {u.confirmado ? "Ativo" : "Não confirmado"}
                            </span>
                          </td>
                          <td>{u.itens}</td>
                          {telegramOk && (
                            <td>
                              <button
                                className={`tg-toggle${u.notificar_telegram ? " on" : ""}`}
                                disabled={ocupadoId === u.id}
                                title="Ativar/desativar o bot do Telegram para os alertas deste usuário"
                                onClick={() => alternarTelegram(u)}
                              >
                                {u.notificar_telegram ? "✓ ON" : "OFF"}
                              </button>
                            </td>
                          )}
                          {verBancoOk && (
                            <td>
                              <button
                                className={`tg-toggle${u.ver_banco ? " on" : ""}`}
                                disabled={!souDono || ocupadoId === u.id}
                                title={souDono
                                  ? "Liberar/revogar o acesso deste usuário à página /admin (métricas do banco)"
                                  : "Só o dono da conta pode liberar o acesso ao banco"}
                                onClick={() => alternarVerBanco(u)}
                              >
                                {u.ver_banco ? "✓ ON" : "OFF"}
                              </button>
                            </td>
                          )}
                          <td>
                            <button
                              className="btn-excluir"
                              disabled={souEu || ocupadoId === u.id}
                              title={souEu ? "Não é possível excluir a própria conta" : "Excluir usuário e todos os dados dele"}
                              onClick={() => excluirUsuario(u)}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
