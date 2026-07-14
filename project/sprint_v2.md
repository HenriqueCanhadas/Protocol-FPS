# PROTOCOL FPS — Planejamento de Sprints — V2

> Relatório gerado a partir da seção **V2** do arquivo `todo` (raiz do repositório).
> Data de geração: **14/07/2026** (atualizado após a conclusão da Sprint 14 —
> ordenação avançada & filtro por dia de coleta, entregue no mesmo dia em que as
> 2 tarefas entraram no `todo`: linhas 140 e 142). Com a inserção delas, o refino
> final desceu da linha 140 para a **144**; referências atualizadas. A V2 tem
> **22 tarefas**. O antigo plano da Sprint 14 (esgotado + refino juntos) foi
> redistribuído em três sprints: 14 (ordenação/filtro — ✅), 15 (esgotado × não
> localizado) e 16 (refino final — por último, como pede o `todo`).
> **Correção de auditoria (geração de 08/07, mantida):** os itens das linhas 134
> e 136 estavam fora do plano original por referência de linha trocada — o 134
> foi entregue na Sprint 12 e o 136 segue planejado (hoje na Sprint 15).
> Início do planejamento: **08/07/2026**.
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
| Sprint 10 | Histórico: gráfico & lista completa | 07/07 (concluída) | 1 | 4 ✅ |
| Sprint 11 | Gestão & filtro de usuários (admin) | 08/07 (concluída) | 1 | 3 ✅ |
| Sprint 12 | Edição de produto & menor preço | 08/07 (concluída) | 1 | 4 ✅ |
| Sprint 13 | Sessão & conta | 08/07 (concluída) | 1 | 2 ✅ |
| Sprint 14 | Ordenação avançada & filtro por data de coleta | 14/07 (concluída) | 1 | 2 ✅ |
| Sprint 15 | Esgotado × não localizado | 15/07 – 17/07 | 3 | 1 ⬜ |
| Sprint 16 | Refino final: cards do topo & alertas recentes | 20/07 – 21/07 | 2 | 1 ⬜ |

**Total da V2:** 22 tarefas · **20 concluídas** (Sprints 8, 9 e 10 em 07/07;
Sprints 11, 12 e 13 em 08/07; Sprint 14 em 14/07) · **2 a fazer** · 0 pendentes.
Com a Sprint 14 fechada em 1 dia (contra 2 planejados), as Sprints 15 e 16
adiantam: a 15 fecha na sexta 17/07 e a 16 (refino por último, por exigência do
`todo` — "apenas no final") fica para 20–21/07, após o fim de semana.

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
| S8 · Migrar tabelas legadas Kabum p/ estrutura atual (todo:104) | Itens e histórico das 4 tabelas legadas visíveis na estrutura nova (categoria "Diversos"), como dono `pedrosacanhadas@gmail.com`, com contagens batendo; tabelas Funko **intactas** (snapshot idêntico) | ✅ Done | **Migrado e validado (07/07/2026):** 23 itens (dono pedrosacanhadas, `monitorando=false`, meta = `preco_estimado` do legado) + **2.691 leituras reais** (835 da fase 2 com conversão BRT→UTC comprovada + 1.834 do Monitoramento + 22 do Menores Preços; sentinelas de esgotado — `NULL` e `preco=0` — não migram; 2.570 zeros removidos após a 1ª execução). **Descobertas no caminho:** constraint `itens_url_key` (URL única global, resquício pré-multiusuário) trocada por `unique(url, user_id)`; bug do Dashboard corrigido (buscava `historico_precos` inteiro e o PostgREST trunca em 1.000 linhas — agora a última leitura vem embutida por item). Funko intactas. **Pós-migração (08/07/2026):** usuário dropou as 4 tabelas legadas Kabum, o que também resolveu o coletor legado que ainda gravava nelas; validação de encerramento confirmou integridade (0 leituras/alertas órfãos após limpeza de 1 alerta de teste) — Funko preservadas, commit `8c34be7` |

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

## Sprint 10 — Histórico: gráfico & lista completa ✅ (concluída em 07/07)

Foco: visualização do histórico como gráfico tempo × valor e fim do corte da lista,
sem perder nada do que o modal já faz hoje. **Executada em 07/07/2026** — gráfico em
SVG puro (sem dependência nova), validado visualmente com dados reais.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S10 · Gráfico tempo × valor no topo do histórico (todo:114) | Abrir o histórico de um item e ver primeiro o gráfico (eixo X = tempo, eixo Y = preço) e abaixo a lista cronológica que já existe | ✅ Done | **Implementado (07/07/2026):** componente `GraficoHistorico` (SVG puro) no topo do modal — linha 2px tempo × preço, grade recessiva (3 rótulos R$ no Y, 4 datas no X), marcador âmbar no **menor preço histórico**, tema do app; lista mantida logo abaixo; oculto com < 2 leituras. **Validação visual** com o item mais denso do banco real (361 leituras) via réplica + screenshot Playwright: sem colisões, geometria correta |
| S10 · Tooltip no ponto + clique → item da lista (todo:116) | Passar o mouse num ponto e ver legenda com dia e valor; clicar no ponto e a lista rolar/destacar a leitura correspondente | ✅ Done | **Implementado (07/07/2026):** hover mostra crosshair pontilhado + marcador no ponto mais próximo e tooltip `dd/mm/aaaa · hh:mm` + `R$ valor` (badge "esgotado" quando `disponivel=false`); clique rola suavemente até a leitura na lista (`scrollIntoView`) e a destaca com flash verde (re-dispara até no mesmo ponto); dica de uso no rodapé do gráfico |
| S10 · Preservar remoção unitária de leituras (todo:118) | Após o gráfico, remover uma leitura específica (e múltiplas) continua funcionando como hoje | ✅ Done | **Preservado:** nenhuma linha do fluxo de remoção foi alterada (seleção unitária/múltipla, "Selecionar todos", `/api/remover`); a linha da lista só ganhou `id` e classe de destaque. Após remover, o reload refaz o fetch e o **gráfico reflete automaticamente** as leituras removidas |
| S10 · Histórico mostra a lista completa (todo:132) | Abrir o histórico de um item migrado (ex.: centenas de leituras) e conseguir ver **todas** as leituras, não só as 30 mais recentes | ✅ Done | **Corrigido (07/07/2026):** o `limit(30)` virou busca **completa paginada** em blocos de 1.000 (`range` em loop — mesmo aprendizado do teto do PostgREST da Sprint 8); contagem "N leitura(s)" exibida ao lado do menor preço |

---

## Sprint 11 — Gestão & filtro de usuários (admin) ✅ (concluída em 08/07)

Foco: admin enxerga e administra os usuários pela própria UI (evolui a página
"Novo Usuário" da Sprint 7 para uma página única **Usuários**) e ganha um filtro
de dono mais prático no Dashboard. **Executada e validada em 08/07/2026** —
decisões do usuário: exclusão **em cascata**, página única em `/usuarios`
(com redirect de `/novo-usuario`) e toggle de Telegram incluído.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S11 · Listagem de usuários com exclusão (admin) (todo:106) | Logar como admin e ver todos os usuários no menu lateral/página; excluir um usuário de teste pela UI; não-admin não vê nem acessa | ✅ Done | **Implementado (08/07/2026):** página única `/usuarios` (item ◈ do menu admin) com listagem + EXCLUIR (bloqueado na própria conta) + cards de criar/trocar senha; `/api/usuarios` ganhou `acao: "excluir"` com **cascata manual** alertas → histórico → itens → conta auth (a FK `itens.user_id` não cascateia), paridade Flask × Vercel **32/32 + 32/32 mockados** (ordem da cascata verificada). **E2E real 20/20:** usuário e2e com 1 item/2 leituras/1 alerta excluído → `removed {itens:1, leituras:2, alertas:1}`, conta auth removida, login parou de funcionar, não-admin 403, auto-exclusão 400, snapshot do banco idêntico fora os dados e2e. **Bônus:** corrigida corrida do perfil no `useAuth` (deep-link `/usuarios` expulsava o próprio admin — `perfilLoading` agora derivado por uid) |
| S11 · Último acesso, Papel, Status na listagem (todo:124) | Na listagem, cada usuário exibe Último acesso, Papel (normal/admin), Status etc. | ✅ Done | **Implementado (08/07/2026):** `acao: "listar"` junta perfis + `auth.users` via admin API (`last_sign_in_at`/`email_confirmed_at`, só visíveis server-side) + contagem de itens por dono (paginada — teto de 1000 do PostgREST); tabela mostra Papel (badge), Último acesso em BRT, Status (Ativo/Não confirmado), Itens e **toggle TELEGRAM** por usuário (`acao: "telegram"` grava `usuarios.notificar_telegram` — pendência da Sprint 9 resolvida, com fallback + aviso da migração se a coluna faltar). E2E real conferiu tudo contra o banco |
| S11 · Filtro ◈ USUÁRIOS: Todos · Eu · dropdown (todo:110) | No Dashboard admin, a linha ◈ USUÁRIOS vira "Todos" · "Eu" · um dropdown para escolher um usuário específico | ✅ Done | **Implementado (08/07/2026):** chips por dono → "Todos (N)" · "Eu (n)" · dropdown "— usuário específico —" com contagens; mesma semântica de `filtroUsuario`, então segue combinável com categoria/loja/busca e o COLETAR FILTRADOS continua respeitando o dono. Validação visual com login real + screenshot Playwright (Dashboard e `/usuarios`) |

---

## Sprint 12 — Edição de produto & menor preço ✅ (concluída em 08/07)

Foco: editar itens já cadastrados pelo menu ⋯ OPÇÕES (antes só meta e monitoramento)
e destacar o menor valor histórico de cada produto. **Executada e validada em
08/07/2026** — inclui o item da linha 134 (ordenação), que estava fora do plano e
depende do mesmo dado do menor preço.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S12 · Opções › "Alterar Nome" (todo:128) | Renomear um item pelo menu ⋯ OPÇÕES e ver o novo nome na tabela e no banco (`itens.nome_na_loja`) | ✅ Done | **Implementado (08/07/2026):** modal "Alterar nome" no padrão do Editar Meta (rótulo do card agora é dinâmico via `data-label`); `UPDATE itens.nome_na_loja` direto via RLS dono/admin. **E2E real:** renomeado via REST com token de usuário (1 linha) **e** pelo fluxo completo da UI com Playwright (modal → salvar → tabela e banco conferidos); UPDATE em item alheio → 0 linhas (RLS) |
| S12 · Opções › "Alterar Categoria" (todo:130) | Mudar a categoria de um item pelo menu ⋯ OPÇÕES e vê-lo sob o novo filtro de categoria | ✅ Done | **Implementado (08/07/2026):** modal com chips das 7 categorias (rótulos amigáveis); mesmo lookup categoria → `produtos.id` do cadastro + `UPDATE itens.produto_id`. **E2E real:** lookup 7/7, GPU → DIVERSOS via REST e GPU → STORAGE pela UI, filtros refletem na hora — pronto p/ reclassificar os 23 itens migrados como "Diversos" |
| S12 · Menor valor já obtido por produto (todo:138) | Ver o menor preço histórico do produto (junto da meta, sem substituí-la) | ✅ Done | **Implementado (08/07/2026):** "★ menor: R$ X" em âmbar sob a meta (tooltip com a data), sem substituí-la; o dado vem de um **segundo embed aliased** na query do Dashboard (`minimo:historico_precos` com `order=preco.asc` + `limit 1` + `preco>0` por alias) — sem buscar o histórico inteiro nem esbarrar no teto de 1.000 do PostgREST. **Validado:** mínimo idêntico à verdade paginada em 5/5 itens reais (incl. migrado com 362 leituras) e cenário e2e onde o menor não é a última leitura |
| S12 · Ordenação por data de coleta e por menor valor (todo:134) | Ordenar a tabela por data da última coleta e pelo menor valor já obtido, além de Nome/Preço | ✅ Done | **Implementado (08/07/2026):** botões de ordenação viraram **Nome / Preço / Menor / Coleta** (asc/desc no mesmo toggle); itens sem valor vão para o fim. Item estava **fora do plano anterior** (referência de linha errada) — incluído e entregue junto |

---

## Sprint 13 — Sessão & conta ✅ (concluída em 08/07)

Foco: endurecer a sessão e alinhar a troca de senha ao modelo "admin gerencia".
**Executada e validada em 08/07/2026** — E2E Playwright 12/12 na SPA real.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S13 · Minha Conta: senha só via admin (todo:120) | Abrir ◉ Minha Conta e não ver mais o form "Segurança — Nova Senha"; no lugar, aviso em azul "Solicite ao usuário admin para alterar sua senha" **sem** revelar quem são os admins | ✅ Done | **Implementado (08/07/2026):** form removido; card SEGURANÇA exibe o aviso **em azul** (nova var `--blue` no tema, borda/rótulo do card também azuis) sem citar nenhum admin; `updatePassword` removido do `useAuth` (código morto — troca de senha só no fluxo admin de `/usuarios`); card "Encerrar todas as sessões" preservado. **E2E:** aviso presente, zero `input[type=password]`, nenhum email revelado |
| S13 · Logout automático por inatividade (todo:122) | Deixar a aba inativa/fechada por 30 min e, ao voltar, estar deslogado (redirecionado ao login); atividade contínua não desloga | ✅ Done | **Implementado (08/07/2026):** hook `useAutoLogout` — última atividade em `localStorage` (`fps_ultima_atividade`, throttle 15s; mouse/tecla/scroll/touch, qualquer aba conta), verificação a cada 60s + ao voltar a aba visível + **na restauração da sessão** (cobre janela fechada 30+ min: derruba antes de qualquer uso); `signOut()` + toast "Sessão encerrada por inatividade". Bug pego pelo próprio E2E: a chave só é limpa na transição logado→deslogado (limpar com `user null` no mount apagava o timestamp vencido). **E2E 12/12:** atividade fresca mantém sessão; timestamp 31 min + reload → login; aba aberta parada → timer derruba sozinho com toast |

---

## Sprint 14 — Ordenação avançada & filtro por data de coleta ✅ (concluída em 14/07)

Foco: evoluir a barra de ordenação entregue na Sprint 12 — novos rótulos/critérios
(inclusive por **Meta**) e um recorte por **dia específico de coleta** que continua
combinável com as demais ordenações. Trabalho 100% frontend (`Dashboard.jsx` +
novo helper `diaBRT` em `utils/datas.js`), sobre dados que a query aliased já traz.
**Executada e validada em 14/07/2026** — lógica 17/17 em Node + E2E real 12/12 na
SPA com Playwright (usuário e2e admin temporário, removido no fim).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S14 · Ordenação: Nome · Preço Atual · Menor Preço · Meta · Coleta (todo:140) | A barra de ordenação da tabela exibe os cinco critérios — "Preço" renomeado para **Preço Atual**, "Menor" para **Menor Preço**, e **Meta** (novo, por `preco_meta`) — cada um alternando asc/desc como hoje | ✅ Done | **Implementado (14/07/2026):** rótulos renomeados e critério META novo — ordena por `itens.preco_meta` como **número** (asc/desc no mesmo toggle; sem meta vai para o fim, padrão dos demais); nenhuma busca nova no banco. **E2E real:** 5 rótulos conferidos e ordem da tela **idêntica à verdade do banco** em asc e desc com 28 itens reais — inclusive item "indisponível" que oculta a linha `meta:` na tabela mas ordena pela meta do banco |
| S14 · Filtro Coleta por dia específico + ordenação combinada (todo:142) | Escolher um dia específico no filtro de Coleta e ver apenas os itens cuja última coleta é daquele dia, podendo dentro do recorte ordenar por nome, preço etc. | ✅ Done | **Implementado (14/07/2026):** seletor de data junto à barra de ordenação filtra pela última coleta no **dia civil de Brasília** (novo `diaBRT` — leitura de 01:00 UTC conta no dia anterior em BRT, comprovado nas fronteiras de fuso 17/17); combina com busca/categoria/loja/usuário e qualquer ordenação; ✕ limpa e volta tudo; estado vazio próprio ("Nenhum item com última coleta em dd/mm/aaaa"). **E2E real 12/12:** recorte cheio (12 itens de 14/07) e parcial (2 de 09/07) batendo com o banco, contagem "X de Y", ordem alfabética dentro do recorte, screenshots |

---

## Sprint 15 — Esgotado × não localizado (15/07 – 17/07)

Foco: fechar a lógica de disponibilidade (item herdado da auditoria do plano) —
distinguir "esgotado de fato na loja" de "página fora do ar / produto não localizado".
Mexe no contrato `DadosProduto` + 3 scrapers + coletor e reflete na UI; 3 dias úteis
(quarta a sexta).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S15 · Informar esgotado × não localizado (todo:136) | Um produto com página fora do ar / não localizado é informado como tal, distinto de "realmente esgotado" na loja | ⬜ Todo | Hoje o scraper devolve `disponivel=false` sem separar "esgotado de fato" de "não localizado/erro de página" (e sem preço nada é salvo). Definir a distinção no `DadosProduto`/scrapers (o out-of-stock já é decidido antes do preço; challenge/manutenção detectados em `_detectar_challenge`) e refletir no status da UI ("ESGOTADO" × "NÃO LOCALIZADO"); se precisar de coluna nova em `historico_precos`, migração versionada em `project/migrations/` |

---

## Sprint 16 — Refino final: cards do topo & alertas recentes (20/07 – 21/07)

Foco: o acabamento visual — executa **somente após as demais sprints**, como pede o
`todo` ("apenas no final").

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S16 · Ajustar cards do topo e alertas recentes (todo:144) | Revisar a faixa superior (Itens monitorados · Abaixo da meta · Menor preço hoje · Última coleta) e a seção inferior (Alertas recentes / "Nenhum alerta disparado hoje") com o visual aprovado pelo usuário | ⬜ Todo | Cards e seção de alertas refinados por último, já refletindo tudo que a V2 mudou (novos usuários, categoria Diversos, alertas por dono, menor preço histórico, status esgotado/não localizado); detalhes do ajuste a definir com o usuário no início da sprint |

---

## Resumo por status

| Status | Qtde | Itens (linha no `todo`) |
|--------|------|--------------------------|
| ✅ Done | 20 | 102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,138,140,142 |
| 🟡 Pending | 0 | — |
| ⬜ Todo | 2 | 136,144 |

> **Sprint 8 concluída em 07/07/2026** (1 dia, contra 5 planejados): categoria
> DIVERSOS + migração dos dados legados Kabum (23 itens, 2.691 leituras reais) com
> validação completa — Funko intactas, timezone comprovado, constraint de URL
> corrigida para o modelo multiusuário e fix do teto de 1.000 linhas no Dashboard.
> **Encerramento pós-migração (08/07/2026):** o usuário dropou as 4 tabelas legadas
> Kabum — o coletor legado morreu junto (não há mais onde gravar) — com validação de
> integridade (0 órfãos) e Funko preservadas (commit `8c34be7`); o código está
> commitado na `Duplicate-Main` (merge na `main` ainda pendente para o deploy).
>
> **Sprint 9 concluída em 07/07/2026** (todo:108/112/126 ✅): coleta e alertas por
> dono ponta a ponta — validação mockada (22/22 Python + 9/9 Vercel, paridade
> idêntica), scoping read-only 7/7 e **dois E2E reais**: run
> [#98](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/28908278032)
> (dispatch com `user_id` coletou só o item do usuário alvo) e alerta real com email
> chegando ao dono + Telegram bloqueado. Código nos commits `d5452c2`/`4fcc16c`
> (push na `Duplicate-Main` resolveu o 422 do dispatch). **Opcional:** rodar
> `sprint9_alertas_por_usuario.sql` (flag de Telegram por usuário; UI na Sprint 11).
> Extra pós-sprint (pedido do usuário): o chip ◈ USUÁRIOS do admin também segmenta
> o Coletar, e a confirmação mostra **quantos itens serão coletados** (previsão
> validada contra o coletor real em 6/6 escopos — commit `f6752ed`).
>
> **Sprint 10 concluída em 07/07/2026** (todo:114/116/118/132 ✅): modal de
> histórico ganhou gráfico tempo × preço em SVG puro (tooltip no hover, clique →
> leitura na lista com destaque, marcador do menor preço) e a lista passou a ser
> **completa** (busca paginada em blocos de 1.000). Remoção unitária/múltipla
> intacta. Validação visual com dados reais (361 leituras) via screenshot.
> Extra pós-sprint: datas da lista do histórico agora incluem o ano (dd/mm/aa) —
> commit `7f575a2`.
>
> **Sprint 11 concluída em 08/07/2026** (todo:106/110/124 ✅, 1 dia contra 3
> planejados): página única **Usuários** (`/usuarios`) com listagem completa
> (último acesso/papel/status/nº de itens via `acao=listar`), **exclusão em
> cascata** (`acao=excluir` — decisão do usuário), **toggle de Telegram por
> usuário** (`acao=telegram` — pendência da Sprint 9 resolvida) e filtro
> ◈ USUÁRIOS do Dashboard em "Todos · Eu · dropdown". Validação em dupla camada:
> 32/32 Flask + 32/32 Vercel mockados (paridade e ordem da cascata) e **E2E real
> 20/20** com snapshot de integridade do banco idêntico. Bônus: corrida do perfil
> no `useAuth` corrigida (deep-link admin não é mais expulso).
>
> **Sprint 12 concluída em 08/07/2026** (todo:128/130/134/138 ✅, 1 dia contra 3
> planejados): "Alterar nome" e "Alterar categoria" no menu ⋯ OPÇÕES (UPDATE
> direto via RLS dono/admin, modais no padrão do Editar Meta com rótulo
> `data-label` dinâmico), "★ menor: R$ X" na tabela via **segundo embed aliased**
> (`minimo:historico_precos`, mínimo validado contra a verdade paginada 5/5) e
> ordenação por **Menor** e **Coleta**. Validação: E2E real 18/18 via REST com
> RLS (item alheio intocável, snapshot íntegro) + fluxo completo da UI 7/7 com
> Playwright (renomear e reclassificar de ponta a ponta, com screenshots).
> Auditoria do plano: itens das linhas 134 e 136 do `todo` estavam fora do
> relatório (referências trocadas) — 134 entregue nesta sprint; 136 replanejado
> (hoje na Sprint 15).
>
> **Sprint 13 concluída em 08/07/2026** (todo:120/122 ✅, 1 dia contra 2
> planejados): Conta sem troca de senha própria (aviso azul neutro, `--blue`
> nova no tema, `updatePassword` removido do `useAuth`) e **logout automático
> por inatividade** via `useAutoLogout` (30 min; timestamp persistido em
> localStorage cobre janela fechada; check no timer de 60s, no
> `visibilitychange` e na restauração da sessão). Validação E2E Playwright
> **12/12** na SPA real, incluindo o cenário de janela fechada (timestamp
> envelhecido + reload → login) e o timer derrubando a aba parada sem reload.
> O E2E pegou um bug real de mount (chave limpa com `user null` anulava a
> expiração) — corrigido antes do fechamento.
>
> **Sprint 14 concluída em 14/07/2026** (todo:140/142 ✅, 1 dia contra 2
> planejados): barra de ordenação com os cinco critérios **Nome · Preço Atual ·
> Menor Preço · Meta · Coleta** (META novo, por `preco_meta` numérico; sem meta
> vai ao fim) e **filtro por dia de coleta** — `<input type="date">` junto à
> ordenação que recorta pela última coleta no dia civil de Brasília (novo helper
> `diaBRT` em `utils/datas.js`), combinável com todos os filtros e ordenações,
> com ✕ para limpar e estado vazio próprio. Validação em dupla camada: lógica
> 17/17 em Node (fronteiras de fuso UTC-3: leitura de 01:00 UTC conta no dia
> anterior em BRT) + **E2E real 12/12** na SPA servida pelo Flask com Playwright
> (usuário e2e admin temporário criado via admin API e removido no fim; ordem por
> Meta idêntica à verdade do banco em asc/desc com 28 itens; recortes de dia
> cheio/parcial batendo com o banco; screenshots). Nenhum item criado — teste
> somente leitura; build Vite sem erros.
>
> **Extra pós-Sprint 14 (pedido do usuário, 14/07/2026):** (1) o campo de dia
> abre o **calendário nativo** ao clicar em qualquer ponto (`showPicker()`);
> (2) o COLETAR passou a respeitar **a lista filtrada**: com qualquer filtro
> ativo (categoria/loja/usuário/**busca**/**dia**), o "COLETAR FILTRADOS"
> envia exatamente os itens visíveis — novo modo **LISTA** na pipeline
> (`item_ids`: Dashboard → endpoints Flask × Vercel em paridade → input
> `item_ids` no `coletar.yml` → env `ITEM_IDS` → `main.py`, precedência
> ITEM_ID > ITEM_IDS > segmentada > completa; pausados ficam fora da lista,
> como na coleta em lote; lista vazia não dispara — viraria coleta completa).
> Validação: paridade mockada 8/8 cenários com dispatch idêntico + 9 checagens
> de semântica, scoping read-only 4/4 no banco real e **E2E de UI 11/11** com
> o `/api/trigger-coleta` interceptado no navegador (dia com 12 itens →
> `item_ids` com exatamente os 12; busca com 1 visível → só ele; sem filtros
> o admin segue global). **Atenção deploy:** o dispatch com `item_ids` só é
> aceito depois que o workflow com o input novo estiver na branch alvo do
> `GITHUB_BRANCH` (GitHub responde 422 até lá — mesmo caso da Sprint 9).
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
