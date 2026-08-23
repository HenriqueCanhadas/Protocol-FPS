-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 32 (todo:218) — RPC admin-only com métricas operacionais do banco:
-- contagens de linhas, tamanho das tabelas principais e saúde da coleta
-- (última leitura geral e por loja).
--
-- Rodar MANUALMENTE no SQL Editor do Supabase. Idempotente.
--
-- Decisão: uma única RPC (SECURITY DEFINER, mesmo padrão de is_admin() e
-- verificar_alertas() da Sprint 5) em vez de várias queries client-side —
-- evita expor pg_total_relation_size() via policy de RLS (não faz sentido
-- em nível de linha) e mantém a checagem de admin num só lugar. A função
-- verifica is_admin() internamente e lança exceção para não-admin, então
-- mesmo que alguém descubra o nome da RPC não consegue chamá-la sem ser
-- administrador.
-- ═══════════════════════════════════════════════════════════════════════

begin;

create or replace function public.admin_estatisticas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado jsonb;
begin
  if not public.is_admin() then
    raise exception 'acesso negado: requer administrador';
  end if;

  select jsonb_build_object(
    'contagens', jsonb_build_object(
      'itens_total',       (select count(*) from itens),
      'itens_monitorando', (select count(*) from itens where monitorando = true),
      'itens_pausados',    (select count(*) from itens where monitorando = false),
      'leituras_total',    (select count(*) from historico_precos),
      'alertas_total',     (select count(*) from alertas),
      'alertas_hoje',      (
        select count(*) from alertas
         where (criado_em at time zone 'America/Sao_Paulo')::date =
               (now()      at time zone 'America/Sao_Paulo')::date
      ),
      'usuarios_total',    (select count(*) from usuarios)
    ),
    'tamanho', jsonb_build_object(
      'total', pg_size_pretty(
        pg_total_relation_size('itens') + pg_total_relation_size('historico_precos') +
        pg_total_relation_size('alertas') + pg_total_relation_size('usuarios') +
        pg_total_relation_size('produtos') + pg_total_relation_size('lojas')
      ),
      'itens',            pg_size_pretty(pg_total_relation_size('itens')),
      'historico_precos', pg_size_pretty(pg_total_relation_size('historico_precos')),
      'alertas',          pg_size_pretty(pg_total_relation_size('alertas')),
      'usuarios',         pg_size_pretty(pg_total_relation_size('usuarios')),
      'produtos',         pg_size_pretty(pg_total_relation_size('produtos')),
      'lojas',            pg_size_pretty(pg_total_relation_size('lojas'))
    ),
    'coleta', jsonb_build_object(
      'ultima_geral', (select max(coletado_em) from historico_precos),
      'por_loja', (
        select coalesce(jsonb_agg(x order by x.loja), '[]'::jsonb)
        from (
          select l.nome as loja,
                 max(hp.coletado_em) as ultima_coleta,
                 count(hp.*) filter (where hp.coletado_em >= now() - interval '24 hours') as leituras_24h
            from lojas l
            left join itens i on i.loja_id = l.id
            left join historico_precos hp on hp.item_id = i.id
           group by l.nome
        ) x
      )
    )
  ) into resultado;

  return resultado;
end;
$$;

grant execute on function public.admin_estatisticas() to authenticated;

commit;

-- ── Conferência ──────────────────────────────────────────────────────────
-- NÃO chame public.admin_estatisticas() aqui pelo SQL Editor: ele roda sem
-- contexto de auth.uid() (não é uma requisição autenticada via PostgREST),
-- então is_admin() dá falso mesmo para quem é admin no app — e a função
-- lança "acesso negado", como esperado (prova que a checagem funciona).
-- A conferência real é rodar como admin no app e abrir /admin.
-- Aqui, só confirme que a função e a permissão existem:
select proname, prosecdef from pg_proc where proname = 'admin_estatisticas';
select grantee, privilege_type from information_schema.role_routine_grants
 where routine_name = 'admin_estatisticas';
