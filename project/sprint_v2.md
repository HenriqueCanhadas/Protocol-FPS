# PROTOCOL FPS — Planejamento de Sprints — V2

> Relatório gerado a partir da seção **V2** do arquivo `todo` (raiz do repositório).
> Data de geração: **07/07/2026** (atualizado após a conclusão da Sprint 8 e a
> inclusão de 4 tarefas novas no `todo`). Início do planejamento: **08/07/2026**.
> A V1 (Sprints 0–7, concluída em 05/07/2026) está em [`sprint_v1.md`](sprint_v1.md);
> a numeração aqui **continua de onde a V1 parou** (Sprint 8 em diante).
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
| Sprint 8 | Categoria "Diversos" & migração de dados legados | 07/07 (concluída) | 1 | 2 ✅ |
| Sprint 9 | Coleta & alertas por usuário | 07/07 (concluída) | 1 | 3 ✅ |
| Sprint 10 | Histórico: gráfico & lista completa | 14/07 – 17/07 | 4 | 4 ⬜ |
| Sprint 11 | Gestão & filtro de usuários (admin) | 20/07 – 22/07 | 3 | 3 ⬜ |
| Sprint 12 | Edição de produto & menor preço | 23/07 – 27/07 | 3 | 3 ⬜ |
| Sprint 13 | Sessão & conta | 28/07 – 29/07 | 2 | 2 ⬜ |
| Sprint 14 | Refino final do Dashboard | 30/07 – 31/07 | 2 | 1 ⬜ |

**Total da V2:** 18 tarefas · **5 concluídas** (Sprints 8 e 9, ambas executadas e
validadas E2E em 07/07) · **13 a fazer** · 0 pendentes. A Sprint 14 fica por último
por exigência do `todo` ("apenas no final").

---

## Sprint 8 — Categoria "Diversos" & migração de dados legados ✅ (concluída em 07/07)

Foco: criar a categoria "Diversos" e trazer os dados das tabelas legadas Kabum para a
estrutura atual. **Executada e validada em 07/07/2026**, com migração versionada em
`project/migrations/sprint8_diversos_migracao.sql` (rodada pelo usuário no SQL Editor).

> ⚠️ **Restrição absoluta (todo:104): NÃO tocar nas tabelas `produtos_funko` e
> `historico_precos_funko` em hipótese alguma.** Cumprida e comprovada: snapshot
> antes/depois idêntico (9 produtos / 675 leituras); nenhum script cita as tabelas.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S8 · Nova categoria "Diversos" (todo:102) | Cadastrar um produto na categoria "Diversos" pelo Novo Produto e vê-lo no Dashboard, com o filtro de categoria funcionando | ✅ Done | **Implementado (07/07/2026):** categoria `DIVERSOS` inserida em `produtos` (id `b1567c14`, via service key — precedente da STORAGE na Sprint 3); chip "Diversos" no `NovoProduto.jsx` e filtro no Dashboard; listas de categoria atualizadas em `coletar.yml`, `README.md` e `CLAUDE.md`; build 88 módulos, 0 erros |
| S8 · Migrar tabelas legadas Kabum p/ estrutura atual (todo:104) | Itens e histórico das 4 tabelas legadas visíveis na estrutura nova (categoria "Diversos"), como dono `pedrosacanhadas@gmail.com`, com contagens batendo; tabelas Funko **intactas** (snapshot idêntico) | ✅ Done | **Migrado e validado (07/07/2026):** 23 itens (dono pedrosacanhadas, `monitorando=false`, meta = `preco_estimado` do legado) + **2.691 leituras reais** (835 da fase 2 com conversão BRT→UTC comprovada + 1.834 do Monitoramento + 22 do Menores Preços; sentinelas de esgotado — `NULL` e `preco=0` — não migram; 2.570 zeros removidos após a 1ª execução). **Descobertas no caminho:** constraint `itens_url_key` (URL única global, resquício pré-multiusuário) trocada por `unique(url, user_id)`; bug do Dashboard corrigido (buscava `historico_precos` inteiro e o PostgREST trunca em 1.000 linhas — agora a última leitura vem embutida por item). Funko e tabelas legadas intactas. ⚠️ **Coletor legado ainda ativo** gravando em `historico_precos_kabum` (leitura em 07/07 11:06) — desligar para não divergir |

---

## Sprint 9 — Coleta & alertas por usuário ✅ (concluída em 07/07)

Foco: coleta e alertas respeitarem o **dono do item** — o alerta chega ao email de quem
cadastrou (não ao email fixo do `.env`), o Telegram fica restrito, e "coletar todos" de
um usuário normal coleta só os itens dele. **Executada e validada E2E em 07/07/2026**
(commit `4fcc16c`, push na `Duplicate-Main` — o 422 do dispatch era o workflow remoto
sem o input `user_id`).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S9 · Alerta por email só para o dono do item (todo:112) | Disparar um alerta de item do usuário X e confirmar que o email vai para o endereço cadastrado dele (ex.: item do pedrosacanhadas → c0ntr0leg4mer@gmail.com) e para mais ninguém; o **Telegram NÃO dispara** para itens de outros usuários | ✅ Done | **Implementado e validado E2E (07/07/2026):** `main.py` roteia por dono — email vai para `usuarios.email` do `itens.user_id` (`enviar_email` ganhou o param `destinatario`; `EMAIL_DESTINATARIO` vira fallback); Telegram só para quem tem `usuarios.notificar_telegram = true` (migração `sprint9_alertas_por_usuario.sql`; fallback pré-migração restrito ao admin). **E2E real:** alerta `abaixo_meta` de item do c0ntr0leg4mer → log "Email enviado para c0ntr0leg4mer@gmail.com" + "Telegram desabilitado para o dono — não enviado"; registro em `alertas` com `notificado_email=true` / `notificado_telegram=false`. Rodar a migração é **opcional** (habilita a seleção por flag; UI prevista na Sprint 11) |
| S9 · "Coletar todos" respeita os itens do usuário (todo:126) | Usuário normal com 1 item clica em COLETAR AGORA (sem filtros) e **só o item dele** é coletado; itens de outros donos ficam intocados no banco | ✅ Done | **Implementado ponta a ponta e validado E2E (07/07/2026):** Dashboard envia `user_id` da sessão para não-admin (admin segue global); endpoints Flask × Vercel repassam `user_id` (paridade 8/8 + 9/9 mockados, payloads idênticos); `coletar.yml` input `user_id` → env `USER_ID`; `main.py` filtra `itens.user_id` (combinável com CATEGORIA/LOJA; ITEM_ID tem precedência); scoping read-only 7/7. **E2E ao vivo:** run [#98](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28908278032) `success` com `user_id` do c0ntr0leg4mer — só o "teste 1" dele ganhou leitura (+1, R$ 109,90); os **26 itens monitorados de outros donos ficaram intocados** (snapshot antes/depois) |
| S9 · Auditar "% de queda" do Novo Produto (todo:108) | Rastrear o campo "% de queda para alertar" do form ao banco e à RPC `verificar_alertas` e responder: ele participa de algum cálculo? | ✅ Done | **Auditado (07/07/2026): o campo era MORTO** — entrava na fila local do form mas nunca era enviado no INSERT de `itens` (não existe coluna no banco) e a RPC `verificar_alertas` dispara `queda_preco` em **qualquer** queda, sem usar %. **Decisão:** campo removido do `NovoProduto.jsx` (comentário no código explica); se um dia quiser alertar só quedas ≥ X%, será preciso coluna nova + mudança na RPC |

---

## Sprint 10 — Histórico: gráfico & lista completa (14/07 – 17/07)

Foco: visualização do histórico como gráfico tempo × valor e fim do corte da lista,
sem perder nada do que o modal já faz hoje. Relevante após a Sprint 8: itens migrados
têm até **485 leituras** (o modal atual mostra só as 30 mais recentes).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S10 · Gráfico tempo × valor no topo do histórico (todo:114) | Abrir o histórico de um item e ver primeiro o gráfico (eixo X = tempo, eixo Y = preço) e abaixo a lista cronológica que já existe | ⬜ Todo | Modal de histórico com gráfico de linha no topo alimentado por `historico_precos`, lista atual mantida logo abaixo |
| S10 · Tooltip no ponto + clique → item da lista (todo:116) | Passar o mouse num ponto e ver legenda com dia e valor; clicar no ponto e a lista rolar/destacar a leitura correspondente | ⬜ Todo | Hover mostra tooltip `dd/mm/aaaa · R$ valor`; clique navega para a linha da leitura na lista abaixo |
| S10 · Preservar remoção unitária de leituras (todo:118) | Após o gráfico, remover uma leitura específica (e múltiplas) continua funcionando como hoje | ⬜ Todo | Toda a lógica atual de seleção/remoção unitária e múltipla intacta — o gráfico é só uma camada de visualização (e reflete remoções) |
| S10 · Histórico mostra a lista completa (todo:132) | Abrir o histórico de um item migrado (ex.: 485 leituras) e conseguir ver **todas** as leituras, não só as 30 mais recentes | ⬜ Todo | Remover o `limit(30)` do modal com rolagem/paginação — atenção ao teto de 1.000 linhas do PostgREST (paginar com `range` para itens grandes, mesmo aprendizado do fix da Sprint 8) |

---

## Sprint 11 — Gestão & filtro de usuários (admin) (20/07 – 22/07)

Foco: admin enxerga e administra os usuários pela própria UI (complementa a página
"Novo Usuário" da Sprint 7) e ganha um filtro de dono mais prático no Dashboard.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S11 · Listagem de usuários com exclusão (admin) (todo:106) | Logar como admin e ver todos os usuários no menu lateral/página; excluir um usuário de teste pela UI; não-admin não vê nem acessa | ⬜ Todo | Lista de usuários visível só para `isAdmin`; exclusão via `/api/usuarios` (nova `acao: "excluir"` na admin API, paridade Flask × Vercel, 401/403 como nas ações atuais) — definir destino dos itens do usuário excluído (remover em cascata como `/api/remover` ou reatribuir) |
| S11 · Último acesso, Papel, Status na listagem (todo:124) | Na listagem, cada usuário exibe Último acesso, Papel (normal/admin), Status etc. | ⬜ Todo | Colunas preenchidas via admin API (`last_sign_in_at`, `email_confirmed_at`…) + `usuarios.nivel`; leitura server-side pois esses campos vivem em `auth.users` |
| S11 · Filtro ◈ USUÁRIOS: Todos · Eu · dropdown (todo:110) | No Dashboard admin, a linha ◈ USUÁRIOS vira "Todos" · "Eu" · um dropdown para escolher um usuário específico | ⬜ Todo | Chips por dono substituídos por Todos/Eu + `select` de usuário — escala melhor com muitos usuários; filtro continua combinável com categoria/loja/busca |

---

## Sprint 12 — Edição de produto & menor preço (23/07 – 27/07)

Foco: editar itens já cadastrados pelo menu ⋯ OPÇÕES (hoje só meta e monitoramento)
e destacar o menor valor histórico de cada produto.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S12 · Opções › "Alterar Nome" (todo:128) | Renomear um item pelo menu ⋯ OPÇÕES e ver o novo nome na tabela e no banco (`itens.nome_na_loja`) | ⬜ Todo | Novo campo/modal "Alterar Nome" no menu de Opções, no padrão do "Editar Meta" — `UPDATE itens` já autorizado pela política RLS de dono/admin |
| S12 · Opções › "Alterar Categoria" (todo:130) | Mudar a categoria de um item pelo menu ⋯ OPÇÕES e vê-lo sob o novo filtro de categoria | ⬜ Todo | Select com as 7 categorias no menu de Opções atualizando `itens.produto_id`; útil p/ reclassificar os 23 itens migrados como "Diversos" (ex.: HDs → STORAGE) |
| S12 · Menor valor já obtido por produto (todo:134) | Ver o menor preço histórico do produto (junto da meta, sem substituí-la) | ⬜ Todo | Exibir `min(historico_precos.preco)` por item (no modal de histórico e/ou na linha da tabela), mantendo o `preco_meta` — atenção ao teto de 1.000 linhas (calcular via agregação/paginação, não no cliente com fetch parcial) |

---

## Sprint 13 — Sessão & conta (28/07 – 29/07)

Foco: endurecer a sessão e alinhar a troca de senha ao modelo "admin gerencia".

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S13 · Minha Conta: senha só via admin (todo:120) | Abrir ◉ Minha Conta e não ver mais o form "Segurança — Nova Senha"; no lugar, aviso em azul "Solicite ao usuário admin para alterar sua senha" **sem** revelar quem são os admins | ⬜ Todo | Form de troca de senha própria removido (`updatePassword` do `useAuth` deixa de ser usado na Conta); mensagem azul neutra; troca de senha passa a existir só no fluxo admin da Sprint 7 |
| S13 · Logout automático por inatividade (todo:122) | Deixar a aba inativa/fechada por 30 min e, ao voltar, estar deslogado (redirecionado ao login); atividade contínua não desloga | ⬜ Todo | Timer de inatividade (eventos de interação + `visibilitychange`/timestamp persistido para pegar janela fechada) que chama `signOut()` após 30 min — comportamento padrão de páginas com sessão sensível |

---

## Sprint 14 — Refino final do Dashboard (30/07 – 31/07)

Foco: acabamento visual — executar **somente após as demais sprints**, como pede o `todo`.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S14 · Ajustar cards do topo e alertas recentes (todo:136) | Revisar a faixa superior (Itens monitorados · Abaixo da meta · Menor preço hoje · Última coleta) e a seção inferior (Alertas recentes / "Nenhum alerta disparado hoje") com o visual aprovado pelo usuário | ⬜ Todo | Cards e seção de alertas refinados por último, já refletindo tudo que a V2 mudou (novos usuários, categoria Diversos, alertas por dono, menor preço histórico); detalhes do ajuste a definir com o usuário no início da sprint |

---

## Resumo por status

| Status | Qtde | Itens (linha no `todo`) |
|--------|------|--------------------------|
| ✅ Done | 5 | 102,104,108,112,126 |
| 🟡 Pending | 0 | — |
| ⬜ Todo | 13 | 106,110,114,116,118,120,122,124,128,130,132,134,136 |

> **Sprint 8 concluída em 07/07/2026** (1 dia, contra 5 planejados): categoria
> DIVERSOS + migração dos dados legados Kabum (23 itens, 2.691 leituras reais) com
> validação completa — Funko intactas, timezone comprovado, constraint de URL
> corrigida para o modelo multiusuário e fix do teto de 1.000 linhas no Dashboard.
> Pendências operacionais registradas: **desligar o coletor legado** (ainda grava em
> `historico_precos_kabum`) e **commitar/deployar** o código da Sprint 8 na Vercel.
>
> **Sprint 9 concluída em 07/07/2026** (todo:108/112/126 ✅): coleta e alertas por
> dono ponta a ponta — validação mockada (22/22 Python + 9/9 Vercel, paridade
> idêntica), scoping read-only 7/7 e **dois E2E reais**: run
> [#98](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28908278032)
> (dispatch com `user_id` coletou só o item do usuário alvo) e alerta real com email
> chegando ao dono + Telegram bloqueado. Código nos commits `d5452c2`/`4fcc16c`
> (push na `Duplicate-Main` resolveu o 422 do dispatch). **Opcional:** rodar
> `sprint9_alertas_por_usuario.sql` (flag de Telegram por usuário; UI na Sprint 11).
>
> Regras herdadas da V1: banco primeiro (migração versionada em
> `project/migrations/`), endpoints sempre em **paridade Flask × Vercel**, validação
> em dupla camada (mockada + E2E real) e a restrição inegociável de **não tocar nas
> tabelas Funko**.

---

## Skills Futuras (para futura alteração)

Skills sugeridas com base nos sprints — a serem criadas/refinadas em `.claude/skills/`
conforme o projeto evolui. A skill de planejamento (`sprint-planner`) **já foi criada** e mantém
este relatório sincronizado com o `todo`.

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|-----------------|----------|------------|
| `sprint-planner` ✅ | Base | Ler o `todo`, classificar por status (`OK-`/`Pending-`/`-`) e regenerar este `sprint_v2.md` (tabela `SPRINT | TEST | STATUS | RESULTS` + Skills Futuras) | Alta (feita) |
| `ci-diagnostics` | S1 | Diagnosticar diferença local × CI dos scrapers (Pichau/Terabyte): dump de página, detecção de challenge, timeouts e flags do Chromium | Alta |
| `scraper-nova-loja` | S1/S4 | Andaime para nova loja: subclasse de `ScraperBase`, `_aguardar_preco`/`extrair_dados` e registro no dict `SCRAPERS` do `main.py` | Média |
| `frontend-refactor` | S2 | Guiar reorganização de pastas do front mantendo build Vite, alias `@/`, proxy `/api/*` e paridade `app.py` × Vercel Functions | Média |
| `timezone-audit` | S1/S3 | Auditar e normalizar timestamps para America/Sao_Paulo (UTC-3) em back, front e banco | Alta |
| `coleta-segmentada` | S4 | Adicionar escopo de coleta (categoria/loja/produto) ao `main.py` e ao gatilho de disparo | — (entregue na Sprint 4 sem necessidade de skill) |
| `db-multiusuario` | S5 | Planejar refatoração do Supabase para `user_id`, RLS e papel admin | — (entregue na Sprint 5; migração versionada em `project/migrations/`) |
| `db-docs` | S6 | Gerar/atualizar `project/banco.md` (tabelas, relacionamentos, RPC `verificar_alertas`) | — (entregue na Sprint 6; regenerável por introspecção) |

> **Como evoluir:** ao concluir uma tarefa, marque o item correspondente no `todo` com o prefixo
> `OK-` (ou `Pending-` se ficar parcial) e rode a skill `sprint-planner` para regenerar este arquivo.
