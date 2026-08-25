# PROTOCOL FPS

**Monitor de preços para lojas brasileiras** — coleta diária automatizada de preços
na **KaBuM**, **Terabyteshop**, **Pichau**, **Tuyo**, **Playstation Store**,
**Logitech Store**, **Tangle Teezer** e **Amazon** (a Shopee está registrada no
código mas não coleta em nenhum ambiente — ver limitação conhecida abaixo),
histórico no Supabase e alertas por **Email + Telegram** quando o preço cai ou
fura a meta que você definiu.

> Coletor em Python (Playwright + stealth) rodando no GitHub Actions · SPA em React
> hospedada na Vercel · banco e autenticação no Supabase · **multiusuário com papel
> de admin**.

---

## ✦ Funcionalidades

- **Coleta diária automática** (cron do GitHub Actions às 09:00 de Brasília) e
  **coleta sob demanda** pelo botão do site
- **Escopo de coleta**: tudo, por **categoria** (GPU/CPU/RAM/PSU/MOBO/STORAGE/DIVERSOS),
  por **loja**, por **usuário** (o "Coletar" de um usuário normal coleta só os itens
  dele), **um único produto** ("Coletar agora" no menu do item) ou **a lista filtrada**
  — com qualquer filtro ativo (inclusive busca e dia de coleta), o COLETAR FILTRADOS
  coleta exatamente os itens visíveis na lista
- **Alertas** em dois canais e dois gatilhos:
  - Email HTML vai para o **email cadastrado do dono do item**; Telegram é um
    bot pessoal, disparado só para quem está habilitado (`notificar_telegram`)
  - `abaixo_meta` — o preço ficou **abaixo do preço-alvo** definido para o item
  - `queda_preco` — o preço **caiu** em relação à leitura anterior
- **Dashboard** com busca, filtros combináveis (categoria × loja × produto da loja),
  ordenação, histórico com gráfico de barras, edição de meta, pausa/retomada de
  monitoramento e remoção (de produtos ou de leituras específicas)
- **Multiusuário**: cada usuário vê e gerencia **apenas os próprios itens** (RLS no
  Postgres); **admins** veem tudo, com filtro por usuário e etiqueta de dono
- **Gestão de usuários pelo admin**: criação de contas (papel normal/admin) e troca
  de senha direto pela UI
- **Anti-bot**: Chromium headless com `playwright-stealth`, headers/locale/timezone
  realistas, detecção de challenge (Cloudflare/captcha/página falsa de manutenção)
  com retries e log honesto

## ⚠ Limitação conhecida

A **Pichau bloqueia IPs de datacenter** (serve uma página falsa "Site em Manutenção")
— por decisão registrada, ela só coleta em execução **local**; o CI cobre KaBuM e
Terabyteshop. Alternativas futuras: runner self-hosted ou proxy residencial BR.

Os scrapers de **Tuyo, Playstation Store, Logitech Store, Tangle Teezer e Amazon**
(Sprint 29) foram validados **localmente** (Playwright + stealth, headless) contra
as URLs de teste reais — a cobertura deles no CI (GitHub Actions) ainda não foi
validada com múltiplos runs (mesma metodologia usada para KaBuM/Terabyte/Pichau,
ver skill `scraper-nova-loja`); a Amazon é a candidata mais provável a precisar do
mesmo tratamento da Pichau, dado o histórico conhecido de anti-bot agressivo.

A **Shopee não coleta em nenhum ambiente** (confirmado local **e** em CI, por dois
mecanismos diferentes): localmente, toda visita anônima/automatizada é
redirecionada via JS para uma parede "Login Necessário"
(`shopee.com.br/verify/traffic/error`) — confirmado **3/3** com o Playwright real
do coletor (headless e não-headless), com um `tracking_id` diferente em cada
tentativa. No CI (IP de datacenter do runner) o bloqueio é ainda mais silencioso:
a página nem chega a redirecionar, fica travada sem título por todo o timeout
(40s) — validado ao vivo via `workflow_dispatch loja=shopee`. Diferente da Pichau
(rate-limit por IP, onde retry ajuda), aqui é um portão de autenticação: sem uma
sessão logada persistida, não há tentativa que funcione. O scraper
(`scrapers/shopee.py`) detecta esse bloqueio honestamente e retorna
`disponivel=False`/sem preço (nunca um falso "esgotado") em poucos segundos, mas
fica registrado como não-operante até (se algum dia fizer sentido) o projeto
suportar sessão autenticada persistida — fora do escopo atual.

---

## ✦ Arquitetura

Duas metades independentes que só se encontram no Supabase e no `workflow_dispatch`:

```
┌───────────────────────────────┐        ┌─────────────────────────────────┐
│  COLETOR (Python)             │        │  FRONTEND (React SPA)           │
│  GitHub Actions · cron diário │        │  Vercel (prod) · Vite (dev)     │
│                               │        │                                 │
│  main.py                      │        │  Dashboard · Novo Produto ·     │
│   ├─ scrapers/ (Playwright)   │        │  Usuários (admin) · Conta       │
│   ├─ notificacoes/ (📧 + 📱)  │        │        │                        │
│   └─ SUPABASE_SERVICE_KEY     │        │  ANON_KEY + sessão (RLS)        │
└──────────────┬────────────────┘        └───────┬─────────────────────────┘
               │                                 │
               ▼                                 ▼
        ┌─────────────────────────────────────────────┐
        │            SUPABASE (Postgres)              │
        │  usuarios · lojas · produtos · itens        │
        │  historico_precos · alertas                 │
        │  RPC verificar_alertas() · RLS por dono     │
        └─────────────────────────────────────────────┘
               ▲
               │ workflow_dispatch (item_id | categoria | loja)
        ┌──────┴──────────────────────────────────────┐
        │  Endpoints server-side (4 pares em paridade)│
        │  Flask app.py (dev)  ×  Vercel functions    │
        │  /api/config · /api/trigger-coleta          │
        │  /api/remover · /api/usuarios               │
        └─────────────────────────────────────────────┘
```

- **Coletor**: lê os itens monitorados, escolhe o scraper pela loja, grava a leitura
  em `historico_precos`, chama a RPC `verificar_alertas` e dispara Email + Telegram.
- **Frontend**: fala direto com o Supabase (chave pública + sessão; o RLS isola os
  dados por usuário). Operações privilegiadas passam por **funções serverless**
  (Vercel em produção, Flask em dev) que guardam os segredos no servidor.
- Os quatro endpoints existem em **duas implementações deliberadamente duplicadas**
  (Flask ↔ Vercel) — mantidas em sincronia, com o mesmo comportamento validado
  por testes espelhados.

### Stack

| Camada | Tecnologia |
|---|---|
| Scraping | Python 3.11 · Playwright (Chromium) · playwright-stealth |
| Notificações | Gmail SMTP (email HTML) · Telegram Bot API |
| Banco / Auth | Supabase (PostgreSQL + PostgREST + GoTrue) · RLS |
| Frontend | React 18 · Vite · React Router (SPA) |
| Dev server | Flask (serve o build e os `/api/*` em dev) |
| Hospedagem | Vercel (SPA + serverless functions) |
| Automação | GitHub Actions (cron + `workflow_dispatch`) |

---

## ✦ Rodando localmente

### Coletor

```bash
pip install -r requirements.txt
playwright install chromium        # 1ª vez
python main.py                     # coleta completa
```

Escopo por variáveis de ambiente (as mesmas que o workflow usa):

```bash
ITEM_ID=<uuid>    python main.py   # só um item (mesmo pausado)
CATEGORIA=GPU     python main.py   # só uma categoria
LOJA=kabum        python main.py   # só uma loja (combinável com CATEGORIA)
```

Debug de uma loja com browser visível:

```bash
python -c "from scrapers.kabum import KabumScraper; print(KabumScraper(headless=False).coletar('<url>'))"
```

### Frontend (dois terminais)

```bash
# 1 — Flask: serve /api/* lendo o .env da raiz
pip install -r frontend-flask/requirements_flask.txt
cd frontend-flask && python app.py            # http://127.0.0.1:5000

# 2 — Vite: HMR, proxy de /api/* para o Flask — abra ESTE
cd frontend-flask/frontend && npm install && npm run dev   # http://localhost:3000
```

Build de produção: `cd frontend-flask/frontend && npm run build`.

### Variáveis de ambiente (`.env` na raiz)

Template em [`frontend-flask/.env.example`](frontend-flask/.env.example).

| Grupo | Variáveis |
|---|---|
| Supabase | `SUPABASE_URL` · `SUPABASE_SERVICE_KEY` (coletor/server) · `SUPABASE_ANON_KEY` (frontend) |
| Email | `EMAIL_REMETENTE` · `EMAIL_SENHA_APP` (senha de app do Google) · `EMAIL_DESTINATARIO` |
| Telegram | `TELEGRAM_BOT_TOKEN` · `TELEGRAM_CHAT_ID` |
| Disparo manual | `GITHUB_TOKEN` (PAT `actions:write`) · `GITHUB_OWNER` · `GITHUB_REPO` · `GITHUB_WORKFLOW` · `GITHUB_BRANCH` (opcional; branch alvo do dispatch, default `main`) |

**Segurança:** nada com prefixo `VITE_` guarda segredo (é inlinado no bundle
público). `GITHUB_TOKEN` e `SUPABASE_SERVICE_KEY` vivem só no servidor
(Flask/Vercel/CI). Os endpoints `/api/remover` e `/api/usuarios` exigem o token de
sessão do usuário e autorizam por **dono/admin**.

---

## ✦ CI — coleta agendada

[`.github/workflows/coletar.yml`](.github/workflows/coletar.yml) roda o coletor:

- **Cron**: todo dia às `12:00 UTC` (09:00 de Brasília)
- **Manual** (`workflow_dispatch`), com inputs opcionais:
  `item_id` (coleta pontual) · `item_ids` (lista filtrada do Dashboard) ·
  `categoria` · `loja` · `user_id` (coleta segmentada)

Secrets necessários no repositório: os mesmos do grupo Supabase/Email/Telegram acima.

## ✦ Deploy (Vercel)

- Projeto aponta para `frontend-flask/frontend/` (build Vite → `dist/`)
- SPA com rewrite `/((?!api/).*)` → `index.html`; as funções em `api/` atendem `/api/*`
- Envs no painel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (públicas, build) +
  `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GITHUB_TOKEN`, `GITHUB_OWNER`,
  `GITHUB_REPO`, `GITHUB_WORKFLOW` (server-side)

---

## ✦ Multiusuário & papéis

| Papel | `usuarios.nivel` | Pode |
|---|---|---|
| Usuário padrão | `1` | ver/gerenciar **apenas os próprios** itens, histórico e alertas |
| Admin | `2` | ver os itens **de todos** (filtro por usuário no Dashboard: Todos · Eu · dropdown) e, pela página **Usuários**: listar todos (último acesso, papel, status, nº de itens), criar usuários, trocar senhas, ligar/desligar o Telegram por usuário e **excluir usuário** (em cascata, com os dados dele) |

O isolamento é imposto no banco (**RLS**), não só na UI. O coletor usa a
`SERVICE_KEY` e continua coletando os itens de todos os usuários.

---

## ✦ Estrutura do repositório

```
├── main.py                     # entrada do coletor (CI)
├── scrapers/                   # ScraperBase + kabum / terabyte / pichau
├── notificacoes/               # email.py · telegram.py · formato.py
├── utils/                      # cliente Supabase (service key)
├── frontend-flask/
│   ├── app.py                  # Flask dev: serve o build + /api/* (paridade c/ Vercel)
│   └── frontend/               # SPA React (Vite)
│       ├── api/                # Vercel functions (trigger-coleta · remover · usuarios)
│       └── src/                # components/ hooks/ pages/ services/ styles/ utils/
├── project/
│   ├── banco.md                # documentação do banco (tabelas, RLS, RPCs)
│   ├── sprint_v1.md            # sprints da V1 (concluída)
│   ├── sprint_v2.md            # sprints da V2 (em andamento)
│   └── migrations/             # migrações SQL (aplicar no SQL Editor do Supabase)
└── .github/workflows/coletar.yml
```

## ✦ Documentação

- [`project/banco.md`](project/banco.md) — esquema do banco, relacionamentos, RLS,
  funções e fluxos de dados
- [`project/sprint_v1.md`](project/sprint_v1.md) — relatório de sprints da V1, concluída
  (`SPRINT | TEST | STATUS | RESULTS`) com todo o histórico de decisões
- [`project/sprint_v2.md`](project/sprint_v2.md) — planejamento das sprints da V2
  (atualizações e correções em andamento)
- [`CLAUDE.md`](CLAUDE.md) — guia de arquitetura para desenvolvimento assistido

## ✦ Licença

[MIT](LICENSE) © 2026 Henrique Canhadas
