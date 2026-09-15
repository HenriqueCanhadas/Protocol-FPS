-- ═══════════════════════════════════════════════════════════════════════
-- Sprint 78 (todo:310) — bloquear/liberar o acesso de um usuário.
--
-- Decisão do usuário (mesma da Sprint 32b para `ver_banco`): SÓ a conta do
-- dono (pedrosacanhadas@gmail.com) pode bloquear ou liberar outra pessoa —
-- nem mesmo um admin comum (nivel >= 2) consegue. A checagem de "é o dono"
-- fica DENTRO do endpoint /api/usuarios (Flask + Vercel), não só na UI.
--
-- ── Por que uma flag no banco NÃO basta sozinha ─────────────────────────
-- O Supabase Auth não conhece a tabela `usuarios`: marcar `bloqueado = true`
-- não impede um signIn bem-sucedido. Por isso a barragem é feita em três
-- camadas, e esta migração cobre duas delas:
--   (1) BARREIRA PRINCIPAL — `ban_duration` na admin API do Supabase, feita
--       pelo endpoint /api/usuarios junto com o UPDATE desta flag. É o que
--       impede o login de fato (fora do escopo deste arquivo).
--   (2) REDE DE SEGURANÇA — as políticas de RLS abaixo: mesmo que uma sessão
--       já aberta continue valendo até o JWT expirar, ela deixa de enxergar
--       QUALQUER dado (itens, histórico, alertas, perfis de terceiros).
--   (3) EXPERIÊNCIA — o front lê `usuarios.bloqueado` (useAuth) e mostra uma
--       tela explicando o bloqueio, em vez de um Dashboard vazio e quebrado.
--
-- ATENÇÃO à política `usuarios_select`: o usuário bloqueado CONTINUA podendo
-- ler o PRÓPRIO perfil. Isso é deliberado — é essa leitura que permite ao
-- front saber que ele está bloqueado e dizer isso com todas as letras. Ele
-- perde a leitura dos perfis de terceiros (que só admin tinha) e de todo o
-- resto dos dados.
--
-- Rodar MANUALMENTE no SQL Editor do Supabase (a SERVICE_KEY não executa
-- DDL). Idempotente.
-- ═══════════════════════════════════════════════════════════════════════

begin;

alter table public.usuarios
  add column if not exists bloqueado boolean not null default false;

-- Trava de segurança: o dono nunca pode ficar bloqueado (o endpoint também
-- recusa bloquear a própria conta, isto aqui é o cinto extra).
update public.usuarios
   set bloqueado = false
 where lower(email) = 'pedrosacanhadas@gmail.com';

-- esta_bloqueado(): mesmo padrão de is_admin() (Sprint 5) e pode_ver_banco()
-- (Sprint 32b) — SECURITY DEFINER, sem recursão de RLS na própria tabela.
create or replace function public.esta_bloqueado()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and bloqueado = true
  );
$$;

-- ── Políticas RLS (recriadas; são as mesmas da Sprint 5 + o novo veto) ───
-- Mantidos os nomes originais para o `create or replace`-equivalente:
-- o Postgres não tem "create or replace policy", então cada uma é derrubada
-- e recriada — por isso este bloco é seguro de rodar mais de uma vez.

-- usuarios: cada um lê o PRÓPRIO perfil (inclusive bloqueado — ver nota no
-- cabeçalho); admin lê todos, desde que não esteja bloqueado.
drop policy if exists usuarios_select on public.usuarios;
create policy usuarios_select on public.usuarios
  for select to authenticated
  using (id = auth.uid() or (public.is_admin() and not public.esta_bloqueado()));

-- itens: dono ou admin, e nunca se estiver bloqueado.
drop policy if exists itens_select on public.itens;
create policy itens_select on public.itens
  for select to authenticated
  using (
    not public.esta_bloqueado()
    and (user_id = auth.uid() or public.is_admin())
  );

drop policy if exists itens_insert on public.itens;
create policy itens_insert on public.itens
  for insert to authenticated
  with check (
    not public.esta_bloqueado()
    and (user_id = auth.uid() or public.is_admin())
  );

drop policy if exists itens_update on public.itens;
create policy itens_update on public.itens
  for update to authenticated
  using (
    not public.esta_bloqueado()
    and (user_id = auth.uid() or public.is_admin())
  )
  with check (
    not public.esta_bloqueado()
    and (user_id = auth.uid() or public.is_admin())
  );

-- historico_precos: visível se o item pai é do usuário (ou admin).
drop policy if exists historico_select on public.historico_precos;
create policy historico_select on public.historico_precos
  for select to authenticated
  using (
    not public.esta_bloqueado()
    and exists (
      select 1 from public.itens i
      where i.id = historico_precos.item_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- alertas: mesma regra do histórico.
drop policy if exists alertas_select on public.alertas;
create policy alertas_select on public.alertas
  for select to authenticated
  using (
    not public.esta_bloqueado()
    and exists (
      select 1 from public.itens i
      where i.id = alertas.item_id
        and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- /admin (métricas do banco) também some para quem está bloqueado — mesmo
-- que a pessoa tivesse ver_banco liberado antes (Sprint 32b).
create or replace function public.pode_ver_banco()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and ver_banco = true and bloqueado = false
  );
$$;

-- Recarrega o schema cache do PostgREST (a coluna nova precisa aparecer no
-- select de /rest/v1/usuarios usado pelo endpoint e pelo useAuth)
notify pgrst, 'reload schema';

commit;

-- ── Conferência ──────────────────────────────────────────────────────────
-- 1) Coluna e estado atual de cada conta:
select email, nivel, ver_banco, bloqueado from public.usuarios order by email;

-- 2) Políticas em vigor (as 6 acima devem aparecer):
-- select tablename, policyname from pg_policies
--  where schemaname='public' and tablename in ('usuarios','itens','historico_precos','alertas')
--  order by 1,2;

-- 3) Teste do veto (rodar LOGADO como o usuário bloqueado, pelo app):
--    GET /rest/v1/itens?select=id  → deve voltar [] (e não os itens dele)
