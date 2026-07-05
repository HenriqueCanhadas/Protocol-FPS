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
 */

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
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = new Error(await resp.text());
    err.status = resp.status;
    throw err;
  }
  return resp.json().catch(() => ({}));
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

  if (acao !== "criar" && acao !== "trocar_senha") {
    return res.status(400).json({ error: "acao inválida (use 'criar' ou 'trocar_senha')" });
  }
  if (senha.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  try {
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
