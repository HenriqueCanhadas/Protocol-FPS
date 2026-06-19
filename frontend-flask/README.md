# PROTOCOL FPS — Frontend React + Flask

Frontend reestruturado em **React (Vite)** com **Flask** como servidor de desenvolvimento local.

---

## Estrutura de pastas

```
frontend-flask/
├── app.py                    # Flask: serve o SPA em dev e expõe /api/config
├── requirements_flask.txt    # Dependências do Flask
├── .env.example              # Template de variáveis de ambiente
│
└── frontend/
    ├── index.html            # Entry point do Vite
    ├── vite.config.js        # Proxy /api → Flask em dev
    ├── package.json
    ├── vercel.json           # Deploy na Vercel (SPA + headers)
    ├── .env.production       # Documentação de variáveis para Vercel
    │
    └── src/
        ├── main.jsx          # Monta React no DOM
        ├── App.jsx           # Roteamento + Auth gate
        │
        ├── styles/
        │   └── theme.css     # Tokens de design (idêntico ao original)
        │
        ├── services/
        │   └── supabase.js   # Client Supabase (dev → Flask, prod → VITE_*)
        │
        ├── hooks/
        │   ├── useAuth.js    # Estado de autenticação
        │   └── useToast.js   # Toast global
        │
        ├── components/
        │   ├── LoginScreen.jsx
        │   ├── NavDrawer.jsx
        │   ├── AppHeader.jsx
        │   ├── ConfirmModal.jsx
        │   └── Toast.jsx
        │
        └── pages/
            ├── Dashboard.jsx    # Tabela de preços, stats, alertas
            ├── NovoProduto.jsx  # Formulário de cadastro
            └── Conta.jsx        # Perfil e segurança
```

---

## Desenvolvimento local

### 1. Variáveis de ambiente

```bash
# Na raiz do repositório Protocol-FPS
cp .env.example .env
# Edite .env com suas chaves reais
```

### 2. Instalar dependências

```bash
# Backend Flask
pip install -r frontend-flask/requirements_flask.txt

# Frontend React
cd frontend-flask/frontend
npm install
```

### 3. Rodar em dev (dois terminais)

**Terminal 1 — Flask** (serve `/api/config` com as envs do `.env`):
```bash
cd frontend-flask/
python app.py
# http://127.0.0.1:5000
```

**Terminal 2 — Vite** (HMR, proxy `/api` → Flask):
```bash
cd frontend-flask/frontend/
npm run dev
# http://localhost:3000  ← abra este
```

> O Vite redireciona `/api/*` automaticamente para o Flask.  
> Acesse sempre pelo **Vite (`localhost:3000`)** para ter Hot Module Replacement.

---

## Deploy na Vercel

👉 **Guia passo a passo completo (do zero ao deploy): [`DEPLOY_VERCEL.md`](./DEPLOY_VERCEL.md)**

Resumo:

1. No painel Vercel → **Add New Project** → importe o repo
2. Configure **Root Directory** como `frontend-flask/frontend`
3. Em **Settings → Environment Variables**, adicione:

| Variável                 | Exposição        | Valor                       |
|--------------------------|------------------|-----------------------------|
| `VITE_SUPABASE_URL`      | 🌐 Cliente (público) | `https://xxxx.supabase.co`  |
| `VITE_SUPABASE_ANON_KEY` | 🌐 Cliente (público) | `eyJhbG...` (chave **anon**) |
| `GITHUB_TOKEN`           | 🔒 **Servidor**  | PAT com `actions:write`     |
| `GITHUB_OWNER`           | 🔒 Servidor      | `HenriqueCanhadas`          |
| `GITHUB_REPO`            | 🔒 Servidor      | `Protocol-FPS`              |
| `GITHUB_WORKFLOW`        | 🔒 Servidor      | `coletar.yml`               |

4. **Deploy** — o `vercel.json` cuida do SPA routing e a função `api/trigger-coleta.js` é detectada automaticamente.

> ⚠️ **NUNCA** prefixe as variáveis do GitHub com `VITE_`. Tudo que começa com `VITE_`
> é embutido no bundle JavaScript e fica **público** no navegador. O `GITHUB_TOKEN`
> deve ficar **sem prefixo** — ele é lido apenas pela Serverless Function
> (`api/trigger-coleta.js`), no servidor.
>
> O Flask **não** é usado em produção: o React fala direto com o Supabase (via `VITE_*`)
> e o disparo do workflow passa pela função serverless da Vercel.

---

## Rotas do SPA

| Rota            | Página             |
|-----------------|--------------------|
| `/`             | Dashboard          |
| `/novo-produto` | Novo Produto       |
| `/conta`        | Minha Conta        |

Aliases legados (`/novo_produto`, `/usuario`) redirecionam automaticamente.

---

## Visual

Mantém **exatamente** o mesmo design do frontend original:
- Tema dark terminal / cyberpunk
- Verde neon `#39ff14` + preto
- Fontes: JetBrains Mono + Bebas Neue
- Scanlines, glow, animações CSS
- Login subtitle: **H**ardware **P**rice **C**ontroller
- Footer: **L**ive **M**onitor · **G**uard **M**arket
