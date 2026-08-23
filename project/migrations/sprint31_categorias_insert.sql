-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 31 (todo) — Permite criar novas categorias de produto pela tela
-- Novo Produto (antes só existia a leitura pública/autenticada de
-- `produtos`; não havia política de INSERT, então qualquer tentativa do
-- frontend seria bloqueada pelo RLS).
--
-- Rodar MANUALMENTE no SQL Editor do Supabase. Idempotente.
--
-- Decisão: `produtos` é dado de referência COMPARTILHADO entre todos os
-- usuários (mesma natureza de `lojas`), então o INSERT fica restrito a
-- administradores (public.is_admin(), criada na Sprint 5) — evita que um
-- usuário comum polua a taxonomia de categorias vista por todo mundo.
-- ═══════════════════════════════════════════════════════════════════════

begin;

alter table public.produtos enable row level security;

drop policy if exists produtos_insert_admin on public.produtos;
create policy produtos_insert_admin
  on public.produtos
  for insert
  to authenticated
  with check (public.is_admin());

commit;

-- ── Conferência ──────────────────────────────────────────────────────────
select policyname, cmd, roles, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'produtos';
