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
 * Variáveis necessárias no painel Vercel (sem prefixo VITE_):
 *   SUPABASE_URL         → ex: https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY → service_role key (acesso total, ignora RLS)
 *
 * Body JSON: { "tipo": "produto" | "historico", "ids": [...] }
 */

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
