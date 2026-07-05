# PROTOCOL FPS — Planejamento de Sprints

> Relatório gerado a partir do arquivo `todo` (raiz do repositório).
> Data de geração: **05/07/2026**. Início do planejamento: **02/07/2026**.
>
> **Legenda de status**
> - ✅ **Done** — concluído (item `OK-` no `todo`)
> - 🟡 **Pending** — iniciado mas não finalizado (item `Pending-` no `todo`)
> - ⬜ **Todo** — a fazer / ainda não iniciado (item `-` no `todo`)
>
> **Colunas da tabela**
> - **SPRINT** — sprint + tarefa (com a referência da linha no `todo`)
> - **TEST** — critério de aceite / como validar
> - **STATUS** — ✅ / 🟡 / ⬜
> - **RESULTS** — resultado atual ou resultado esperado ao concluir

---

## Visão geral do cronograma

| Sprint | Tema | Período | Dias | Itens |
|--------|------|---------|------|-------|
| Sprint 0 | Baseline concluído (histórico) | até 01/07/2026 | — | 21 ✅ |
| Sprint 1 | Estabilização de Infra & CI | 02/07 – 04/07 | 3 | 3 ✅ |
| Sprint 2 | Refatoração do Frontend (Flask + React) | 07/07 – 09/07 | 3 | 2 ✅ |
| Sprint 3 | Enriquecimento de dados na UI | 10/07 – 12/07 | 3 | 3 ✅ |
| Sprint 4 | Coleta segmentada & filtros | 14/07 – 16/07 | 3 | 3 ✅ |
| Sprint 5 | Multiusuário & Admin | 17/07 – 21/07 | 5 | 2 ✅ |
| Sprint 6 | Documentação & refino | 22/07 – 23/07 | 2 | 3 ✅ |
| Sprint 7 | Gestão de usuários (admin) | 24/07 – 25/07 | 2 | 2 ✅ |

**Total planejado (Sprints 1–7):** 21 dias úteis · **0 tarefas a fazer** —
🏁 **todas as 18 tarefas das Sprints 1–7 concluídas em 05/07/2026** (39 no total
contando o baseline da Sprint 0; nenhuma pendente).

---

## Sprint 0 — Baseline concluído (histórico)

Itens já entregues (`OK-` no `todo`). Servem de base para os próximos sprints.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S0 · Remover produto e tudo atrelado no banco (todo:1) | Remover um produto e confirmar que histórico/alertas somem no Supabase | ✅ Done | Exclusão em cascata funcionando |
| S0 · Melhorar visualização das páginas + cor das letras (todo:3) | Abrir cada página e conferir legibilidade/contraste | ✅ Done | Fontes maiores e cores ajustadas |
| S0 · Menu hambúrguer no lugar da navegação no topo (todo:5) | Abrir em tela pequena e alternar seções | ✅ Done | Menu hambúrguer ativo |
| S0 · Nome completo em "Menor preço hoje" (todo:7) | Verificar card sem truncar o nome | ✅ Done | Nome exibido por completo |
| S0 · Desativar monitoramento → status OFF vermelho (todo:9) | Desativar item e ver badge "OFF" vermelho | ✅ Done | Badge OFF implementado |
| S0 · Desativar monitoramento de produto X (todo:11) | Alternar `monitorando` por item | ✅ Done | Toggle por produto |
| S0 · Data + hora na "Última coleta" (todo:13) | Ver ex.: `03/06/2026 22:12` | ✅ Done | Data + hora exibidas |
| S0 · Alterar a meta de valor (todo:15) | Editar meta e persistir no banco | ✅ Done | Edição de meta OK |
| S0 · Campo de busca por produto/loja (todo:17) | Buscar por nome e por loja | ✅ Done | Busca funcional |
| S0 · Ordenar tabela por nome/valor (todo:19) | Ordenar asc/desc por nome e preço | ✅ Done | Ordenação funcional |
| S0 · Nome clicável no Monitor de Preços (todo:21) | Clicar e ser redirecionado ao produto | ✅ Done | Links ativos |
| S0 · Botão de disparo de coleta manual (todo:23) | Apertar botão e disparar coleta | ✅ Done | Gatilho `workflow_dispatch` |
| S0 · Hospedagem gratuita (todo:25) | Acessar URL pública | ✅ Done | Deploy no Vercel |
| S0 · requirements.txt back + CI (todo:27) | CI instala deps e roda `main.py` | ✅ Done | Back configurado (front não precisa) |
| S0 · Easter egg (todo:29) | Acionar easter egg | ✅ Done | Implementado |
| S0 · Formatação de email/telegram (todo:31) | Disparar alerta e conferir mensagem | ✅ Done | Foco no retorno do Telegram |
| S0 · Menu de opções na coluna Ações (todo:33) | Ver "Editar Meta", "Desativar", "Coletar Agora" | ✅ Done | Menu de ações |
| S0 · Formatar seção Ações (histórico/remover/ativar) (todo:35) | Conferir layout das ações | ✅ Done | Layout ajustado |
| S0 · Remover monitoramento específico front+banco (todo:37) | Remover leitura específica (ex.: dia 3, 19h) | ✅ Done | Remoção pontual |
| S0 · Remover múltiplos monitoramentos específicos (todo:39) | Selecionar vários e remover | ✅ Done | Seleção múltipla validada |
| S0 · Corrigir sobreposição no histórico (todo:41) | Rolar modal e ver linha verde sem cobrir o título | ✅ Done | Z-index/sticky corrigido |

---

## Sprint 1 — Estabilização de Infra & CI (02/07 – 04/07)

Foco: deixar a coleta em CI confiável e o horário correto antes de mexer em features.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S1 · Ajustar GitHub Actions p/ Pichau e Terabyte (todo:47) | Rodar `workflow_dispatch` 3×; comparar preço/estoque local × CI para Pichau e Terabyte | ✅ Done | **Terabyte estabilizada: 3/3 runs no CI = local** (runs 64/65/66: R$ 7.799,99 ✅). Kabum idem 3/3 (R$ 2.499,99 ✅). **Pichau: bloqueio por IP de datacenter confirmado 3/3** — página falsa "Site em Manutenção - Pru Pru" a IPs GitHub/Azure; fix detecta o bloqueio, faz 3 retries (10s/20s) e loga honestamente ("Challenge/Bloqueio Pichau" em vez de falso "esgotado"). **Decisão 01/07/2026: limitação aceita** — Pichau coleta só local; alternativas futuras: runner self-hosted ou proxy residencial BR |
| S1 · Resolver aviso de deprecação Node.js 20 no Actions (todo:57) | Ver o log do Actions sem o aviso de Node 20 | ✅ Done | `checkout@v7` + `setup-python@v6` (Node 24 nativo); flag `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` removida. Validado nos runs 64 e 65: **0 annotations** de deprecação |
| S1 · Ajustar fuso horário UTC-3 (Brasília) back/front/banco (todo:55) | Coletar um item e conferir o mesmo horário local em back, front e Supabase | ✅ Done | Banco correto (timestamptz UTC `+00:00`); Telegram já usava UTC-3 fixo; front agora força `America/Sao_Paulo` via `utils/datas.js` (teste: 14:22 UTC → 11:22 BRT). "Alertas hoje" conta o dia civil de Brasília |

---

## Sprint 2 — Refatoração do Frontend (07/07 – 09/07)

Foco: organizar a estrutura de pastas e alinhar as rotas ao Flask + React.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S2 · Melhorar estrutura de pastas do front (Flask + React) (todo:43) | Build (`npm run build`) e dev (Flask + Vite) continuam funcionando após reorganização | ✅ Done | Estrutura React já seguia o padrão `components/hooks/pages/services/utils/styles`. Adicionado **alias `@/` → `src/`** no `vite.config.js` + `jsconfig.json` (suporte no editor) e **todos os imports internos padronizados** para caminho absoluto `@/`. Build validado em **02/07/2026: 87 módulos, 0 erros**. Rename do aninhamento `frontend-flask/frontend/` NÃO feito por ser disruptivo (afeta `vercel.json`, `static_folder` do `app.py`, CI e docs) — deixado como decisão futura |
| S2 · Usar Flask para as rotas do front-end (todo:45) | Navegar pelas rotas servidas em dev sem quebrar o proxy `/api/*`; comportamento igual ao do Vercel em prod | ✅ Done | **Decisão 02/07/2026:** manter **SPA + React Router**. O Flask só roda em dev e o Vercel em prod — torná-lo "dono das rotas" seria regressão. Objetivo reinterpretado como **paridade dev × prod**: o catch-all do Flask (`serve_spa`) agora devolve **404 JSON** para `/api/*` inexistente, espelhando o rewrite do Vercel `/((?!api/).*)` (antes servia `index.html` para qualquer rota). `app.py` e as Vercel Functions seguem em sincronia |

---

## Sprint 3 — Enriquecimento de dados na UI (10/07 – 12/07)

Foco: dar mais contexto aos preços e permitir monitorar armazenamento.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S3 · Data e hora em "Preço Atual" (todo:49) | Ver a data/hora de referência do valor exibido em "Preço Atual" | ✅ Done | **Validado 02/07/2026:** `Dashboard.jsx` renderiza `price-timestamp` com `dataHoraBRT(item.coletado_em)` (dd/mm/aaaa hh:mm, horário de Brasília) por produto na coluna "Preço atual" |
| S3 · Campo "Armazenamento" (HD/SSD/NVMe) (todo:51) | Cadastrar novo produto com armazenamento e ver no dashboard | ✅ Done | **Corrigido 02/07/2026.** A validação revelou que o banco só tinha 5 categorias (sem STORAGE) e o form oferecia `SSD`/`COOLER` inexistentes — o cadastro **falhava**. Ações: inserida `produtos.categoria=STORAGE` (nome "Armazenamento"); `NovoProduto.jsx` alinhado a `[GPU,CPU,RAM,PSU,MOBO,STORAGE]` (removidos SSD/COOLER quebrados) com rótulo "Armazenamento"; filtro STORAGE do Dashboard agora tem categoria real. Uma categoria única cobre HD/SSD/NVMe (separá-las em 3 = passo futuro). Testado: as 6 categorias resolvem para `produto_id` + build 87 módulos |
| S3 · "Coletar Agora" apenas para o produto selecionado (todo:53) | Acionar "Coletar Agora" em um item e confirmar que só ele foi coletado | ✅ Done | **Implementado ponta a ponta (02/07/2026):** `workflow_dispatch` aceita input `item_id` → env `ITEM_ID`; `main.py._selecionar_itens` faz coleta **PONTUAL** (`eq id`) ou **COMPLETA**; endpoints Flask e Vercel repassam `item_id` no dispatch; menu "Opções › Coletar agora" coleta só o produto. **Testes:** scoping read-only real (pontual=1 / completo=4 / strip), ambos os endpoints com GitHub mockado (com/sem item_id + body string), build 87 módulos, `py_compile`, `node --check`. **E2E validado ao vivo (02/07/2026):** dispatch real na branch `Duplicate-Main` (run [28627184011](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28627184011), conclusão `success`) coletou **só o item alvo** (Kabum Ryzen 7 9800X3D → 1 registro novo em `historico_precos`, nenhum outro afetado). GitHub aceitou o input na branch (204, sem 422) → funcionará na `main` após merge |

---

## Sprint 4 — Coleta segmentada & filtros (14/07 – 16/07)

Foco: filtrar e coletar por categoria/loja em vez de sempre tudo.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S4 · Coletar por categoria (GPU/CPU/RAM/…) (todo:59) | Disparar coleta apenas de GPUs e confirmar que só elas foram coletadas | ✅ Done | **Implementado ponta a ponta (05/07/2026):** `main.py._selecionar_itens` ganhou modo **SEGMENTADO** via envs `CATEGORIA`/`LOJA` (combináveis; `ITEM_ID` mantém precedência); `workflow_dispatch` aceita inputs `categoria` e `loja` → envs; endpoints Flask e Vercel repassam no dispatch (paridade validada com GitHub mockado: 8/8 e 9/9 casos, payloads idênticos). **Scoping validado no banco real (read-only, 7/7 cenários):** completo=4, categoria, loja, combinado, normalização minúscula/espaços, precedência do pontual, categoria inexistente=0. **E2E ao vivo (05/07/2026):** run [#82](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28750800235) com `categoria=GPU`, conclusão `success` — log "Modo SEGMENTADO categoria=GPU", **3 itens** (só GPUs; CPU Kabum nem aparece); Terabyte +1 registro (R$ 7.799,99); 2 Pichau bloqueadas pelo challenge conhecido do CI; **CPU Kabum intocada no banco** |
| S4 · Filtros por loja e por produto de loja (todo:61) | Filtrar a lista por loja e por produto dentro de uma loja | ✅ Done | Filtro por loja já existia (chips âmbar). **Adicionado filtro por PRODUTO DE LOJA (05/07/2026):** ao selecionar uma loja, aparece um `select` listando somente os produtos dela; escolher um restringe a tabela àquele produto. **Combinável** com categoria e busca (todos compõem em `dadosFiltrados`); trocar de loja limpa o filtro de produto. Build 87 módulos, 0 erros |
| S4 · Coleta por loja/produto/categoria específica (todo:63) | Escolher escopo (loja OU produto OU categoria) e coletar só ele | ✅ Done | **Botão COLETAR AGORA respeita os filtros ativos (05/07/2026)** e vira **COLETAR FILTRADOS** quando há escopo: produto selecionado → coleta **pontual** (`item_id`); categoria/loja → coleta **segmentada** (combináveis, ex.: GPUs da Kabum); sem filtros → **completa**. A confirmação descreve o escopo exato antes do disparo. **E2E ao vivo (05/07/2026):** run [#83](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28750995029) com `loja=kabum`, conclusão `success` — log "Modo SEGMENTADO loja=kabum", **1 item**; CPU Kabum +1 registro (R$ 3.699,99); **GPUs intocadas no banco** |

---

## Sprint 5 — Multiusuário & Admin (17/07 – 21/07)

Foco: isolar monitoramentos por usuário e criar papel de administrador. **Refatoração do
banco aplicada em 05/07/2026** via `project/migrations/sprint5_multiusuario.sql` (rodada
no SQL Editor do Supabase pelo usuário; DDL não roda pela service key).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S5 · Monitoramentos separados por usuário (todo:67) | Usuário A vê só itens A; usuário B só itens B | ✅ Done | **Implementado (05/07/2026)** com refatoração do banco registrada em `project/migrations/sprint5_multiusuario.sql` (primeira migração versionada do repo): tabela **`usuarios`** (`nivel` 1=normal · 2=admin) espelhando `auth.users` via trigger de signup; **`itens.user_id`** (default `auth.uid()`, backfill dos 4 itens para a conta principal); **RLS por dono** em `itens`/`historico_precos`/`alertas` com `is_admin()` SECURITY DEFINER. `NovoProduto` grava o dono; **`/api/remover` agora exige o token da sessão** e autoriza só dono/admin (401 sem sessão, 403 alheio) em paridade Flask × Vercel (9/9 casos mockados em cada). Coletor (SERVICE_KEY) segue ignorando RLS. **E2E real 27/27 (05/07/2026):** usuário B de teste viu 0 itens, cadastrou 1 e viu só o dele; 0 histórico/alertas/perfis alheios; UPDATE em item alheio = 0 linhas; remover alheio = 403; cleanup completo |
| S5 · Usuário Admin vê todos os produtos por usuário (todo:69) | Logar como admin e ver os itens de todos, agrupados por usuário | ✅ Done | **Implementado (05/07/2026):** `pedrosacanhadas@gmail.com` promovido a **admin** (`usuarios.nivel=2`; decisão registrada). `useAuth` carrega o perfil e expõe `isAdmin`; Dashboard admin ganha a linha **◈ USUÁRIOS** com chips por dono (com contagem por usuário) + etiqueta do dono em cada item ("você" para os próprios); página Conta exibe o papel (ADMIN/NORMAL). **E2E real:** admin de teste viu **todos** os itens (5 de 5, 2 donos distintos), todos os perfis e o histórico de todos; removeu item de outro usuário via `/api/remover` (200). Usuário normal permanece com a UI de sempre, só com os itens dele |

---

## Sprint 6 — Documentação & refino (22/07 – 23/07)

Foco: documentar o banco, repensar a métrica de alertas e fechar o README.
**Executada em 05/07/2026 — última sprint do projeto** (rodou após a Sprint 7,
que foi adicionada e concluída no mesmo dia).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S6 · Documentação do banco (estrutura e referências) (todo:75) | Abrir o doc e conferir tabelas `itens`, `lojas`, `historico_precos`, `alertas`, `usuarios` + RPC `verificar_alertas` | ✅ Done | **Criado `project/banco.md` (05/07/2026) por introspecção do banco REAL** (OpenAPI do PostgREST + sondas read-only): matriz de acesso (quem usa qual chave × RLS), diagrama de relacionamentos, **6 tabelas ativas coluna a coluna** com tipos/defaults/FKs reais, dados de referência (3 lojas com slugs do `SCRAPERS`, 6 categorias), view `ultimo_preco` (registrada como não usada pelo front), **RPC `verificar_alertas` decifrada por sonda** — read-only confirmado (contagem de `alertas` idêntica antes/depois); `queda_preco` = qualquer queda vs. última leitura; `abaixo_meta` = preço < meta; ambas podem vir juntas —, `is_admin()` + trigger de perfil, tabela completa das políticas RLS com ausências deliberadas, fluxos de dados, **6 tabelas legadas descobertas** (Funko/Kabum antigas, candidatas a limpeza) e convenção de migrações |
| S6 · Repensar métrica "Alertas hoje" (todo:65) | Validar novo cálculo/exibição de "Alertas hoje" | ✅ Done | **Modelo definido pelo usuário (05/07/2026): "Oportunidades agora".** Card virou **"ABAIXO DA META"**: conta itens ativos com preço atual < `preco_meta`, sub "de N com meta definida". Resolve os 3 defeitos do modelo antigo (quase sempre 0 com 1 coleta/dia; zerava à meia-noite; contava em dobro `abaixo_meta`+`queda_preco` da mesma leitura). Cálculo 100% client-side a partir dos dados já carregados (estado `statsAlertas` removido); a seção "Alertas recentes" continua listando os disparos do dia. **Validado contra o banco real:** card "0 de 4 com meta definida" correto (4 itens com meta, todos acima dela); build 88 módulos |
| S6 · Atualizar README.md do projeto (todo:77) | Ler o README no GitHub e entender o projeto sem abrir o código | ✅ Done | **Escrito no fechamento de todas as sprints (05/07/2026)**, respeitando a condição do `todo`. README completo em português: funcionalidades, limitação conhecida (Pichau × IP de datacenter), **diagrama de arquitetura** (coletor × SPA × Supabase × 4 pares de endpoints Flask/Vercel), stack, como rodar local (coletor com escopos `ITEM_ID`/`CATEGORIA`/`LOJA` + front em 2 terminais), tabela de envs com a regra de segurança `VITE_`, CI (cron + inputs do dispatch), deploy Vercel, papéis do multiusuário, estrutura do repo e links para `project/banco.md`, `project/sprints.md` e LICENSE (MIT) |

---

## Sprint 7 — Gestão de usuários (admin) (24/07 – 25/07)

Foco: admin cria usuários (com papel) e troca senhas pela UI, sem tocar no painel do
Supabase. Executada em 05/07/2026, na sequência da Sprint 5 (usa a mesma base de RLS/perfis).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S7 · Menu "Novo Usuário" (admin) com email/senha/papel (todo:71) | Logar como admin e criar um usuário normal e um admin pela UI; não-admin não vê o item nem acessa a rota | ✅ Done | **Implementado (05/07/2026):** NavDrawer exibe **"Novo Usuário"** apenas para `isAdmin`; rota `/novo-usuario` redireciona não-admin. Form com email + senha + confirmação + **papel** (chips "Usuário padrão" / "Admin" com aviso de escopo). Novo endpoint **`/api/usuarios`** (4º par Flask × Vercel) usa a **admin API** do Supabase (SERVICE_KEY só no servidor), autorizado por token de sessão + `nivel >= 2` (401 sem sessão / 403 não-admin); trigger cria o perfil nivel 1 e o endpoint promove a 2 quando papel=admin. **Testes:** 16/16 (Flask) + 17/17 (Vercel) mockados; **E2E real 18/18** — admin de teste criou usuário normal (que logou com a senha definida) e admin (perfil nivel 2); usuário normal → 403, sem token → 401; cleanup completo |
| S7 · Admin altera a senha de qualquer usuário (todo:73) | Admin define nova senha para outro usuário; a antiga para de funcionar e a nova loga | ✅ Done | **Implementado (05/07/2026):** card **"Alterar senha de usuário"** em `/novo-usuario` com select dos usuários (admin lê todos via RLS `usuarios_select`) + nova senha com confirmação; `acao=trocar_senha` chama `PUT /auth/v1/admin/users/{id}`. **E2E real:** senha antiga **deixou de funcionar** e a nova logou; usuário normal tentando trocar senha alheia → 403 |

---

## Resumo por status

| Status | Qtde | Itens (linha no `todo`) |
|--------|------|--------------------------|
| ✅ Done | 39 | 1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77 |
| 🟡 Pending | 0 | — |
| ⬜ Todo | 0 | — 🏁 **projeto concluído** |

> **Sprint 1 concluída em 01/07/2026** (antes do prazo de 04/07): todo:55, todo:57 e
> todo:47 fechados e validados em 3 runs de CI (64/65/66). Pichau permanece coletável
> apenas localmente por decisão registrada (bloqueio de IP de datacenter aceito).
>
> **Sprint 2 concluída em 02/07/2026** (antes do prazo de 07–09/07): todo:43 e todo:45.
> Estrutura React organizada com alias `@/` (build de 87 módulos OK) e **decisão de
> arquitetura registrada** — mantém-se SPA + React Router (Flask só em dev, Vercel em
> prod); a Sprint entregou **paridade de roteamento dev × prod** (Flask agora devolve
> 404 JSON em `/api/*` inexistente, como o rewrite do Vercel). O rename do aninhamento
> `frontend-flask/frontend/` foi conscientemente adiado por ser disruptivo.
>
> **Sprint 3 concluída em 02/07/2026** (antes do prazo de 10–12/07): todo:49 (data/hora em
> "Preço Atual") **validado**; todo:53 (Coletar Agora por produto) **implementado + testado
> ponta a ponta** (workflow `item_id` → `main.py` scoping → endpoints Flask/Vercel → menu de
> Opções); todo:51 (Armazenamento) **corrigido** — a validação revelou taxonomia inconsistente
> (banco sem STORAGE; form oferecia SSD/COOLER inexistentes que faziam o cadastro falhar),
> resolvida inserindo a categoria STORAGE no banco e alinhando o `NovoProduto.jsx`.
>
> **Sprint 4 concluída em 05/07/2026** (antes do prazo de 14–16/07): todo:59, todo:61 e
> todo:63. Coleta **segmentada por categoria e/ou loja** ponta a ponta (envs
> `CATEGORIA`/`LOJA` no `main.py` → inputs no `workflow_dispatch` → endpoints Flask/Vercel
> em paridade → UI), filtro por **produto de loja** no Dashboard e botão **COLETAR
> FILTRADOS** que traduz os filtros ativos em escopo de coleta. **Validação em dupla
> camada:** local (7/7 cenários de scoping no banco real, 8/8 Flask + 9/9 Vercel com
> GitHub mockado, YAML validado, build 87 módulos) e **E2E ao vivo** (runs
> [#82](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28750800235)
> `categoria=GPU` e [#83](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28750995029)
> `loja=kabum`, ambos `success` — em cada um, **somente o escopo ganhou registros** em
> `historico_precos`, verificado por snapshot antes/depois).
>
> **Sprint 5 concluída em 05/07/2026** (antes do prazo de 17–21/07): todo:67 e todo:69.
> Banco refatorado com a **primeira migração versionada** do repo
> (`project/migrations/sprint5_multiusuario.sql`): tabela `usuarios` (nivel 1/2), trigger
> de auto-perfil, `itens.user_id` com backfill e **RLS por dono + admin** (`is_admin()`).
> `/api/remover` deixou de ser aberto: exige token de sessão e autoriza dono/admin
> (401/403) em paridade Flask × Vercel. UI: filtro por usuário + dono por item (admin),
> papel na página Conta. **Validação em dupla camada:** 9/9 casos mockados por endpoint
> e **E2E real 27/27** com usuários de teste criados/removidos via admin API (isolamento
> A×B, visão admin consolidada, autorização e coletor intactos).
>
> **Sprint 7 concluída em 05/07/2026** (adicionada e executada no mesmo dia, na sequência
> da Sprint 5): todo:71 e todo:73. Menu **"Novo Usuário"** (só admin) com criação de
> usuário por email/senha/**papel** (normal/admin) e **troca de senha de qualquer
> usuário**, via novo endpoint `/api/usuarios` (4º par Flask × Vercel, admin API do
> Supabase server-side). **Validação:** 16/16 + 17/17 mockados e **E2E real 18/18**
> (criação normal+admin, login com a senha definida, troca de senha efetiva, 401/403).
>
> **Sprint 6 concluída em 05/07/2026 — 🏁 PROJETO CONCLUÍDO.** todo:65 (métrica
> **"Abaixo da meta"** no lugar de "Alertas hoje" — modelo "Oportunidades agora"
> escolhido pelo usuário, validado contra o banco real: "0 de 4 com meta definida"),
> todo:75 (**`project/banco.md`** por introspecção do banco real, incl. RPC
> `verificar_alertas` decifrada por sonda read-only e 6 tabelas legadas descobertas)
> e todo:77 (**README.md** completo, escrito no fechamento como pedia a condição).
> Com isso, **as 7 sprints (39 tarefas) estão fechadas** — restam apenas as
> melhorias futuras registradas em "Skills Futuras" e a limpeza opcional das
> tabelas legadas apontada no `banco.md`.

---

## Skills Futuras (para futura alteração)

Skills sugeridas com base nos sprints acima — a serem criadas/refinadas em `.claude/skills/`
conforme o projeto evolui. A skill de planejamento (`sprint-planner`) **já foi criada** e mantém
este relatório sincronizado com o `todo`.

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|-----------------|----------|------------|
| `sprint-planner` ✅ | Base | Ler o `todo`, classificar por status (`OK-`/`Pending-`/`-`) e regenerar este `sprints.md` (tabela `SPRINT | TEST | STATUS | RESULTS` + Skills Futuras) | Alta (feita) |
| `ci-diagnostics` | S1 | Diagnosticar diferença local × CI dos scrapers (Pichau/Terabyte): dump de página, detecção de challenge, timeouts e flags do Chromium | Alta |
| `scraper-nova-loja` | S1/S4 | Andaime para nova loja: subclasse de `ScraperBase`, `_aguardar_preco`/`extrair_dados` e registro no dict `SCRAPERS` do `main.py` | Média |
| `frontend-refactor` | S2 | Guiar reorganização de pastas do front mantendo build Vite, alias `@/`, proxy `/api/*` e paridade `app.py` × Vercel Functions | Média |
| `timezone-audit` | S1/S3 | Auditar e normalizar timestamps para America/Sao_Paulo (UTC-3) em back, front e banco | Alta |
| `coleta-segmentada` | S4 | Adicionar escopo de coleta (categoria/loja/produto) ao `main.py` e ao gatilho de disparo | — (entregue na Sprint 4 sem necessidade de skill) |
| `db-multiusuario` | S5 | Planejar refatoração do Supabase para `user_id`, RLS e papel admin | — (entregue na Sprint 5; migração versionada em `project/migrations/`) |
| `db-docs` | S6 | Gerar/atualizar `project/banco.md` (tabelas, relacionamentos, RPC `verificar_alertas`) | — (entregue na Sprint 6; regenerável por introspecção) |

> **Como evoluir:** ao concluir uma tarefa, marque o item correspondente no `todo` com o prefixo
> `OK-` (ou `Pending-` se ficar parcial) e rode a skill `sprint-planner` para regenerar este arquivo.
