# Deploy na Vercel — PROTOCOL FPS (do zero ao ar)

Guia passo a passo para publicar o frontend React (Vite) na Vercel, incluindo a
Serverless Function que dispara o GitHub Actions com segurança.

> **Arquitetura em produção**
> - O **React** (build estático do Vite) é servido pela Vercel.
> - O **Flask (`app.py`) NÃO vai para produção** — ele é só o servidor de _dev_ local.
> - O React fala **direto** com o Supabase usando as chaves `VITE_*`.
> - O botão "COLETAR AGORA" chama `POST /api/trigger-coleta`, que na Vercel é a
>   **Serverless Function** `frontend/api/trigger-coleta.js`. O `GITHUB_TOKEN` vive
>   **só no servidor** — nunca chega ao navegador.

---

## 🔐 Conceito mais importante: `VITE_` vs. sem prefixo

A regra que **não pode** ser quebrada:

| Prefixo            | Onde acaba                                   | Use para                         |
|--------------------|----------------------------------------------|----------------------------------|
| `VITE_...`         | **Embutido no bundle JS → público no browser** | Só dados públicos (URL + anon key) |
| **Sem prefixo**    | Fica no servidor (Serverless Function)       | Segredos: `GITHUB_TOKEN`, etc.   |

❌ **Nunca** crie `VITE_GITHUB_TOKEN` / `VITE_SUPABASE_SERVICE_KEY`. Qualquer pessoa
abre o "view-source" e lê o valor.
✅ A `SUPABASE_ANON_KEY` é **pública por design** (protegida por RLS no banco), então
`VITE_SUPABASE_ANON_KEY` é seguro. O `SERVICE_KEY` **jamais** vai para o frontend.

---

## Passo 0 — Pré-requisitos

- [ ] Código no GitHub (repo `Protocol-FPS`).
- [ ] Conta na Vercel (pode logar com o GitHub): <https://vercel.com/signup>.
- [ ] Projeto no Supabase já criado.
- [ ] Local: `node >= 18` e `npm` (apenas para testar o build antes de subir).

---

## Passo 1 — Reúna as 6 variáveis

### Supabase (2 — públicas, vão com `VITE_`)
No painel Supabase → **Project Settings → API**:
- `VITE_SUPABASE_URL`  → campo **Project URL** (ex: `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` → chave **`anon` / `public`**
  (⚠️ **NÃO** use a `service_role` aqui)

### GitHub (4 — secretas, **sem** prefixo)
- `GITHUB_TOKEN` → crie em **GitHub → Settings → Developer settings →
  Personal access tokens → Fine-grained tokens → Generate new token**:
  - **Repository access:** apenas o repo `Protocol-FPS`
  - **Permissions → Repository → Actions:** `Read and write`
  - Copie o token (`github_pat_...`) — ele só aparece uma vez.
- `GITHUB_OWNER` → `HenriqueCanhadas`
- `GITHUB_REPO` → `Protocol-FPS`
- `GITHUB_WORKFLOW` → `coletar.yml`

> 💡 Esse PAT é o mesmo conceito usado no GitHub Actions, mas aqui ele permite que o
> botão do site dispare o workflow `workflow_dispatch` manualmente.

---

## Passo 2 — Teste o build localmente (opcional, recomendado)

Garante que não há erro de build antes de gastar um deploy:

```bash
cd frontend-flask/frontend
npm install
npm run build      # gera frontend/dist/
npm run preview    # serve o dist em http://localhost:4173 para conferir
```

Se o `npm run build` passar sem erros, a Vercel também vai passar.

---

## Passo 3 — Crie o projeto na Vercel

1. Vercel → **Add New… → Project**.
2. **Import Git Repository** → selecione `Protocol-FPS`.
3. ⚠️ **Root Directory** (campo mais importante): clique em **Edit** e selecione:
   ```
   frontend-flask/frontend
   ```
   Esse é o diretório onde estão o `package.json`, o `vite.config.js`, o
   `vercel.json` e a pasta `api/`. **Sem isso o deploy não acha o app.**
4. **Framework Preset:** deixe em **Other** (o `vercel.json` já define tudo).
5. **Build & Output** — já vem do `vercel.json`, não precisa mexer:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`

> Ainda **não** clique em Deploy — configure as variáveis primeiro (Passo 4),
> senão o primeiro deploy sobe sem as chaves.

---

## Passo 4 — Configure as Environment Variables

Em **Settings → Environment Variables** (ou na própria tela de import), adicione as 6.
Marque os 3 ambientes (**Production, Preview, Development**) em cada uma:

| Nome                     | Valor                            | Prefixo `VITE_`? |
|--------------------------|----------------------------------|------------------|
| `VITE_SUPABASE_URL`      | `https://cpdwowfbpovfsumpcdiw.supabase.co` | ✅ sim (público) |
| `VITE_SUPABASE_ANON_KEY` | a chave **anon**                 | ✅ sim (público) |
| `GITHUB_TOKEN`           | seu novo PAT `github_pat_...`    | ❌ **NÃO**       |
| `GITHUB_OWNER`           | `HenriqueCanhadas`               | ❌ não           |
| `GITHUB_REPO`            | `Protocol-FPS`                   | ❌ não           |
| `GITHUB_WORKFLOW`        | `coletar.yml`                    | ❌ não           |

> ✍️ Ao colar os valores, **não** deixe espaços antes/depois — a Vercel preserva o
> que você colar literalmente.

---

## Passo 5 — Deploy

Clique em **Deploy**. A Vercel vai:
1. Rodar `npm install` + `npm run build` → gerar `dist/`.
2. Detectar `api/trigger-coleta.js` como **Serverless Function** em `/api/trigger-coleta`.
3. Aplicar o SPA routing do `vercel.json` (tudo que não for `/api/*` cai no `index.html`).

Ao terminar, você recebe uma URL `https://protocol-fps-xxxx.vercel.app`.

---

## Passo 6 — Verifique

1. **App abre?** Acesse a URL → tela de login deve aparecer.
2. **Supabase conectou?** Faça login → o Dashboard carrega os preços.
3. **Função serverless responde?** Clique em **COLETAR AGORA**.
   - ✅ Sucesso → toast de OK e o workflow aparece em **GitHub → Actions**.
   - ❌ Veja **Vercel → Deployments → Functions → Logs** para o erro.
4. **Confirme que o token NÃO vazou** (teste de segurança):
   - Abra o DevTools → aba **Sources** ou **Network** e procure por `github_pat`
     no bundle `.js`. **Não pode aparecer.** Se aparecer, alguma variável foi criada
     com prefixo `VITE_` por engano — remova e refaça o deploy.

---

## Passo 7 — Atualizações futuras

A Vercel reimplanta **automaticamente** a cada `git push` na branch de produção
(`main`, por padrão). Pull requests geram **Preview Deployments** com URL própria.

Para mudar variáveis depois: **Settings → Environment Variables**, edite, e em
**Deployments → ⋯ → Redeploy** force um novo build (variáveis só entram no build seguinte).

---

## Troubleshooting

| Sintoma | Causa provável | Correção |
|---|---|---|
| Build falha: "could not read package.json" | Root Directory errado | Ajuste para `frontend-flask/frontend` |
| Página em branco / 404 ao recarregar uma rota | SPA routing | Confirme o `rewrites` no `vercel.json` |
| `COLETAR AGORA` → erro 500 "não configuradas" | Faltam `GITHUB_TOKEN/OWNER/REPO` | Adicione as vars **sem** `VITE_` e redeploy |
| `COLETAR AGORA` → 401 | PAT inválido/expirado | Gere novo PAT com `actions:write` |
| `COLETAR AGORA` → 404 | Workflow não encontrado | Cheque `GITHUB_WORKFLOW=coletar.yml` e o nome do arquivo em `.github/workflows/` |
| Login falha / "Invalid API key" | `VITE_SUPABASE_*` ausente ou errada | Confirme URL + chave **anon** (não service) |
| `github_pat` aparece no bundle JS | Token criado com prefixo `VITE_` | Remova `VITE_GITHUB_TOKEN`, recrie como `GITHUB_TOKEN`, **rotacione o PAT** |

---

## Checklist final

- [ ] Root Directory = `frontend-flask/frontend`
- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configuradas (com `VITE_`)
- [ ] `GITHUB_TOKEN/OWNER/REPO/WORKFLOW` configuradas (**sem** `VITE_`)
- [ ] Build passou e o app abre
- [ ] Login + Dashboard funcionam
- [ ] `COLETAR AGORA` dispara o workflow
- [ ] `github_pat` **não** aparece no DevTools
