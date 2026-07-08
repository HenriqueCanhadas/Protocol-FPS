-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 9 (todo:112) — Alertas por usuário: flag de Telegram por perfil.
--
-- Rodar MANUALMENTE no SQL Editor do Supabase. Idempotente.
--
-- Contexto: o email do alerta passa a ir para o EMAIL CADASTRADO do dono
-- do item (usuarios.email — nada a migrar). Já o Telegram usa um bot/chat
-- PESSOAL (TELEGRAM_CHAT_ID único), então ele só deve disparar para quem
-- estiver habilitado. Esta coluna guarda essa escolha; a UI de seleção
-- (lista de usuários do admin) chega na Sprint 11.
--
-- O coletor tem fallback: se esta migração ainda não tiver sido aplicada,
-- o Telegram fica restrito ao admin pedrosacanhadas@gmail.com por código.
-- ═══════════════════════════════════════════════════════════════════════

begin;

alter table public.usuarios
  add column if not exists notificar_telegram boolean not null default false;

-- Habilita o Telegram apenas para o dono do bot (decisão registrada no todo:112)
update public.usuarios
   set notificar_telegram = true
 where email = 'pedrosacanhadas@gmail.com';

commit;

-- ── Conferência ──────────────────────────────────────────────────────────
select email, nivel, notificar_telegram from public.usuarios order by email;
