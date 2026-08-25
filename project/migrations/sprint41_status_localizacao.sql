-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 41 (V5, todo:204) — Distinguir "esgotado confirmado" de
-- "não localizado" (erro/challenge/seletor ausente) na coleta.
--
-- Rodar MANUALMENTE no SQL Editor do Supabase. Idempotente.
--
-- Contexto: hoje TODOS os scrapers colapsam esgotamento real e falha de
-- extração no mesmo resultado (disponivel=false, preco=null) — e como
-- `historico_precos.preco` era NOT NULL, o coletor nunca sequer gravava uma
-- linha quando não havia preço, então nenhum dos dois casos aparecia na
-- Dashboard (só o último preço válido anterior, indefinidamente).
--
-- Esta migração:
--   1. Torna `preco` opcional, permitindo gravar a leitura mesmo sem valor.
--   2. Adiciona `encontrado` (default true): false = o scraper NÃO
--      confirmou nada sobre o produto (erro, timeout, challenge/bloqueio ou
--      seletor de preço ausente mesmo após todos os fallbacks); true =
--      leitura confirmada, com preço OU esgotamento real detectado na
--      página. `disponivel` continua com o mesmo significado de sempre.
-- ═══════════════════════════════════════════════════════════════════════

begin;

alter table public.historico_precos
  alter column preco drop not null;

alter table public.historico_precos
  add column if not exists encontrado boolean not null default true;

comment on column public.historico_precos.encontrado is
  'false = o scraper NAO conseguiu confirmar o estado do produto (erro, timeout, challenge/bloqueio ou seletor ausente); true = leitura confirmada (com preco OU esgotado confirmado, disponivel=false)';

commit;

-- ── Conferência ──────────────────────────────────────────────────────────
select column_name, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'historico_precos'
 order by ordinal_position;
