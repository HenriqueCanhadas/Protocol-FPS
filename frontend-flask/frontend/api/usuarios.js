/**
 * api/usuarios.js — Vercel Serverless Function
 *
 * Gestão de usuários — SOMENTE ADMIN (usuarios.nivel >= 2).
 * Usa a admin API do Supabase com a SUPABASE_SERVICE_KEY, que permanece
 * exclusivamente no servidor — nunca vai ao browser nem ao bundle JS.
 *
 * Espelho server-side de app.py:/api/usuarios (Flask em dev, Vercel em prod).
 * Mantenha os dois em sincronia.
 *
 * Variáveis necessárias no painel Vercel (sem prefixo VITE_):
 *   SUPABASE_URL         → ex: https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY → service_role key (acesso total)
 *
 * Body JSON:
 *   { "acao": "criar",        "email": ..., "senha": ..., "nivel": 1|2 }
 *   { "acao": "trocar_senha", "user_id": ..., "senha": ... }
 *   { "acao": "listar" }
 *   { "acao": "telegram",     "user_id": ..., "ativo": true|false }
 *   { "acao": "ver_banco",    "user_id": ..., "ativo": true|false }  (só o dono da conta)
 *   { "acao": "excluir",      "user_id": ... }
 */

// Único email autorizado a liberar/revogar o acesso a /admin (ver_banco) de
// outra pessoa (Sprint 32b, pedido do usuário) — checagem própria deste
// endpoint, não é nível de RLS.
const DONO_EMAIL = "pedrosacanhadas@gmail.com";

async function usuarioDoToken(url, key, accessToken) {
  const resp = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  const { id: uid } = await resp.json();
  if (!uid) return null;

  const perfilResp = await fetch(`${url}/rest/v1/usuarios?id=eq.${uid}&select=nivel`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!perfilResp.ok) return { uid, isAdmin: false };
  const perfil = await perfilResp.json();
  return { uid, isAdmin: perfil.length ? perfil[0].nivel >= 2 : false };
}

async function adminApi(url, key, path, data, method = "POST") {
  const resp = await fetch(`${url}/auth/v1${path}`, {
    method,
    headers: {
      apikey:         key,
      Authorization:  `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    ...(data !== undefined && data !== null ? { body: JSON.stringify(data) } : {}),
  });
  if (!resp.ok) {
    const err = new Error(await resp.text());
    err.status = resp.status;
    throw err;
  }
  return resp.json().catch(() => ({}));
}

// GET server-side via PostgREST com a SERVICE_KEY (ignora RLS)
async function supabaseGet(url, key, path) {
  const resp = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!resp.ok) {
    const err = new Error(await resp.text());
    err.status = resp.status;
    throw err;
  }
  return resp.json();
}

// DELETE server-side; retorna a quantidade de linhas removidas
async function supabaseDelete(url, key, table, column, ids) {
  const valores = ids.map((i) => `"${String(i).replaceAll('"', "")}"`).join(",");
  const resp = await fetch(`${url}/rest/v1/${table}?${column}=in.(${valores})`, {
    method: "DELETE",
    headers: {
      apikey:         key,
      Authorization:  `Bearer ${key}`,
      Prefer:         "return=representation",
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) {
    const err = new Error(await resp.text());
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json().catch(() => []);
  return Array.isArray(data) ? data.length : 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    return res.status(500).json({
      error: "SUPABASE_URL / SUPABASE_SERVICE_KEY não configuradas no servidor.",
    });
  }

  // ── Autorização: exige sessão de ADMIN (sem modo legado aqui) ──
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Não autenticado — faça login para gerenciar usuários." });
  }
  const quem = await usuarioDoToken(url, key, token);
  if (!quem) {
    return res.status(401).json({ error: "Sessão inválida ou expirada — faça login novamente." });
  }
  if (!quem.isAdmin) {
    return res.status(403).json({ error: "Permissão negada: apenas administradores gerenciam usuários." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { acao } = body || {};
  const senha = body?.senha || "";

  if (!["criar", "trocar_senha", "listar", "telegram", "ver_banco", "excluir"].includes(acao)) {
    return res.status(400).json({ error: "acao inválida (use 'criar', 'trocar_senha', 'listar', 'telegram', 'ver_banco' ou 'excluir')" });
  }
  if (["criar", "trocar_senha"].includes(acao) && senha.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  try {
    if (acao === "listar") {
      // Perfis (usuarios) — com fallback caso as migrações sprint9
      // (notificar_telegram) e/ou sprint32b (ver_banco) ainda não tenham
      // rodado no banco.
      let telegramOk = true;
      let verBancoOk = true;
      let perfis;
      try {
        perfis = await supabaseGet(url, key,
          "usuarios?select=id,email,nome,nivel,notificar_telegram,ver_banco&order=email.asc");
      } catch {
        verBancoOk = false;
        try {
          perfis = await supabaseGet(url, key,
            "usuarios?select=id,email,nome,nivel,notificar_telegram&order=email.asc");
        } catch {
          telegramOk = false;
          perfis = await supabaseGet(url, key, "usuarios?select=id,email,nome,nivel&order=email.asc");
        }
      }

      // Contagem de itens por dono — paginada (teto de 1000 do PostgREST)
      const contagem = {};
      for (let de = 0; ; de += 1000) {
        const pagina = await supabaseGet(url, key, `itens?select=user_id&limit=1000&offset=${de}`);
        for (const linha of pagina) {
          contagem[linha.user_id] = (contagem[linha.user_id] || 0) + 1;
        }
        if (pagina.length < 1000) break;
      }

      // auth.users (último acesso, confirmação) — admin API paginada
      const authMap = {};
      for (let page = 1; ; page++) {
        const resp = await adminApi(url, key, `/admin/users?page=${page}&per_page=100`, null, "GET");
        const users = resp.users || [];
        for (const u of users) authMap[u.id] = u;
        if (users.length < 100) break;
      }

      const usuarios = perfis.map((p) => {
        const au = authMap[p.id] || {};
        return {
          id:                 p.id,
          email:              p.email,
          nome:               p.nome ?? null,
          nivel:              p.nivel ?? 1,
          notificar_telegram: telegramOk ? (p.notificar_telegram ?? false) : null,
          ver_banco:          verBancoOk ? (p.ver_banco ?? false) : null,
          itens:              contagem[p.id] || 0,
          criado_em:          au.created_at || null,
          ultimo_acesso:      au.last_sign_in_at || null,
          confirmado:         Boolean(au.email_confirmed_at),
        };
      });
      return res.status(200).json({ ok: true, usuarios, telegram_disponivel: telegramOk, ver_banco_disponivel: verBancoOk });
    }

    if (acao === "telegram") {
      const userId = String(body?.user_id || "").trim();
      if (!userId) {
        return res.status(400).json({ error: "user_id não informado." });
      }
      const ativo = Boolean(body?.ativo);
      const resp = await fetch(`${url}/rest/v1/usuarios?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          apikey:         key,
          Authorization:  `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificar_telegram: ativo }),
      });
      if (!resp.ok) {
        if (resp.status === 400) {
          return res.status(400).json({
            error: "Coluna notificar_telegram ausente — rode a migração " +
                   "sprint9_alertas_por_usuario.sql no SQL Editor do Supabase.",
          });
        }
        const err = new Error(await resp.text());
        err.status = resp.status;
        throw err;
      }
      return res.status(200).json({ ok: true, notificar_telegram: ativo });
    }

    if (acao === "ver_banco") {
      // Só o dono da conta libera/revoga o acesso de outra pessoa a
      // /admin — checagem própria deste endpoint, não é nível de RLS.
      const chamador = await supabaseGet(url, key, `usuarios?id=eq.${quem.uid}&select=email`);
      const emailChamador = (chamador[0]?.email || "").toLowerCase();
      if (emailChamador !== DONO_EMAIL) {
        return res.status(403).json({ error: "Permissão negada: só o dono da conta pode liberar o acesso ao banco." });
      }
      const userId = String(body?.user_id || "").trim();
      if (!userId) {
        return res.status(400).json({ error: "user_id não informado." });
      }
      const ativo = Boolean(body?.ativo);
      const resp = await fetch(`${url}/rest/v1/usuarios?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          apikey:         key,
          Authorization:  `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ver_banco: ativo }),
      });
      if (!resp.ok) {
        if (resp.status === 400) {
          return res.status(400).json({
            error: "Coluna ver_banco ausente — rode a migração " +
                   "sprint32b_ver_banco.sql no SQL Editor do Supabase.",
          });
        }
        const err = new Error(await resp.text());
        err.status = resp.status;
        throw err;
      }
      return res.status(200).json({ ok: true, ver_banco: ativo });
    }

    if (acao === "excluir") {
      const userId = String(body?.user_id || "").trim();
      if (!userId) {
        return res.status(400).json({ error: "user_id não informado." });
      }
      if (userId === quem.uid) {
        return res.status(400).json({ error: "Não é possível excluir a própria conta." });
      }
      const alvo = await supabaseGet(url, key, `usuarios?id=eq.${userId}&select=id,email`);
      if (!alvo.length) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      // Cascata manual (não há ON DELETE CASCADE em itens/histórico/alertas):
      // alertas → historico_precos → itens → conta auth (esta cascateia p/ usuarios)
      const itemIds = [];
      for (let de = 0; ; de += 1000) {
        const pagina = await supabaseGet(url, key,
          `itens?user_id=eq.${userId}&select=id&limit=1000&offset=${de}`);
        itemIds.push(...pagina.map((l) => l.id));
        if (pagina.length < 1000) break;
      }

      const removidos = { itens: 0, leituras: 0, alertas: 0 };
      if (itemIds.length) {
        removidos.alertas  = await supabaseDelete(url, key, "alertas", "item_id", itemIds);
        removidos.leituras = await supabaseDelete(url, key, "historico_precos", "item_id", itemIds);
        removidos.itens    = await supabaseDelete(url, key, "itens", "id", itemIds);
      }
      await adminApi(url, key, `/admin/users/${userId}`, null, "DELETE");

      return res.status(200).json({ ok: true, email: alvo[0].email, removed: removidos });
    }

    if (acao === "criar") {
      const email = String(body?.email || "").trim().toLowerCase();
      const nivel = Number(body?.nivel || 1);
      if (!email.includes("@") || !email.includes(".")) {
        return res.status(400).json({ error: "Email inválido." });
      }
      if (nivel !== 1 && nivel !== 2) {
        return res.status(400).json({ error: "nivel inválido (1=normal, 2=admin)." });
      }

      const novo = await adminApi(url, key, "/admin/users", {
        email, password: senha, email_confirm: true,
      });
      if (!novo.id) {
        return res.status(502).json({ error: "Supabase não retornou o id do usuário." });
      }

      // O trigger cria o perfil com nivel 1; promove se for admin
      if (nivel === 2) {
        await fetch(`${url}/rest/v1/usuarios?id=eq.${novo.id}`, {
          method: "PATCH",
          headers: {
            apikey:         key,
            Authorization:  `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nivel: 2 }),
        });
      }

      return res.status(200).json({ ok: true, user_id: novo.id, nivel });
    }

    // trocar_senha
    const userId = String(body?.user_id || "").trim();
    if (!userId) {
      return res.status(400).json({ error: "user_id não informado." });
    }
    await adminApi(url, key, `/admin/users/${userId}`, { password: senha }, "PUT");
    return res.status(200).json({ ok: true });
  } catch (err) {
    let detail = err.message;
    if (err.status === 422 && acao === "criar") {
      detail = "Já existe um usuário com esse email (422).";
    }
    return res.status(err.status || 500).json({ error: detail });
  }
}
