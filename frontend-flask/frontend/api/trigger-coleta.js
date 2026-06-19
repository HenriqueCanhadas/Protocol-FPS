/**
 * api/trigger-coleta.js — Vercel Serverless Function
 *
 * Dispara o workflow_dispatch do GitHub Actions.
 * GITHUB_TOKEN permanece exclusivamente no servidor —
 * nunca é enviado ao browser nem aparece no bundle JS.
 *
 * Variáveis necessárias no painel Vercel (sem prefixo VITE_):
 *   GITHUB_TOKEN    → PAT com permissão actions:write
 *   GITHUB_OWNER    → ex: HenriqueCanhadas
 *   GITHUB_REPO     → ex: Protocol-FPS
 *   GITHUB_WORKFLOW → ex: coletar.yml
 *
 * Em desenvolvimento local, o Vite faz proxy de /api/* para o
 * Flask (localhost:5000), que tem o endpoint equivalente em app.py.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token    = process.env.GITHUB_TOKEN;
  const owner    = process.env.GITHUB_OWNER;
  const repo     = process.env.GITHUB_REPO;
  const workflow = process.env.GITHUB_WORKFLOW || "coletar.yml";

  if (!token || !owner || !repo) {
    return res.status(500).json({
      error:
        "Variáveis GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO não configuradas no servidor.",
    });
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept:                 "application/vnd.github+json",
        Authorization:          `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type":         "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    });

    if (resp.status === 204) {
      return res.status(200).json({ ok: true });
    }

    const body = await resp.text();

    if (resp.status === 401)
      return res.status(401).json({ error: "Token inválido ou expirado (401)." });
    if (resp.status === 404)
      return res.status(404).json({ error: `Workflow "${workflow}" não encontrado (404).` });
    if (resp.status === 422)
      return res.status(422).json({ error: 'Branch "main" não encontrada (422).' });

    return res.status(resp.status).json({ error: body });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}