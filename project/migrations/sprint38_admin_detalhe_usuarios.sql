-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 38 (todo:233) — estende admin_estatisticas() com o detalhamento
-- por item/usuário: para cada item cadastrado, quem é o dono e quantas
-- leituras (historico_precos) esse item já acumulou. As seções agregadas
-- da Sprint 32/32c (contagens/tamanho/coleta) continuam intactas.
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
    ),
    -- Sprint 38: um item por linha — quem é o dono, loja, categoria e
    -- quantas leituras esse item específico já acumulou em historico_precos.
    'itens_detalhe', (
      select coalesce(jsonb_agg(x order by x.usuario, x.item), '[]'::jsonb)
      from (
        select us.email       as usuario,
               i.nome_na_loja as item,
               l.nome         as loja,
               p.nome         as categoria,
               i.monitorando  as monitorando,
               (select count(*) from historico_precos hp where hp.item_id = i.id) as leituras
          from itens i
          join usuarios us on us.id = i.user_id
          join lojas    l  on l.id  = i.loja_id
          join produtos p  on p.id  = i.produto_id
      ) x
    )
  ) into resultado;

  return resultado;
end;
$$;

grant execute on function public.admin_estatisticas() to authenticated;

commit;

-- ── Conferência ──────────────────────────────────────────────────────────
-- Mesma ressalva das migrações anteriores: NÃO chame a RPC aqui pelo SQL
-- Editor (sem contexto de auth.uid(), pode_ver_banco() dá falso). Confira
-- só que a função existe; a conferência real é abrir /admin logado.
select proname, prosecdef from pg_proc where proname = 'admin_estatisticas';
