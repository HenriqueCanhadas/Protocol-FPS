-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 32b (pedido do usuário, follow-up da Sprint 32/todo:218) —
-- restringe a página /admin (métricas do banco) a uma permissão própria
-- (usuarios.ver_banco), independente de "ser admin" (usuarios.nivel >= 2).
--
-- Decisão do usuário: por padrão só pedrosacanhadas@gmail.com (dono da
-- conta) enxerga /admin; só ele pode liberar o acesso para outra pessoa,
-- pela tela Usuários (novo toggle "Banco" — a checagem de que quem está
-- chamando é o dono fica no próprio endpoint /api/usuarios, não só na UI).
--
-- Rodar MANUALMENTE no SQL Editor do Supabase. Idempotente.
-- ═══════════════════════════════════════════════════════════════════════

begin;

alter table public.usuarios
  add column if not exists ver_banco boolean not null default false;

update public.usuarios
   set ver_banco = true
 where lower(email) = 'pedrosacanhadas@gmail.com';

-- pode_ver_banco(): mesmo padrão de is_admin() (Sprint 5) — SECURITY
-- DEFINER, sem recursão de RLS na própria tabela usuarios.
create or replace function public.pode_ver_banco()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and ver_banco = true
  );
$$;

-- admin_estatisticas() (Sprint 32) passa a checar pode_ver_banco() em vez
-- de is_admin() — mesma assinatura e corpo, só o gate de acesso muda.
create or replace function public.admin_estatisticas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado jsonb;
begin
  if not public.pode_ver_banco() then
    raise exception 'acesso negado: requer permissão de visualização do banco';
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
select email, nivel, ver_banco from public.usuarios order by email;
