-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 48 (todo:251) — Scraper Mocadopop + migração dos dados legados do
-- projeto "Monitoramento" (github.com/HenriqueCanhadas/Monitoramento) para
-- a estrutura atual.
--
-- Diferente da Sprint 8 (Kabum), os dados legados aqui NÃO vêm de outro
-- banco — o projeto "Monitoramento" grava nas tabelas `produtos_funko` e
-- `historico_precos_funko`, no MESMO projeto Supabase do PROTOCOL FPS
-- (confirmado com o usuário). Por isso a migração real foi executada via
-- API (SERVICE_KEY, que tem acesso de escrita normal a essas tabelas — não
-- é DDL) em 25/08/2026, não manualmente no SQL Editor. Este arquivo fica
-- como registro reproduzível do que foi feito (mesma convenção de
-- documentar migrações de dados como .sql, ver sprint8_diversos_migracao.sql),
-- e é seguro rodar de novo — idempotente via `on conflict`/`not exists`.
--
-- Fontes legadas (somente LEITURA — nada é alterado ou removido nelas):
--   • produtos_funko          (9 itens; nome, url, menor_preco — este último
--                              não migra, o Dashboard já deriva o mínimo a
--                              partir do histórico agregado)
--   • historico_precos_funko  (1.107 leituras; status text — só 2 valores
--                              existentes: 'Disponível' e 'Erro de Conexão',
--                              nunca um "esgotado" real distinto)
--
-- Destino: itens + historico_precos, categoria DIVERSOS, loja Mocadopop,
-- dono pedrosacanhadas@gmail.com.
--
-- Decisões registradas:
--   • monitorando = true nos itens migrados (diferente da Sprint 8/Kabum,
--     que usou false) — decisão explícita do usuário: o scraper novo
--     (`scrapers/mocadopop.py`) assume a coleta diária desses 9 itens no
--     lugar do cron do projeto legado, que deve ser desativado por ele no
--     repositório `Monitoramento` depois que esta sprint validar em CI.
--   • preco_meta = null (o schema legado não tem preço-alvo).
--   • Mapeamento de status: 'Disponível' + preco → disponivel=true,
--     encontrado=true; 'Erro de Conexão' (preco sempre null nesta fonte,
--     confirmado 0 exceções) → disponivel=false, encontrado=false — mesma
--     semântica de "não localizado" (Sprint 41), não um "esgotado" real
--     (o legado nunca detectou esgotamento de fato, só sucesso/erro).
--   • coletado_em preserva o timestamp original (`data_verificacao`, já
--     timestamptz — sem conversão de fuso necessária).
--   • As tabelas legadas (`produtos_funko`/`historico_precos_funko`)
--     permanecem intactas — nada foi apagado nelas.
--   • Validado 1107/1107 (contagem exata por item, legado == novo) após a
--     execução real via API — ver relatório da Sprint 48
--     (project/sprint_v5.md).
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- ── 1) Loja Mocadopop ─────────────────────────────────────────────────
insert into public.lojas (nome, url_base, ativo)
select 'Mocadopop', 'https://www.mocadopop.com.br', true
where not exists (select 1 from public.lojas where nome = 'Mocadopop');

-- ── 2) Categoria DIVERSOS (idempotente; já existe desde a Sprint 8) ─────
insert into public.produtos (nome, categoria)
select 'Diversos', 'DIVERSOS'
where not exists (select 1 from public.produtos where categoria = 'DIVERSOS');

-- ── 3) Itens: um por produto legado ──────────────────────────────────
with refs as (
  select
    (select id from public.usuarios where email = 'pedrosacanhadas@gmail.com') as user_id,
    (select id from public.lojas    where nome  = 'Mocadopop')                 as loja_id,
    (select id from public.produtos where categoria = 'DIVERSOS')              as produto_id
)
insert into public.itens
       (loja_id, produto_id, url, nome_na_loja, preco_meta, monitorando, user_id)
select r.loja_id, r.produto_id, pf.url, pf.nome, null, true, r.user_id
from public.produtos_funko pf
cross join refs r
on conflict (url, user_id) do nothing;

-- ── 4) Histórico ← historico_precos_funko (via produtos_funko.url) ─────
with refs as (
  select id as user_id from public.usuarios where email = 'pedrosacanhadas@gmail.com'
)
insert into public.historico_precos (item_id, preco, disponivel, encontrado, coletado_em)
select
       i.id,
       h.preco,
       (h.status = 'Disponível'),
       (h.status = 'Disponível'),
       h.data_verificacao
from public.historico_precos_funko h
join public.produtos_funko pf on pf.id = h.produto_id
join refs r on true
join public.itens i on i.url = pf.url and i.user_id = r.user_id
where not exists (
  select 1 from public.historico_precos x
  where x.item_id     = i.id
    and x.coletado_em = h.data_verificacao
);

commit;

-- ── Conferência (rodar após o commit) ────────────────────────────────────
-- Esperado: itens_mocadopop = 9, leituras_mocadopop = 1107.
select
  (select count(*) from public.lojas where nome = 'Mocadopop')            as loja_criada,
  (select count(*) from public.itens i
     join public.lojas l on l.id = i.loja_id
    where l.nome = 'Mocadopop')                                            as itens_mocadopop,
  (select count(*) from public.historico_precos h
     join public.itens i on i.id = h.item_id
     join public.lojas l on l.id = i.loja_id
    where l.nome = 'Mocadopop')                                            as leituras_mocadopop;
