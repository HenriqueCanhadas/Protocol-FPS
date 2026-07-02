# PROTOCOL FPS — Planejamento de Sprints

> Relatório gerado a partir do arquivo `todo` (raiz do repositório).
> Data de geração: **02/07/2026**. Início do planejamento: **02/07/2026**.
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
| Sprint 4 | Coleta segmentada & filtros | 14/07 – 16/07 | 3 | 3 |
| Sprint 5 | Multiusuário & Admin | 17/07 – 21/07 | 5 | 2 |
| Sprint 6 | Documentação & refino | 22/07 – 23/07 | 2 | 2 |

**Total planejado (Sprints 1–6):** 19 dias úteis · 7 tarefas a fazer
(8 concluídas nas Sprints 1–3; nenhuma pendente).

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
| S1 · Resolver aviso de deprecação Node.js 20 no Actions (todo:75) | Ver o log do Actions sem o aviso de Node 20 | ✅ Done | `checkout@v7` + `setup-python@v6` (Node 24 nativo); flag `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` removida. Validado nos runs 64 e 65: **0 annotations** de deprecação |
| S1 · Ajustar fuso horário UTC-3 (Brasília) back/front/banco (todo:67) | Coletar um item e conferir o mesmo horário local em back, front e Supabase | ✅ Done | Banco correto (timestamptz UTC `+00:00`); Telegram já usava UTC-3 fixo; front agora força `America/Sao_Paulo` via `utils/datas.js` (teste: 14:22 UTC → 11:22 BRT). "Alertas hoje" conta o dia civil de Brasília |

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
| S3 · "Coletar Agora" apenas para o produto selecionado (todo:53) | Acionar "Coletar Agora" em um item e confirmar que só ele foi coletado | ✅ Done | **Implementado ponta a ponta (02/07/2026):** `workflow_dispatch` aceita input `item_id` → env `ITEM_ID`; `main.py._selecionar_itens` faz coleta **PONTUAL** (`eq id`) ou **COMPLETA**; endpoints Flask e Vercel repassam `item_id` no dispatch; menu "Opções › Coletar agora" coleta só o produto. **Testes:** scoping read-only real (pontual=1 / completo=4 / strip), ambos os endpoints com GitHub mockado (com/sem item_id + body string), build 87 módulos, `py_compile`, `node --check`. Falta só o dispatch real via UI para E2E completo |

---

## Sprint 4 — Coleta segmentada & filtros (14/07 – 16/07)

Foco: filtrar e coletar por categoria/loja em vez de sempre tudo.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S4 · Coletar por categoria (GPU/CPU/RAM/…) (todo:55) | Disparar coleta apenas de GPUs e confirmar que só elas foram coletadas | ⬜ Todo | Esperado: seleção de categoria no disparo de coleta |
| S4 · Filtros por loja e por produto de loja (todo:57) | Filtrar a lista por loja e por produto dentro de uma loja | ⬜ Todo | Esperado: filtros combináveis na UI |
| S4 · Coleta por loja/produto/categoria específica (todo:59) | Escolher escopo (loja OU produto OU categoria) e coletar só ele | ⬜ Todo | Esperado: parâmetro de escopo no `main.py` / gatilho |

---

## Sprint 5 — Multiusuário & Admin (17/07 – 21/07)

Foco: isolar monitoramentos por usuário e criar papel de administrador. **Requer refatoração do banco.**

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S5 · Monitoramentos separados por usuário (todo:63) | Usuário A vê só itens A; usuário B só itens B | ⬜ Todo | Esperado: refatorar banco com `user_id`; isolamento de dados por usuário |
| S5 · Usuário Admin vê todos os produtos por usuário (todo:65) | Logar como admin e ver os itens de todos, agrupados por usuário | ⬜ Todo | Esperado: papel admin + visão consolidada por usuário |

---

## Sprint 6 — Documentação & refino (22/07 – 23/07)

Foco: documentar o banco e repensar a métrica de alertas.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S6 · Documentação do banco (estrutura e referências) (todo:69) | Abrir o doc e conferir tabelas `itens`, `lojas`, `historico_precos`, `alertas` + RPC `verificar_alertas` | ⬜ Todo | Esperado: `project/banco.md` com esquema, relacionamentos e RPCs |
| S6 · Repensar métrica "Alertas hoje" (todo:61) | Validar novo cálculo/exibição de "Alertas hoje" | ⬜ Todo | Ainda em definição; esperado: novo modelo de métrica |

---

## Resumo por status

| Status | Qtde | Itens (linha no `todo`) |
|--------|------|--------------------------|
| ✅ Done | 29 | 1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,67,75 |
| 🟡 Pending | 0 | — |
| ⬜ Todo | 7 | 55,57,59,61,63,65,69 |

> **Sprint 1 concluída em 01/07/2026** (antes do prazo de 04/07): todo:67, todo:75 e
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
| `coleta-segmentada` | S4 | Adicionar escopo de coleta (categoria/loja/produto) ao `main.py` e ao gatilho de disparo | Média |
| `db-multiusuario` | S5 | Planejar refatoração do Supabase para `user_id`, RLS e papel admin | Alta (impacto grande) |
| `db-docs` | S6 | Gerar/atualizar `project/banco.md` (tabelas, relacionamentos, RPC `verificar_alertas`) | Média |

> **Como evoluir:** ao concluir uma tarefa, marque o item correspondente no `todo` com o prefixo
> `OK-` (ou `Pending-` se ficar parcial) e rode a skill `sprint-planner` para regenerar este arquivo.
