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
 *   GITHUB_BRANCH   → opcional; branch alvo do dispatch (default: main)
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
  // Branch alvo do workflow_dispatch (default: main). Configure GITHUB_BRANCH
  // para testar inputs novos em outra branch antes do merge — o GitHub responde
  // 422 se o workflow da branch alvo não conhecer os inputs enviados.
  const branch   = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) {
    return res.status(500).json({
      error:
        "Variáveis GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO não configuradas no servidor.",
    });
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;

  // Escopo opcional no corpo (mesma semântica do main.py):
  //   item_id                    → coleta pontual (só aquele produto; tem precedência)
  //   item_ids                   → coleta em LISTA (Sprint 14): os itens visíveis
  //                                na lista filtrada do Dashboard — array JSON ou
  //                                string com IDs separados por vírgula
  //   categoria / loja / user_id → coleta segmentada (combináveis: ex. GPUs
  //                                da Kabum, ou só os itens do usuário logado)
  //   nada                       → coleta completa (todos os monitorados)
  let reqBody = req.body;
  if (typeof reqBody === "string") {
    try { reqBody = JSON.parse(reqBody); } catch { reqBody = {}; }
  }
  const itemId    = reqBody?.item_id;
  let   itemIds   = reqBody?.item_ids;
  const categoria = reqBody?.categoria;
  const loja      = reqBody?.loja;
  const userId    = reqBody?.user_id;
  if (Array.isArray(itemIds)) {
    itemIds = itemIds.map((i) => String(i).trim()).filter(Boolean).join(",");
  }
  const dispatch  = { ref: branch };
  const inputs = {};
  if (itemId) {
    inputs.item_id = String(itemId);
  } else if (itemIds) {
    inputs.item_ids = String(itemIds);
  } else {
    if (categoria) inputs.categoria = String(categoria);
    if (loja)      inputs.loja      = String(loja);
    if (userId)    inputs.user_id   = String(userId);
  }
  if (Object.keys(inputs).length) dispatch.inputs = inputs;

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept:                 "application/vnd.github+json",
        Authorization:          `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type":         "application/json",
      },
      body: JSON.stringify(dispatch),
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
      return res.status(422).json({
        error:
          `Dispatch rejeitado (422): branch "${branch}" inexistente OU o workflow ` +
          `dessa branch não define os inputs enviados. Ajuste GITHUB_BRANCH ` +
          `(ex.: Duplicate-Main para testar antes do merge).`,
      });

    return res.status(resp.status).json({ error: body });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}