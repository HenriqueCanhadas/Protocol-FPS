// services/admin.service.js — PROTOCOL FPS
// Métricas operacionais do banco (Sprint 32, admin-only) via a RPC
// admin_estatisticas() — SECURITY DEFINER, checa is_admin() no próprio
// banco (migration sprint32_admin_estatisticas.sql).
import { getSupabase } from "@/services/supabase";

/**
 * Busca contagens de linhas, tamanho das tabelas e saúde da coleta
 * (última leitura geral e por loja, com leituras nas últimas 24h).
 * Retorna null em caso de erro (ex.: migração ainda não rodada — a RPC
 * não existe no banco) ou se o usuário não for admin (RPC lança exceção).
 */
export async function buscarEstatisticas() {
  const sb = await getSupabase();
  const { data, error } = await sb.rpc("admin_estatisticas");
  if (error) return null;
  return data;
}
