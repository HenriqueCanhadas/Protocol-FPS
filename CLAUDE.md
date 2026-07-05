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
through Vercel serverless functions under `frontend-flask/frontend/api/`.

**SPA structure (`frontend/src/`):** `App.jsx` is an auth gate — while `useAuth` resolves the
Supabase session it shows a spinner, renders `LoginScreen` when logged out, and otherwise mounts
`BrowserRouter` with three pages (`Dashboard` `/`, `NovoProduto` `/novo-produto`, `Conta` `/conta`)
plus redirects for legacy HTML routes. The Supabase client (`services/supabase.js`) is a lazy
singleton: in prod it reads inlined `VITE_*` vars, in dev it fetches `/api/config` from Flask.
Imports use the `@/` alias (→ `src/`, configured in `vite.config.js` **and** `jsconfig.json` —
update both if you change it).

Three server-side endpoints exist in **two parallel implementations** — Flask (`app.py`,
dev) and Vercel functions (prod) — that are deliberate duplicates. **Keep them in sync:**
- `/api/config` — returns only the public `SUPABASE_URL` + `SUPABASE_ANON_KEY`
  (Flask only; in prod Vite inlines these at build time).
- `/api/trigger-coleta` (Vercel: `api/trigger-coleta.js`) — fires the GitHub
  `workflow_dispatch`; holds `GITHUB_TOKEN` server-side. An optional `item_id` in the POST
  body is forwarded as the workflow input to trigger a pointwise (single-product) run.
- `/api/remover` (Vercel: `api/remover.js`) — deletes a product or a history row using
  `SUPABASE_SERVICE_KEY` (bypasses RLS, server-side only). It manually clears FK
  references first: `alertas` → then `historico_precos`/`itens`, since there are no
  cascade rules in the DB.

**Route parity gotcha (Flask, `app.py`):** Vercel's prod rewrite is `/((?!api/).*)` → SPA.
Because Flask is mounted with `static_url_path=""`, its catch-all static route would otherwise
swallow `/api/...` (404 HTML) and page deep-links like `/conta` (404 instead of SPA). `app.py`
compensates with an explicit `/api/<path>` route (→ 404 JSON) and a 404 errorhandler that serves
`index.html` for extension-less paths. Preserve this behavior when touching Flask routing —
it exists to mirror the Vercel rewrite in dev.

## Collector flow (`main.py`)

**Two collection modes** (`_selecionar_itens`): if the `ITEM_ID` env var is set, it collects
*only* that one item even if `monitorando = false` (a **pointwise** run, fired by a per-product
"Coletar Agora" button); otherwise it does a **full** run over every item with
`monitorando = true` (the daily cron / global button). The value flows
frontend → `/api/trigger-coleta` (`item_id` in the POST body) → `workflow_dispatch` input
`item_id` (`.github/workflows/coletar.yml`) → the `ITEM_ID` env var read here.

1. Query Supabase `itens` where `monitorando = true` (or `id = ITEM_ID` in pointwise mode).
2. For each item, pick a scraper from the `SCRAPERS` dict keyed by the store name
   (`lojas.nome` lowercased + spaces stripped — e.g. `"terabyteshop"`).
3. `Scraper().coletar(url)` returns a `DadosProduto` dataclass `(nome, preco, disponivel, url)`.
4. Insert the price into `historico_precos`.
5. Call the Supabase RPC `verificar_alertas(p_item_id, p_preco_atual)`; for each returned
   alert dispatch email + telegram and record it in the `alertas` table.

Alert types handled in `_montar_mensagem`: `abaixo_meta` (below target) and price-drop.

The Supabase tables (`itens`, `lojas`, `historico_precos`, `alertas`) and the
`verificar_alertas` RPC live in Supabase, not in this repo — there are no migrations here.

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

## Commands

### Collector (Python, repo root)
```bash
pip install -r requirements.txt
playwright install chromium          # one-time; --with-deps in CI
python main.py                       # runs the full collection once
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
`./env` then `../.env`). Template: `frontend-flask/.env.example`. Variables:
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (collector — full access),
  `SUPABASE_ANON_KEY` (frontend — public).
- Email (Gmail SMTP): `EMAIL_REMETENTE`, `EMAIL_SENHA_APP`, `EMAIL_DESTINATARIO`.
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- GitHub dispatch (frontend "run now" button): `GITHUB_TOKEN` (PAT with `actions:write`),
  `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_WORKFLOW`.

**Security rule that matters**: anything prefixed `VITE_` is inlined into the public JS
bundle. The `GITHUB_TOKEN` must **never** carry a `VITE_` prefix — it is read only
server-side (Flask in dev, Vercel function in prod). In CI, the same secrets are supplied
as GitHub Actions Secrets in `.github/workflows/coletar.yml`.

## CI

`.github/workflows/coletar.yml` runs the collector daily at 12:00 UTC (09:00 BRT) and on
manual `workflow_dispatch` (with an optional `item_id` input for pointwise runs).
Python 3.11, installs Playwright Chromium, runs `python main.py`.

## Project planning

The `todo` file at the repo root is the source of truth for planned work (statuses:
`OK-` done, `Pending-` started, `-` to do). The `sprint-planner` skill reads it and
(re)generates the sprint report at `project/sprints.md`. Edit `todo`, not `sprints.md`.
