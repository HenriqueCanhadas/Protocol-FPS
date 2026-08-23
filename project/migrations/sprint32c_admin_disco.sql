-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 32c (pedido do usuário, follow-up da Sprint 32) — enriquece
-- admin_estatisticas() com o TAMANHO REAL do banco inteiro
-- (pg_database_size, inclui auth/storage/índices — não só as 6 tabelas
-- do app) e reestrutura 'tamanho.tabelas' de objeto fixo para array com
-- bytes crus (para a barra proporcional por tabela) + pretty (exibição).
-- Necessário para o medidor "quanto de disco ainda tenho disponível" na
-- página /admin, comparando o banco inteiro contra a cota do plano
-- Supabase (a cota em si não é uma informação do Postgres — fica
-- hardcoded no frontend, ver ADMIN_QUOTA_BYTES em pages/Admin.jsx).
--
-- Rodar MANUALMENTE no SQL Editor do Supabase. Idempotente.
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
      -- Banco inteiro (auth/storage/índices/WAL incluídos) — é o número que
      -- conta contra a cota do plano Supabase, não a soma das 6 tabelas do
      -- app abaixo (que é só o que o PROTOCOL FPS ocupa dentro do banco).
      'banco_completo_bytes', pg_database_size(current_database()),
      'banco_completo',       pg_size_pretty(pg_database_size(current_database())),
      'tabelas', (
        select jsonb_agg(jsonb_build_object(
                 'tabela', t.nome, 'bytes', t.bytes, 'pretty', pg_size_pretty(t.bytes))
               order by t.bytes desc)
          from (values
                 ('itens',            pg_total_relation_size('itens')),
                 ('historico_precos', pg_total_relation_size('historico_precos')),
                 ('alertas',          pg_total_relation_size('alertas')),
                 ('usuarios',         pg_total_relation_size('usuarios')),
                 ('produtos',         pg_total_relation_size('produtos')),
                 ('lojas',            pg_total_relation_size('lojas'))
               ) as t(nome, bytes)
      )
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
