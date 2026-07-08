-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 8 (todo:102 e todo:104) — Categoria "Diversos" + migração dos
-- dados legados Kabum para a estrutura atual.
--
-- Rodar MANUALMENTE no SQL Editor do Supabase (a SERVICE_KEY não executa
-- SQL arbitrário). Idempotente: pode ser re-executado sem duplicar nada —
-- re-executar também "completa" leituras novas que o coletor legado tenha
-- gravado nas tabelas antigas depois da primeira execução.
--
-- Fontes legadas (somente LEITURA — nada é alterado ou removido nelas):
--   • produtos_kabum          (22 itens; nome bem formatado, preco_estimado,
--                              created_at SEM timezone = hora local BRT)
--   • historico_precos_kabum  (leituras FK produto_id; preco NULL quando
--                              "Esgotado"; data_coleta SEM timezone = BRT)
--   • "Monitoramento Kabum"   (protótipo; 1 leitura por linha, keyed por url;
--                              data_coleta já timestamptz)
--   • "Menores Preços Kabum"  (protótipo; snapshot; data_coleta timestamptz)
--
-- Destino: itens + historico_precos, categoria DIVERSOS, dono
-- pedrosacanhadas@gmail.com, loja Kabum.
--
-- Decisões registradas:
--   • monitorando = false nos itens migrados (não inflar a coleta diária do
--     CI com ~23 itens; reativar por item na UI quando desejado).
--   • preco_meta = produtos_kabum.preco_estimado (era o preço-alvo do sistema
--     antigo; itens sem correspondência em produtos_kabum ficam sem meta).
--   • Leituras SEM preço real NÃO são migradas — a convenção do coletor
--     atual é "sem preço → sem linha". Isso cobre os DOIS sentinelas do
--     legado: preco NULL ("Esgotado" na fase 2) e preco = 0 ("esgotado"
--     no protótipo Monitoramento, TODAS as 2.570 linhas esgotadas usam 0).
--   • Timestamps sem timezone são interpretados como America/Sao_Paulo
--     (hora local do coletor legado) e convertidos para UTC.
--   • As tabelas legadas permanecem intactas (candidatas a limpeza futura,
--     ver project/banco.md §8).
--   • A constraint itens_url_key (URL única GLOBAL) é trocada por
--     unique (url, user_id): era um resquício pré-multiusuário — desde a
--     Sprint 5, usuários diferentes podem monitorar a MESMA URL (foi
--     exatamente o que barrou a 1ª execução desta migração: 2 URLs legadas
--     já existem como itens de outros usuários).
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- ── 0) Unicidade de URL por DONO (não mais global) ───────────────────────
-- Idempotente: dropa as duas versões se existirem e recria a composta.
alter table public.itens drop constraint if exists itens_url_key;
alter table public.itens drop constraint if exists itens_url_user_key;
alter table public.itens add constraint itens_url_user_key unique (url, user_id);

-- ── 1) Categoria DIVERSOS (idempotente; já criada via API em 07/07/2026) ──
insert into public.produtos (nome, categoria)
select 'Diversos', 'DIVERSOS'
where not exists (select 1 from public.produtos where categoria = 'DIVERSOS');

-- ── 2) Itens: um por URL distinta entre as 3 fontes legadas ──────────────
-- Nome e meta preferem produtos_kabum (prio 1); criado_em = data mais antiga
-- conhecida do item em qualquer fonte.
with refs as (
  select
    (select id from public.usuarios where email = 'pedrosacanhadas@gmail.com') as user_id,
    (select id from public.lojas    where nome  = 'Kabum')                     as loja_id,
    (select id from public.produtos where categoria = 'DIVERSOS')              as produto_id
),
fontes as (
  select url, nome, preco_estimado,
         (created_at at time zone 'America/Sao_Paulo') as criado_em, 1 as prio
  from public.produtos_kabum
  union all
  select url, max(nome), null::numeric, min(data_coleta), 2
  from public."Monitoramento Kabum"
  group by url
  union all
  select url, max(nome), null::numeric, min(data_coleta), 3
  from public."Menores Preços Kabum"
  group by url
),
consolidado as (
  select url,
         (array_agg(nome           order by prio))[1] as nome,
         (array_agg(preco_estimado order by prio))[1] as preco_meta,
         min(criado_em)                               as criado_em
  from fontes
  group by url
)
insert into public.itens
       (loja_id, produto_id, url, nome_na_loja, preco_meta, monitorando, criado_em, user_id)
select r.loja_id, r.produto_id, c.url, c.nome, c.preco_meta, false, c.criado_em, r.user_id
from consolidado c
cross join refs r
where not exists (
  select 1 from public.itens i
  where i.url = c.url and i.user_id = r.user_id
)
on conflict do nothing;

-- ── 3) Histórico ← historico_precos_kabum (via produtos_kabum.url) ───────
with refs as (
  select id as user_id from public.usuarios where email = 'pedrosacanhadas@gmail.com'
)
insert into public.historico_precos (item_id, preco, disponivel, coletado_em)
select distinct
       i.id,
       h.preco,
       (h.status ilike 'dispon%'),
       (h.data_coleta at time zone 'America/Sao_Paulo')
from public.historico_precos_kabum h
join public.produtos_kabum p on p.id = h.produto_id
join refs r on true
join public.itens i on i.url = p.url and i.user_id = r.user_id
where h.preco is not null and h.preco > 0
  and not exists (
    select 1 from public.historico_precos x
    where x.item_id     = i.id
      and x.coletado_em = (h.data_coleta at time zone 'America/Sao_Paulo')
      and x.preco       = h.preco
  )
on conflict do nothing;

-- ── 4) Histórico ← "Monitoramento Kabum" (1 leitura por linha) ───────────
-- "esgotado" aqui usa preco_atual = 0 como SENTINELA (não é preço real):
-- essas linhas NÃO migram, seguindo a convenção "sem preço → sem linha".
with refs as (
  select id as user_id from public.usuarios where email = 'pedrosacanhadas@gmail.com'
)
insert into public.historico_precos (item_id, preco, disponivel, coletado_em)
select distinct
       i.id,
       m.preco_atual,
       (m.status = 'disponivel'),
       m.data_coleta
from public."Monitoramento Kabum" m
join refs r on true
join public.itens i on i.url = m.url and i.user_id = r.user_id
where m.preco_atual is not null and m.preco_atual > 0
  and not exists (
    select 1 from public.historico_precos x
    where x.item_id     = i.id
      and x.coletado_em = m.data_coleta
      and x.preco       = m.preco_atual
  )
on conflict do nothing;

-- ── 5) Histórico ← "Menores Preços Kabum" (snapshot do protótipo) ────────
with refs as (
  select id as user_id from public.usuarios where email = 'pedrosacanhadas@gmail.com'
)
insert into public.historico_precos (item_id, preco, disponivel, coletado_em)
select distinct
       i.id,
       m.preco_atual,
       (m.status = 'disponivel'),
       m.data_coleta
from public."Menores Preços Kabum" m
join refs r on true
join public.itens i on i.url = m.url and i.user_id = r.user_id
where m.preco_atual is not null and m.preco_atual > 0
  and not exists (
    select 1 from public.historico_precos x
    where x.item_id     = i.id
      and x.coletado_em = m.data_coleta
      and x.preco       = m.preco_atual
  )
on conflict do nothing;

commit;

-- ── Conferência (rodar após o commit) ────────────────────────────────────
-- Esperado (com o banco de 07/07/2026): itens_diversos = 23,
-- leituras_diversos ≈ 2.691 (835 da fase 2 + 1.834 disponíveis do
-- Monitoramento + 22 do snapshot; os 2.570 "esgotado" preco=0 ficam fora).
-- Obs.: a 1ª execução (07/07/2026) migrou os preco=0 por engano; a limpeza
-- foi feita via API no mesmo dia (DELETE escopado preco=0 em itens DIVERSOS).
select
  (select count(*) from public.produtos where categoria = 'DIVERSOS')  as categoria_diversos,
  (select count(*) from public.itens i
     join public.produtos p on p.id = i.produto_id
    where p.categoria = 'DIVERSOS')                                     as itens_diversos,
  (select count(*) from public.historico_precos h
     join public.itens i    on i.id = h.item_id
     join public.produtos p on p.id = i.produto_id
    where p.categoria = 'DIVERSOS')                                     as leituras_diversos,
  (select count(*) from public.itens)                                   as itens_total,
  (select count(*) from public.historico_precos)                        as historico_total;
