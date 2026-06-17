# PROTOCOL FPS — Frontend React + Flask

Frontend reestruturado em **React (Vite)** com **Flask** como servidor de desenvolvimento local.

---

## Estrutura de pastas

```
protocol-fps-react/
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
pip install -r protocol-fps-react/requirements_flask.txt

# Frontend React
cd protocol-fps-react/frontend
npm install
```

### 3. Rodar em dev (dois terminais)

**Terminal 1 — Flask** (serve `/api/config` com as envs do `.env`):
```bash
cd protocol-fps-react/
python app.py
# http://127.0.0.1:5000
```

**Terminal 2 — Vite** (HMR, proxy `/api` → Flask):
```bash
cd protocol-fps-react/frontend/
npm run dev
# http://localhost:3000  ← abra este
```

> O Vite redireciona `/api/*` automaticamente para o Flask.  
> Acesse sempre pelo **Vite (`localhost:3000`)** para ter Hot Module Replacement.

---

## Deploy na Vercel

1. No painel Vercel → **Add New Project** → importe o repo
2. Configure **Root Directory** como `protocol-fps-react/frontend`
3. Em **Settings → Environment Variables**, adicione:

| Variável               | Valor                          |
|------------------------|-------------------------------|
| `VITE_SUPABASE_URL`    | `https://xxxx.supabase.co`    |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...`                 |
| `VITE_GITHUB_TOKEN`    | PAT com `actions:write`        |
| `VITE_GITHUB_OWNER`    | `HenriqueCanhadas`            |
| `VITE_GITHUB_REPO`     | `Protocol-FPS`                |
| `VITE_GITHUB_WORKFLOW` | `coletar.yml`                 |

4. **Deploy** — o `vercel.json` cuida do SPA routing automaticamente.

> O Flask **não** é usado em produção. O React chama o Supabase diretamente  
> via `VITE_*` e o GitHub Actions via API REST.

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
