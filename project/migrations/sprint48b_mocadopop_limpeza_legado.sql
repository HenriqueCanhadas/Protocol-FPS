-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 48b — Limpeza das tabelas legadas do projeto "Monitoramento"
-- (produtos_funko / historico_precos_funko), após confirmar que a migração
-- da Sprint 48 (sprint48_mocadopop_migracao.sql) está 100% íntegra.
--
-- Validado em 25/08/2026, linha por linha (não só contagem):
--   • 9/9 produtos legados têm um item correspondente em `itens`.
--   • 1107/1107 leituras legadas têm uma leitura correspondente EXATA em
--     `historico_precos` (mesmo item, mesmo `coletado_em`, mesmo preço e
--     mesmo status mapeado) — zero faltando, zero divergentes.
--   • Nenhuma leitura nova chegou nas tabelas legadas desde a migração (o
--     cron do projeto "Monitoramento" precisa estar desativado — ver nota
--     no relatório da Sprint 48, project/sprint_v5.md).
--
-- IRREVERSÍVEL: DROP TABLE apaga os dados de vez (sem lixeira). Só rode
-- isso depois de você mesmo conferir que está tudo certo em `itens`/
-- `historico_precos` (categoria Diversos, loja Mocadopop) e de ter
-- desativado o cron do repositório `Monitoramento` — senão qualquer
-- coleta nova daquele cron que ainda tente escrever aqui vai falhar
-- (tabela não existe mais) e, pior, os dados dela seriam perdidos sem
-- nunca terem sido migrados.
--
-- Rodar MANUALMENTE no SQL Editor do Supabase (a SERVICE_KEY não executa
-- DDL — por isso este arquivo não foi executado pelo assistente).
-- ═══════════════════════════════════════════════════════════════════════

-- Descomente as duas linhas abaixo só quando tiver certeza:

-- drop table if exists public.historico_precos_funko;
-- drop table if exists public.produtos_funko;

-- ── Conferência ANTES de apagar (rode isto primeiro e confirme os números
--    batem com o que está documentado acima) ──────────────────────────────
select
  (select count(*) from public.produtos_funko)         as produtos_legado,
  (select count(*) from public.historico_precos_funko) as leituras_legado,
  (select count(*) from public.itens i join public.lojas l on l.id = i.loja_id
    where l.nome = 'Mocadopop')                          as itens_novos,
  (select count(*) from public.historico_precos h
     join public.itens i on i.id = h.item_id
     join public.lojas l on l.id = i.loja_id
    where l.nome = 'Mocadopop')                          as leituras_novas;
