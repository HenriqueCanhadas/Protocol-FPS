# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PROTOCOL FPS is a price-monitoring system for PC hardware sold by Brazilian stores
(Kabum, Terabyte, Pichau). A daily GitHub Actions cron scrapes product prices,
stores them in Supabase, and fires Email + Telegram alerts when a price drops below
a target or falls vs. the previous reading. A separate React SPA lets the user manage
which products are monitored and trigger an on-demand collection run.

The codebase is bilingual: code comments, log messages, and most identifiers are in
**Portuguese**. Match that when editing — new scrapers, log strings, and user-facing
text should be Portuguese.

## Two independent halves

**1. The scraper/collector (`main.py` + `scrapers/` + `notificacoes/` + `utils/`)**
The entry point run by CI. It is *not* imported by the frontend; they communicate only
through the Supabase database and the GitHub `workflow_dispatch` API.

**2. The frontend (`frontend-flask/`)**
A React (Vite) SPA. Flask (`app.py`) only serves it in local dev and provides the API
routes; **Flask is not used in production**. In production the SPA is deployed to Vercel,
talks directly to Supabase via `VITE_*` env vars, and reaches the server-only routes
through Vercel serverless functions under `frontend-flask/frontend/api/`. Deploy
walkthrough (Vercel setup, env vars): `frontend-flask/DEPLOY_VERCEL.md`.

**SPA structure (`frontend/src/`):** `App.jsx` is an auth gate — while `useAuth` resolves the
Supabase session it shows a spinner, renders `LoginScreen` when logged out, and otherwise mounts
`BrowserRouter` with four pages (`Dashboard` `/`, `NovoProduto` `/novo-produto`,
`Usuarios` `/usuarios` — admin-only user management — and `Conta` `/conta`)
plus redirects for legacy HTML routes. Sessions auto-expire after 30 min of inactivity or
closed window (`useAutoLogout`, last-activity timestamp in localStorage), and password
changes happen only through the admin flow in `/usuarios` — never self-service (Sprint 13).
The Supabase client (`services/supabase.js`) is a lazy
singleton: in prod it reads inlined `VITE_*` vars, in dev it fetches `/api/config` from Flask.
`AppHeader` shows a live BRT clock via `hooks/useClock.js` (ticks every second off
`utils/datas.js`'s `horaBRT`/`dataBRT`). Imports use the `@/` alias (→ `src/`, configured
in `vite.config.js` **and** `jsconfig.json` — update both if you change it).

**Dashboard (`pages/Dashboard/`):** reorganized in Sprint 17/V3 out of a single ~1620-line
`Dashboard.jsx` into `index.jsx` (page shell/state) + `components/` (`ControlBar`,
`ProductTable`, `Sidebar`, `KpiRibbon`, `PriceChartPanel`, `CollectionsPanel`,
`ItemDetailPanel`, `GraficoHistorico`) + `dialogs/` (`ProductHistoryDialog`,
`ProductActionsDialog`, `CollectionDayDialog`, `SearchDialog`) + `Dashboard.constants.js`.
All Supabase
data-access for the page lives in `services/dashboard.service.js`; filter/sort state is
`hooks/useDashboardFilters.js`; row selection + keyboard nav (arrows/Enter/Esc) is
`hooks/useProductSelection.js`. Every dialog wraps `components/TerminalModal.jsx` for
focus-trapping and Esc-to-close. Both `frontend-design-system` and `backend-conventions`
skills cover this area's conventions in more depth than is repeated here.

**PostgREST 1000-row cap (bit us twice — Sprints 8 and 10):** Supabase/PostgREST silently
truncates every response at 1000 rows. Every one of the Dashboard's Supabase queries lives
in `services/dashboard.service.js`, which compensates per query: `buscarItens` embeds
per-item aggregates in the `itens` select via **aliased embeds** of the same table —
`ultima:historico_precos(...)` (latest reading) and `minimo:historico_precos(...)` (lowest
price), each with its own `order`/`limit(1)`/filter keyed by the alias in `referencedTable`
— instead of fetching `historico_precos` whole; `buscarHistoricoCompleto` (history modal),
`buscarItensDoDia` (collection-day filter) and `buscarColetasPorDia`/`buscarDetalheDia`
(collections panel) each fetch full history with a `.range()` pagination loop in blocks of
1000 (the `PAGINA` constant at the top of the file); the same offset-loop pattern is used
server-side in `app.py` (`/api/usuarios` item counts and `excluir`). Follow one of these
patterns for any new query over `historico_precos` (or other tables) that can exceed 1000
rows.

Four server-side endpoints exist in **two parallel implementations** — Flask (`app.py`,
dev) and Vercel functions (prod) — that are deliberate duplicates. **Keep them in sync:**
- `/api/config` — returns only the public `SUPABASE_URL` + `SUPABASE_ANON_KEY`
  (Flask only; in prod Vite inlines these at build time).
- `/api/trigger-coleta` (Vercel: `api/trigger-coleta.js`) — fires the GitHub
  `workflow_dispatch`; holds `GITHUB_TOKEN` server-side. Optional POST-body fields become
  workflow inputs, by precedence: `item_id` (pointwise single-product run), `item_ids`
  (JSON array or comma-separated string — the Dashboard's filtered-list collection), or
  `categoria`/`loja`/`user_id` (segmented run, combinable).
- `/api/remover` (Vercel: `api/remover.js`) — deletes a product or a history row using
  `SUPABASE_SERVICE_KEY` (bypasses RLS, server-side only). It manually clears FK
  references first: `alertas` → then `historico_precos`/`itens`, since there are no
  cascade rules in the DB.
- `/api/usuarios` (Vercel: `api/usuarios.js`) — admin-only user management via the
  Supabase admin API. Ações: `criar` (email/senha/nivel), `trocar_senha`, `listar`
  (profiles + `auth.users` last-sign-in/confirmation + item counts), `telegram`
  (toggles `usuarios.notificar_telegram`), and `excluir` (manual cascade
  alertas → historico_precos → itens, then deletes the auth account, which cascades
  to `usuarios`; self-deletion is rejected). Requires a session token whose profile
  has `nivel >= 2`; the signup trigger creates profiles at nivel 1 and the endpoint
  promotes to 2 when creating an admin.

**Route parity gotcha (Flask, `app.py`):** Vercel's prod rewrite is `/((?!api/).*)` → SPA.
Because Flask is mounted with `static_url_path=""`, its catch-all static route would otherwise
swallow `/api/...` (404 HTML) and page deep-links like `/conta` (404 instead of SPA). `app.py`
compensates with an explicit `/api/<path>` route (→ 404 JSON) and a 404 errorhandler that serves
`index.html` for extension-less paths. Preserve this behavior when touching Flask routing —
it exists to mirror the Vercel rewrite in dev.

## Collector flow (`main.py`)

**Four collection modes** (`_selecionar_itens`), by precedence:
1. `ITEM_ID` env var set → **pointwise**: collects *only* that item even if
   `monitorando = false` (a per-product "Coletar Agora" is an explicit manual request).
   Ignores every other scope env.
2. `ITEM_IDS` set (comma-separated UUIDs) → **list**: collects exactly those items
   (Sprint 14). This is how the SPA's "Coletar Filtrados" works — *any* active filter
   (category, store, owner, text search, collection-day) sends the visible list's
   monitored item IDs, so filters the collector can't express server-side still
   collect exactly what the user sees. Ignores `CATEGORIA`/`LOJA`/`USER_ID`.
3. `CATEGORIA` and/or `LOJA` and/or `USER_ID` set → **segmented**: monitored items of
   that category (`GPU`/`CPU`/`RAM`/`PSU`/`MOBO`/`STORAGE`/`DIVERSOS`), store slug
   (`kabum`/`terabyteshop`/`pichau`/`tuyo`/`playstation`/`logitec`/`tangleteezer`/
   `amazon`/`shopee`) and/or owner (`itens.user_id`). Combinable. The
   category/store filters run in Python; the user filter is in the PostgREST query.
   The SPA sends `user_id` automatically for a non-admin "collect all" with no filters
   (Sprint 9); admins and the cron stay global.
4. Nothing set → **full** run over every item with `monitorando = true` (daily cron /
   admin global button).

Values flow frontend → `/api/trigger-coleta` (POST body) → `workflow_dispatch` inputs
(`.github/workflows/coletar.yml`) → the env vars read here.

1. Query Supabase `itens` (scoped per the mode above).
2. For each item, pick a scraper from the `SCRAPERS` dict keyed by the store name
   (`lojas.nome` lowercased + spaces stripped — e.g. `"terabyteshop"`).
3. `Scraper().coletar(url)` returns a `DadosProduto` dataclass `(nome, preco, disponivel, url)`.
4. Insert the price into `historico_precos`.
5. Call the Supabase RPC `verificar_alertas(p_item_id, p_preco_atual)`; for each returned
   alert dispatch email + telegram and record it in the `alertas` table.

Alert types (`notificacoes/formato.py`): `abaixo_meta` (below target) and `queda_preco`
(dropped vs. previous reading).

**Alert routing (Sprint 9)**: notifications go to the item's **owner** — email to
`usuarios.email` of `itens.user_id` (`enviar_email(alerta, destinatario=...)`;
`EMAIL_DESTINATARIO` is only the ownerless fallback). Telegram is a single personal
bot/chat: it fires only for owners with `usuarios.notificar_telegram = true`
(migration `sprint9_alertas_por_usuario.sql`; if the column doesn't exist yet,
`_carregar_usuarios` falls back to admin-only).

The Supabase tables (`itens`, `lojas`, `produtos`, `historico_precos`, `alertas`,
`usuarios`) and the `verificar_alertas` RPC live in Supabase — full schema, RLS, and
data-flow documentation in `project/banco.md`. Schema changes are recorded as SQL
files under `project/migrations/` (run manually in the Supabase SQL Editor — the
service key can't execute DDL).

**Multiuser model (Sprint 5):** `usuarios.nivel` (1 = normal, 2 = admin) mirrors
`auth.users` via a signup trigger; `itens.user_id` (default `auth.uid()`) marks the
owner. RLS lets a user see/manage only their own `itens`/`historico_precos`/`alertas`;
`is_admin()` (SECURITY DEFINER) grants admins full visibility. The collector uses the
SERVICE_KEY and bypasses RLS entirely. `/api/remover` requires the session's
`Authorization: Bearer` token and returns 401 (no session) / 403 (not the owner and
not admin). Frontend: `useAuth` exposes `perfil`/`isAdmin`; the Dashboard shows an
admin-only per-user filter row and owner tags.

## Scraper architecture (`scrapers/`)

`base.py` defines `ScraperBase` (ABC) which owns all the Playwright + anti-bot machinery:
launches headless Chromium wrapped in `playwright-stealth`, sets a realistic
context (UA, headers, pt-BR locale, São Paulo timezone), blocks images/media/fonts for
speed, and detects Cloudflare/captcha challenge pages via `_detectar_challenge`.

Subclasses (`kabum.py`, `terabyte.py`, `pichau.py`) implement only two abstract methods:
- `_aguardar_preco(page)` — wait for the price/out-of-stock selector to appear.
- `extrair_dados(page, url)` — parse the loaded page → `DadosProduto`.

Extraction strategy (see `kabum.py`) is layered most-stable-first: **JSON-LD →
meta tags → CSS selectors → full-text JS scan**. Out-of-stock is decided *before*
price (JSON-LD `availability` OR a DOM out-of-stock selector). Use `self._limpar_preco`
to convert `"R$ 3.299,90"` → `3299.90`.

**CI-aware behavior**: `IS_CI` (`GITHUB_ACTIONS` env) raises timeouts, adds Chromium
flags required in the Linux container (`--no-sandbox`, `--disable-dev-shm-usage`,
`--single-process`, …), and always dumps page diagnostics. To register a new store,
add a `ScraperBase` subclass and an entry to the `SCRAPERS` dict in `main.py`.

**Known limitation — Pichau in CI**: Pichau blocks datacenter IPs by serving a fake
"Site em Manutenção" page, so it only collects reliably when run **locally**
(recorded decision — no HTTP fallback, it always 403s from datacenters). The scraper
retries up to 3× in CI, but CI coverage is effectively Kabum + Terabyte. Don't treat
a Pichau failure in Actions logs as a scraper regression.

**Known limitation — Shopee never collects (Sprint 40)**: unlike Pichau (a rate-limit
that retry can outrun), Shopee's block is an authentication gate — any anonymous/
automated visit gets JS-redirected to `shopee.com.br/verify/traffic/error` ("Login
Necessário"), confirmed 3/3 with the real collector's Playwright (headless and
non-headless alike, different `tracking_id` each time). Retrying doesn't help without
a persisted logged-in session, which is out of scope. `scrapers/shopee.py` detects
this honestly (`_eh_parede_de_login`) and returns `disponivel=False`/no price in a
few seconds instead of retrying or guessing — treat every Shopee item as expected to
never populate `historico_precos` until the project supports a persisted session.

## Commands

### Collector (Python, repo root)
```bash
pip install -r requirements.txt
playwright install chromium          # one-time; --with-deps in CI
python main.py                       # runs the full collection once
ITEM_ID=<uuid> python main.py        # pointwise (one item, even if paused)
CATEGORIA=GPU LOJA=kabum python main.py   # segmented (either or both)
```
There is no test suite. To debug a single store, run a scraper directly:
```bash
python -c "from scrapers.kabum import KabumScraper; print(KabumScraper(headless=False).coletar('<url>'))"
```
`headless=False` opens a visible browser, useful for diagnosing blocked/challenge pages.

### Frontend (local dev — two terminals)
```bash
# Terminal 1 — Flask (serves /api/config + /api/trigger-coleta from root .env)
pip install -r frontend-flask/requirements_flask.txt
cd frontend-flask && python app.py            # http://127.0.0.1:5000

# Terminal 2 — Vite (HMR; proxies /api/* → Flask). Open THIS one.
cd frontend-flask/frontend && npm install && npm run dev   # http://localhost:3000
```
Production build: `cd frontend-flask/frontend && npm run build` (outputs `dist/`,
which Flask serves as a fallback and Vercel deploys).

## Environment & secrets

The `.env` lives at the **repo root** (the collector loads it there; `app.py` looks for
`frontend-flask/.env` then the repo-root `.env`). Template: `frontend-flask/.env.example`. Variables:
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (collector — full access),
  `SUPABASE_ANON_KEY` (frontend — public).
- Email (Gmail SMTP): `EMAIL_REMETENTE`, `EMAIL_SENHA_APP`, `EMAIL_DESTINATARIO`.
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- GitHub dispatch (frontend "run now" button): `GITHUB_TOKEN` (PAT with `actions:write`),
  `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_WORKFLOW`, and optional `GITHUB_BRANCH` —
  the `workflow_dispatch` target ref (default `main`). Set it to a feature branch to
  test new workflow inputs before merging; GitHub 422s a dispatch whose inputs the
  target branch's workflow doesn't define.

**Security rule that matters**: anything prefixed `VITE_` is inlined into the public JS
bundle. The `GITHUB_TOKEN` must **never** carry a `VITE_` prefix — it is read only
server-side (Flask in dev, Vercel function in prod). In CI, the same secrets are supplied
as GitHub Actions Secrets in `.github/workflows/coletar.yml`.

## CI

`.github/workflows/coletar.yml` runs the collector daily at 12:00 UTC (09:00 BRT) and on
manual `workflow_dispatch` with optional inputs `item_id` (pointwise), `item_ids`
(filtered-list), `categoria`, `loja`, and `user_id` (segmented). Python 3.11, installs
Playwright Chromium, runs `python main.py`.

## Project planning

The `todo` file at the repo root is the source of truth for planned work (statuses:
`OK-` done, `Pending-` started, `-` to do). It is split into version sections marked
`-----------------V<N>------------------`; each section gets its own report. The
`sprint-planner` skill reads the `todo` and (re)generates `project/sprint_v<N>.md`
(V1-V3 are finished/frozen; V4 is the active plan). Edit `todo`, not the reports.

`project/sprint_front.md` is a separate, hand-maintained UI/UX redesign proposal (not
generated by `sprint-planner`) — a 3-phase Dashboard redesign plan. It explicitly does
not replace `todo`; phases must be copied into `todo` before they enter the normal
sprint flow (V3 already absorbed this proposal's direction with an independent design).
