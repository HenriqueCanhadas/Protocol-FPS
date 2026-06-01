/**
 * config.js — PROTOCOL FPS
 * Configuração centralizada. Em produção, injete as variáveis via
 * seu servidor/CI (Netlify env vars, Vercel env vars, GitHub Pages +
 * build step) em vez de hardcodá-las aqui.
 *
 * Para desenvolvimento local, crie um arquivo `.env` na raiz do
 * frontend e use um bundler (Vite, Parcel) ou um script de build
 * que substitua os placeholders abaixo.
 *
 * Variáveis esperadas (espelho do .env Python):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 */

window.APP_CONFIG = {
  SUPABASE_URL:      "%%SUPABASE_URL%%",      // substituído no build
  SUPABASE_ANON_KEY: "%%SUPABASE_ANON_KEY%%", // substituído no build
};

/**
 * Retorna a config com fallback para valores padrão de dev.
 * Se os placeholders não foram substituídos (dev sem build),
 * lança erro para avisar o desenvolvedor.
 */
(function validateConfig() {
  const c = window.APP_CONFIG;
  const missing = Object.entries(c)
    .filter(([, v]) => v.startsWith("%%"))
    .map(([k]) => k);

  if (missing.length > 0) {
    // Dev fallback: lê de meta tags injetadas pelo script de dev
    const urlMeta  = document.querySelector('meta[name="supabase-url"]');
    const keyMeta  = document.querySelector('meta[name="supabase-anon-key"]');
    if (urlMeta && keyMeta) {
      c.SUPABASE_URL      = urlMeta.content;
      c.SUPABASE_ANON_KEY = keyMeta.content;
    } else {
      console.error(
        "[PROTOCOL FPS] Variáveis de ambiente não configuradas:",
        missing.join(", "),
        "\nVeja frontend/README.md para instruções de setup."
      );
    }
  }
})();