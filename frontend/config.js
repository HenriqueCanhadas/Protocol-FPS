/**
 * config.js — PROTOCOL FPS
 * Configuração centralizada. Em produção, os placeholders %%VAR%%
 * são substituídos automaticamente pelo build.py (Netlify/Vercel)
 * ou pelo serve.py (desenvolvimento local).
 *
 * Variáveis disponíveis:
 *   SUPABASE_URL        → URL do projeto Supabase
 *   SUPABASE_ANON_KEY   → Chave pública do Supabase
 *   GITHUB_TOKEN        → Personal Access Token (permissão: actions:write)
 *   GITHUB_OWNER        → Seu usuário ou org do GitHub (ex: "HenriqueCanhadas")
 *   GITHUB_REPO         → Nome do repositório (ex: "protocol-fps")
 *   GITHUB_WORKFLOW     → Nome do arquivo do workflow (ex: "coletar.yml")
 */

window.APP_CONFIG = {
  SUPABASE_URL:      "%%SUPABASE_URL%%",
  SUPABASE_ANON_KEY: "%%SUPABASE_ANON_KEY%%",

  // GitHub Actions — disparo manual do botão "COLETAR AGORA"
  GITHUB_TOKEN:    "%%GITHUB_TOKEN%%",      // PAT com scope: actions:write
  GITHUB_OWNER:    "%%GITHUB_OWNER%%",      // ex: "HenriqueCanhadas"
  GITHUB_REPO:     "%%GITHUB_REPO%%",       // ex: "protocol-fps"
  GITHUB_WORKFLOW: "%%GITHUB_WORKFLOW%%",   // ex: "coletar.yml"
};

(function validateConfig() {
  const c = window.APP_CONFIG;
  const missing = Object.entries(c)
    .filter(([, v]) => v.startsWith("%%"))
    .map(([k]) => k);

  if (missing.length > 0) {
    const urlMeta  = document.querySelector('meta[name="supabase-url"]');
    const keyMeta  = document.querySelector('meta[name="supabase-anon-key"]');
    if (urlMeta && keyMeta) {
      c.SUPABASE_URL      = urlMeta.content;
      c.SUPABASE_ANON_KEY = keyMeta.content;
    } else {
      console.warn(
        "[PROTOCOL FPS] Variáveis não configuradas:", missing.join(", "),
        "\nVeja frontend/config.js para instruções."
      );
    }
  }
})();