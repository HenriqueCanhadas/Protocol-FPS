-- ═══════════════════════════════════════════════════════════════════
-- PROTOCOL FPS — Sprint 5: Multiusuário & Admin (todo:67 / todo:69)
-- Rodar no Supabase: SQL Editor → New query → colar tudo → Run.
-- Idempotente: pode ser executada mais de uma vez sem efeito colateral.
--
-- Modelo:
--   usuarios.nivel  →  1 = normal (vê/gerencia só os próprios itens)
--                      2 = admin  (vê/gerencia os itens de todos)
--   itens.user_id   →  dono do item (FK para usuarios; RLS filtra por ele)
--   Coletor (main.py) usa a SERVICE_KEY → ignora RLS e segue coletando tudo.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Tabela de perfis (espelho leve de auth.users) ────────────────
create table if not exists public.usuarios (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text,
  nome      text,
  nivel     int  not null default 1,   -- 1=normal · 2=admin
  criado_em timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- ── 2. Perfis para os usuários já existentes ────────────────────────
-- pedrosacanhadas@gmail.com = admin (nivel 2); demais = normal (nivel 1)
insert into public.usuarios (id, email, nivel)
select u.id, u.email,
       case when u.email = 'pedrosacanhadas@gmail.com' then 2 else 1 end
from auth.users u
on conflict (id) do nothing;

-- Garante o nível do admin mesmo se o perfil já existia
update public.usuarios set nivel = 2 where email = 'pedrosacanhadas@gmail.com';

-- ── 3. Auto-perfil em novo signup (default nivel 1) ─────────────────
create or replace function public.criar_perfil_usuario()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_criar_perfil on auth.users;
create trigger trg_criar_perfil
  after insert on auth.users
  for each row execute function public.criar_perfil_usuario();

-- ── 4. is_admin(): checagem de papel sem recursão de RLS ────────────
-- SECURITY DEFINER: lê usuarios ignorando o RLS da própria tabela.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and nivel >= 2
  );
$$;

-- ── 5. Dono do item: itens.user_id ──────────────────────────────────
alter table public.itens
  add column if not exists user_id uuid references public.usuarios(id);

-- Backfill: itens existentes pertencem ao admin (decisão 05/07/2026)
update public.itens
set user_id = (select id from public.usuarios where email = 'pedrosacanhadas@gmail.com')
where user_id is null;

alter table public.itens alter column user_id set not null;
-- Novos inserts autenticados assumem o próprio usuário como dono
alter table public.itens alter column user_id set default auth.uid();

create index if not exists idx_itens_user_id on public.itens (user_id);

-- ── 6. Políticas RLS ────────────────────────────────────────────────
-- Remove TODAS as políticas antigas destas tabelas (nomes desconhecidos)
-- e recria o modelo por dono + admin. lojas/produtos ficam como estão
-- (dados de referência compartilhados).
do $$
declare p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('itens', 'historico_precos', 'alertas', 'usuarios')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table public.itens            enable row level security;
alter table public.historico_precos enable row level security;
alter table public.alertas          enable row level security;

-- usuarios: cada um lê o próprio perfil; admin lê todos
create policy usuarios_select on public.usuarios
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- itens: dono ou admin (select / insert / update).
-- DELETE fica sem política: só o servidor (/api/remover, SERVICE_KEY) apaga.
create policy itens_select on public.itens
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy itens_insert on public.itens
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy itens_update on public.itens
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- historico_precos: visível se o item pai é do usuário (ou admin).
-- INSERT sem política: só o coletor (SERVICE_KEY) grava.
create policy historico_select on public.historico_precos
  for select to authenticated
  using (exists (
    select 1 from public.itens i
    where i.id = historico_precos.item_id
      and (i.user_id = auth.uid() or public.is_admin())
  ));

-- alertas: mesma regra do histórico
create policy alertas_select on public.alertas
  for select to authenticated
  using (exists (
    select 1 from public.itens i
    where i.id = alertas.item_id
      and (i.user_id = auth.uid() or public.is_admin())
  ));

-- ── 7. Recarrega o schema cache do PostgREST ────────────────────────
notify pgrst, 'reload schema';

-- ── Verificação rápida (opcional; rode depois do bloco acima) ───────
-- select email, nivel from public.usuarios order by nivel desc;
-- select count(*) itens_sem_dono from public.itens where user_id is null;  -- deve ser 0
-- select tablename, policyname from pg_policies where schemaname='public' order by 1,2;
