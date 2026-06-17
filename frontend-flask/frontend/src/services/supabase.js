/**
 * services/supabase.js — PROTOCOL FPS
 * Inicializa o client Supabase buscando config do Flask (/api/config)
 * em desenvolvimento, ou das variáveis de ambiente do Vite em produção.
 */
import { createClient } from "@supabase/supabase-js";

let _client = null;

async function fetchConfig() {
  // Produção: Vite injeta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
  if (import.meta.env.VITE_SUPABASE_URL) {
    return {
      SUPABASE_URL:      import.meta.env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      GITHUB_TOKEN:      import.meta.env.VITE_GITHUB_TOKEN      || "",
      GITHUB_OWNER:      import.meta.env.VITE_GITHUB_OWNER      || "",
      GITHUB_REPO:       import.meta.env.VITE_GITHUB_REPO       || "",
      GITHUB_WORKFLOW:   import.meta.env.VITE_GITHUB_WORKFLOW    || "coletar.yml",
    };
  }
  // Desenvolvimento: busca do Flask
  const resp = await fetch("/api/config");
  return resp.json();
}

// Config carregada uma vez e reutilizada
let _config = null;

export async function getConfig() {
  if (!_config) _config = await fetchConfig();
  return _config;
}

export async function getSupabase() {
  if (_client) return _client;
  const cfg = await getConfig();
  _client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  return _client;
}
