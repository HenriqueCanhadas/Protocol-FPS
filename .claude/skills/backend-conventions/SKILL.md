---
name: backend-conventions
description: Estruturas, rotas e ordem obrigatória do back-end do PROTOCOL FPS — o loop de coleta em main.py (precedência dos 4 modos, ordem histórico→alertas→email→telegram), o contrato dos scrapers (ScraperBase, ordem de extração JSON-LD→meta→CSS→JS), e as 4 rotas de API duplicadas em Flask (app.py) e Vercel (frontend/api/*.js), incluindo a ordem obrigatória de validação/autenticação/autorização/execução em cada uma. Use ao criar ou alterar rotas de API, scrapers, o loop do main.py, ou qualquer coisa que precise seguir a mesma ordem/estrutura já estabelecida no projeto.
---

# Backend — Estruturas, Rotas e Ordem (PROTOCOL FPS)

Referência para alterar `main.py`, `scrapers/`, `notificacoes/`, `utils/`, `frontend-flask/app.py`
ou `frontend-flask/frontend/api/*.js`. O objetivo desta skill é preservar a **ordem** e a
**estrutura** já estabelecidas — não são escolhas arbitrárias, cada uma existe por um motivo
registrado no código ou no `CLAUDE.md`.

## Quando usar

- Adicionar/alterar um modo de coleta, um filtro ou um escopo no `main.py`.
- Criar uma nova rota de API ou alterar uma existente (`app.py` / `frontend/api/*.js`).
- Adicionar um novo scraper de loja.
- Alterar o fluxo de alertas/notificações.
- Qualquer mudança de schema (nova coluna, tabela, RLS).

## 1. As duas metades não se importam entre si

O coletor (`main.py` + `scrapers/` + `notificacoes/` + `utils/`) e o frontend
(`frontend-flask/`) **nunca se importam diretamente**. Toda comunicação passa por:
- Supabase (leitura/escrita nas tabelas), ou
- a API `workflow_dispatch` do GitHub (o frontend dispara o coletor).

Nunca adicione um `import` de um lado para o outro — se precisar compartilhar lógica,
ela pertence a um dos dois lados e o outro chama via Supabase/HTTP.

## 2. Ordem de precedência dos modos de coleta (`_selecionar_itens`, `main.py`)

A ordem é fixa e **não pode ser reordenada** sem quebrar o contrato com o frontend
(`/api/trigger-coleta` monta o payload assumindo esta precedência):

1. `ITEM_ID` (pontual) — vence tudo, mesmo `monitorando = false`. Ignora todo o resto.
2. `ITEM_IDS` (lista, Sprint 14) — ignora `CATEGORIA`/`LOJA`/`USER_ID`.
3. `CATEGORIA` e/ou `LOJA` e/ou `USER_ID` (segmentado) — combináveis entre si.
4. Nada definido — coleta completa (`monitorando = true`).

Qualquer novo escopo de coleta deve ser inserido **nesta ordem de precedência** e
replicado nos três pontos que a conhecem: `main.py:_selecionar_itens`,
`frontend-flask/app.py:api_trigger_coleta`, `frontend/api/trigger-coleta.js`, e os
`inputs` de `.github/workflows/coletar.yml`.

## 3. Ordem fixa do loop de coleta (`main.py:main`)

Para cada item, a sequência é sempre:

1. Escolher o scraper pelo slug da loja (`lojas.nome` lowercased, espaços removidos) no
   dict `SCRAPERS`. Loja desconhecida → loga aviso e `continue` (não interrompe o run).
2. `ScraperClass().coletar(url)` → `DadosProduto`.
3. Logar o resultado (preço OK / esgotado / inconsistente).
4. **Se `preco is None` → não salva histórico e passa para o próximo item.**
5. Inserir em `historico_precos` **antes** de qualquer outra coisa — o `id` retornado
   (`historico_id`) é FK obrigatória da tabela `alertas` no passo 8.
6. **Se `disponivel` for `false` → não verifica alertas** (produto esgotado não dispara
   alerta de preço).
7. Chamar a RPC `verificar_alertas(p_item_id, p_preco_atual)`. Se a RPC falhar, trata
   como "sem alertas" (loga warning, não interrompe o item).
8. Para cada alerta retornado, **nesta ordem**:
   a. Resolver o dono do item (`usuarios` carregado por `_carregar_usuarios`).
   b. Enviar **email sempre** (para o email do dono, ou `EMAIL_DESTINATARIO` se
      ownerless) — captura o resultado real (`ok_email`).
   c. Enviar **Telegram só se** `dono.telegram` (`notificar_telegram = true`) — captura
      o resultado real (`ok_telegram`); senão marca `False` sem tentar enviar.
   d. Inserir a linha em `alertas` **por último**, com `notificado_email`/
      `notificado_telegram` = os valores reais capturados em (b)/(c) — nunca assuma
      sucesso; a tabela deve refletir o que de fato aconteceu.

Não pule etapas nem troque a ordem (ex.: nunca insira em `alertas` antes de tentar o
envio, nem verifique alertas antes de salvar o histórico).

## 4. Contrato dos scrapers (`scrapers/`)

`ScraperBase` (ABC) cuida de toda a infraestrutura Playwright/anti-bot. Uma nova loja
implementa **só** dois métodos, nesta ordem de chamada:

1. `_aguardar_preco(page)` — espera o seletor de preço ou de indisponibilidade aparecer.
2. `extrair_dados(page, url)` — parseia a página carregada → `DadosProduto`.

Dentro de `extrair_dados`, a estratégia de extração é **sempre** mais-estável-primeiro,
nesta ordem, parando no primeiro que funcionar:

1. JSON-LD
2. Meta tags
3. Seletores CSS
4. Varredura de texto completo via JS

**Indisponibilidade é decidida antes do preço** (JSON-LD `availability` OU seletor DOM
de esgotado) — nunca inverta essa ordem, um produto esgotado pode ainda ter um preço
"fantasma" no HTML. Use `self._limpar_preco` para converter `"R$ 3.299,90"` → `3299.90`.

Para registrar uma loja nova: criar a subclasse + adicionar entrada no dict `SCRAPERS`
em `main.py`, com a chave = slug (nome da loja lowercased, sem espaços).

**Pichau é conhecidamente não confiável em CI** (bloqueia IP de datacenter) — não trate
falha do Pichau nos logs do Actions como regressão do scraper.

## 5. As 4 rotas de API — sempre duplicadas, sempre na mesma ordem interna

Toda rota existe em **duas implementações deliberadamente espelhadas**:
Flask (`frontend-flask/app.py`, dev) e Vercel (`frontend-flask/frontend/api/*.js`, prod).
**Qualquer alteração em uma exige a mesma alteração na outra** — mesmo shape de
request/response, mesmos códigos de erro.

Rotas: `/api/config` (GET, só Flask — em prod o Vite inlina as `VITE_*` no build),
`/api/trigger-coleta`, `/api/remover`, `/api/usuarios`.

As rotas protegidas (`/api/remover`, `/api/usuarios`) seguem **sempre esta ordem
interna** — não pule nem reordene etapas:

1. Checar se as env vars server-side necessárias estão configuradas (`SUPABASE_URL` /
   `SUPABASE_SERVICE_KEY`) → 500 se ausentes.
2. Parsear e validar o formato do payload (campos obrigatórios, enums de `tipo`/`acao`)
   → 400 se inválido.
3. Autenticar: extrair `Authorization: Bearer <token>`, validar via
   `_usuario_do_token` (chama `/auth/v1/user` do Supabase) → 401 se ausente/inválido.
4. Autorizar: dono do recurso ou admin (`usuarios.nivel >= 2`) → 403 se não autorizado.
   `/api/usuarios` **não tem modo legado** — exige admin sempre, sem fallback.
5. Executar a ação.
6. Se a ação envolve deletar linhas com FK, seguir a **cascata manual** (não há
   `ON DELETE CASCADE` no banco): `alertas` → `historico_precos` → `itens` → (para
   exclusão de usuário) conta em `auth.users` por último, que aí sim cascateia para
   `usuarios`.

**Paginação**: qualquer leitura que possa passar de 1000 linhas (teto do PostgREST)
usa um loop de offset (`limit=1000&offset=N`, repete enquanto a página vier cheia) —
ver `_supabase_get` em `/api/usuarios` (contagem de itens, exclusão de usuário).

**Paridade de rota no Flask**: o catch-all SPA (`static_url_path=""`) captura
`/api/...` antes do handler dedicado; por isso existe a rota explícita
`/api/<path:_sub>` (404 JSON) e o `errorhandler(404)` que serve `index.html` para
rotas de página sem extensão. Preserve esse comportamento ao mexer no roteamento do
Flask — ele existe só para espelhar o rewrite `/((?!api/).*)` do Vercel em produção.

## 6. Schema / migrations

Mudança de schema → arquivo novo em `project/migrations/sprint<N>_<descricao>.sql`,
rodado manualmente no SQL Editor do Supabase (a service key não executa DDL). Depois
de aplicar, atualizar `project/banco.md` (schema/RLS/fluxo de dados documentados lá).

## 7. Regra de segurança de env vars

Nada que precise ficar só no servidor pode ter o prefixo `VITE_` — qualquer `VITE_*`
é inlinado no bundle JS público. `GITHUB_TOKEN` e `SUPABASE_SERVICE_KEY` nunca levam
esse prefixo.
