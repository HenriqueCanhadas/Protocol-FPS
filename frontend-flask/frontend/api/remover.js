/**
 * api/remover.js — Vercel Serverless Function
 *
 * Remove produtos ('produto') ou registros de histórico ('historico')
 * usando a SUPABASE_SERVICE_KEY, que ignora o RLS. A SERVICE_KEY permanece
 * exclusivamente no servidor — nunca vai ao browser nem ao bundle JS.
 *
 * Espelho server-side de app.py:/api/remover (Flask em dev, Vercel em prod).
 * Mantenha os dois em sincronia.
 *
 * AUTORIZAÇÃO (Sprint 5 — multiusuário): exige Authorization: Bearer
 * <access_token do Supabase>. O token é validado e a remoção só é
 * permitida para itens do próprio usuário — ou de qualquer usuário,
 * se o requisitante for admin (usuarios.nivel >= 2).
 *
 * Variáveis necessárias no painel Vercel (sem prefixo VITE_):
 *   SUPABASE_URL         → ex: https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY → service_role key (acesso total, ignora RLS)
 *
 * Body JSON: { "tipo": "produto" | "historico", "ids": [...] }
 */

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

/**
 * Valida o access_token e retorna { uid, isAdmin }.
 * Pré-migração (tabela usuarios inexistente) → modo legado: todo
 * autenticado é tratado como admin (modelo compartilhado antigo).
 */
async function usuarioDoToken(url, key, accessToken) {
  const resp = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  const { id: uid } = await resp.json();
  if (!uid) return null;

  try {
    const perfil = await supabaseGet(url, key, `usuarios?id=eq.${uid}&select=nivel`);
    const nivel = perfil.length ? perfil[0].nivel : 1;
    return { uid, isAdmin: nivel >= 2 };
  } catch {
    return { uid, isAdmin: true }; // migração multiusuário pendente
  }
}

/**
 * Garante que todos os ids pertencem ao usuário (admin remove qualquer um).
 * Retorna true se autorizado. Pré-migração (itens sem user_id) → permite.
 */
async function autorizarRemocao(url, key, uid, isAdmin, tipo, ids) {
  if (isAdmin) return true;
  const valores = ids.map((i) => `"${String(i).replace(/"/g, "")}"`).join(",");
  let donos;
  try {
    if (tipo === "historico") {
      const linhas = await supabaseGet(
        url, key, `historico_precos?id=in.(${valores})&select=id,itens(user_id)`);
      donos = new Set(linhas.map((l) => l.itens?.user_id));
    } else {
      const linhas = await supabaseGet(url, key, `itens?id=in.(${valores})&select=id,user_id`);
      donos = new Set(linhas.map((l) => l.user_id));
    }
  } catch {
    return true; // coluna user_id ainda não existe (migração pendente)
  }
  donos.delete(uid);
  return donos.size === 0;
}

async function supabaseDelete(url, key, table, column, ids) {
  const valores = ids.map((i) => `"${String(i).replace(/"/g, "")}"`).join(",");
  const endpoint = `${url}/rest/v1/${table}?${column}=in.(${valores})`;
  const resp = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      apikey:          key,
      Authorization:   `Bearer ${key}`,
      Prefer:          "return=representation", // devolve as linhas removidas
      "Content-Type":  "application/json",
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    const err = new Error(body || `Erro ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
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

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { tipo, ids } = body || {};

  if (tipo !== "produto" && tipo !== "historico") {
    return res.status(400).json({ error: "tipo inválido (use 'produto' ou 'historico')" });
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "nenhum id informado" });
  }

  // ── Autorização: dono do item ou admin (usuarios.nivel >= 2) ──
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Não autenticado — faça login para remover." });
  }
  const quem = await usuarioDoToken(url, key, token);
  if (!quem) {
    return res.status(401).json({ error: "Sessão inválida ou expirada — faça login novamente." });
  }
  if (!(await autorizarRemocao(url, key, quem.uid, quem.isAdmin, tipo, ids))) {
    return res.status(403).json({
      error: "Permissão negada: só é possível remover itens do próprio usuário.",
    });
  }

  try {
    let removidos;
    if (tipo === "historico") {
      // FK: remove alertas que referenciam estes registros de histórico
      await supabaseDelete(url, key, "alertas", "historico_id", ids);
      removidos = await supabaseDelete(url, key, "historico_precos", "id", ids);
    } else {
      await supabaseDelete(url, key, "alertas", "item_id", ids);
      await supabaseDelete(url, key, "historico_precos", "item_id", ids);
      removidos = await supabaseDelete(url, key, "itens", "id", ids);
    }
    return res.status(200).json({ ok: true, removed: removidos });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
