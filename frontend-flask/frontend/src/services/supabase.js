/**
 * services/supabase.js — PROTOCOL FPS
 *
 * Inicializa o client Supabase buscando config do Flask (/api/config)
 * em desenvolvimento, ou das variáveis VITE_* em produção.
 *
 * SEGURANÇA: variáveis do GitHub Actions foram removidas daqui.
 * O disparo de coleta agora passa pelo endpoint server-side
 * /api/trigger-coleta (Flask em dev, Vercel Function em produção).
 */
import { createClient } from "@supabase/supabase-js";

let _client = null;
let _config = null;

async function fetchConfig() {
  // Produção: Vite injeta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no build
  if (import.meta.env.VITE_SUPABASE_URL) {
    return {
      SUPABASE_URL:      import.meta.env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
  }
  // Desenvolvimento: busca do Flask (que lê o .env da raiz)
  const resp = await fetch("/api/config");
  return resp.json();
}

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