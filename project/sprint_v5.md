# PROTOCOL FPS — Planejamento de Sprints — V5

> Relatório gerado a partir da seção **V5** do arquivo `todo` (raiz do repositório).
> Data de geração/atualização: **23/08/2026**.
>
> A V5 sucede a V4 (`project/sprint_v4.md`, Sprints 23–33) e está **fechada**: os
> 7 itens (`todo:225` a `todo:237`) foram implementados e validados ao vivo/com
> testes reais, todos no mesmo dia (23/08/2026), Sprints 34 a 40. A única exceção
> a "coleta funcionando de ponta a ponta" é a Sprint 40 (Shopee): o scraper existe
> e está registrado em todo o sistema, mas a loja tem uma limitação estrutural
> confirmada (bloqueio de autenticação, 3/3 tentativas reais) e documentada em
> `README.md`/`CLAUDE.md`, no mesmo padrão já usado para a Pichau.
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
> - **RESULTS** — resultado alcançado (Done/Pending) ou esperado/planejado (Todo)
>
> 🚫 **Regra de trabalho:** nenhum commit é feito automaticamente — commits **somente
> quando o usuário mandar**.

---

## Visão geral do cronograma

| Sprint | Tema | Período | Dias | Itens |
|--------|------|---------|------|-------|
| 34 | Filtro de loja não encontra item já cadastrado na Tangle Teezer | 23/08/2026 | 1 | 1 |
| 35 | Scraper da Logitec captura o preço original em vez do preço com desconto | 23/08/2026 | 1 | 1 |
| 36 | Revisão do painel "▦ Visão geral" (KPIs da sidebar) | 23/08/2026 | 1 | 1 |
| 37 | Rolagem horizontal indesejada na tabela de usuários | 23/08/2026 | 1 | 1 |
| 38 | Painel de banco (Admin): detalhe por tabela, por item e por usuário | 23/08/2026 | 1 | 1 |
| 39 | Responsividade para celular (Galaxy A30) e tablet (Galaxy Tab A9+) | 23/08/2026 | 1 | 1 |
| 40 | Novo scraper — loja Shopee | 23/08/2026 | 1 | 1 |

**V5 fechada** — Sprints 34 a 40 concluídas, todas validadas ao vivo/com testes
reais no mesmo dia (23/08/2026). A numeração continua de onde a Sprint 33 (V4)
parou. Único item que não fecha em "coleta funcionando": a Sprint 40 entrega o
scraper e o registro ponta a ponta da loja Shopee, mas com uma limitação
estrutural confirmada e documentada (ver detalhes na própria sprint) — a loja
não coleta em nenhum ambiente hoje, por decisão análoga à já registrada para a
Pichau.

---

## Sprint 34 — Filtro de loja não encontra item da Tangle Teezer (23/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S34 · Corrigir o filtro de loja para retornar itens cadastrados na Tangle Teezer, ex. "The Ultimate Detangler" (todo:225) | Com o filtro de loja = Tangle Teezer aplicado no Dashboard, o item "The Ultimate Detangler" (já cadastrado, registrado na Sprint 29 como prova de conceito da loja) aparece na lista filtrada e no select de "produto da loja"; o mesmo vale para qualquer outro item real dessa loja | ✅ Done | **Causa raiz:** `lojas.nome` da Tangle Teezer é `"Tangle Teezer"` — **com espaço**, único caso entre as 8 lojas. `useDashboardFilters.js` comparava `x.loja.toLowerCase()` direto contra a `key` sem espaço (`"tangleteezer"`), então `"tangle teezer"` nunca continha `"tangleteezer"` como substring — o filtro de loja **e** o filtro "produto da loja" excluíam 100% dos itens dessa loja, mesmo com o dado correto no banco. **Corrigido:** nova função `slugLoja()` (mesma normalização já usada no back-end por `_slug_loja()` em `main.py`) aplicada nos dois pontos de comparação. `npm run build` OK. **Validado ao vivo no navegador:** filtro "Tangle Teezer" passou a mostrar exatamente 1 resultado — "The Ultimate Detangler" (R$ 128,00); testado também "Logitec" sem regressão nas outras 7 lojas. Zero erros novos no console |

---

## Sprint 35 — Scraper da Logitec pega o preço original, não o com desconto (23/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S35 · Ajustar `scrapers/logitec.py` para extrair o preço com desconto (R$ 1.019,92) em vez do preço de referência (R$ 1.199,90) (todo:227) | `LogitecScraper(headless=True).coletar(url)` retorna `preco` igual ao valor efetivamente pago (o preço com desconto exibido na página), não o preço "de tabela" | ✅ Done | **Causa raiz:** o R$ 1.019,92 é o desconto "à vista no Pix" (15%), marcado no HTML em `<div class="in_cash-price-box" ...>` com seu próprio `<meta itemprop="price" content="1019.915">`. A Sprint 29 (V4) já tinha visto esse elemento e classificou deliberadamente como "promocional, não usar" — decisão revertida por este item da V5. **Implementado:** `SELETOR_PRECO_PIX = ".in_cash-price-box .price"` + método `_extrair_preco_pix()`, chamado **primeiro** em `extrair_dados()`; JSON-LD/meta/CSS existentes viram fallback para produtos sem desconto Pix. **Validado com dado real:** `coletar(url)` → `preco=1019.92`, batendo com o valor reportado pelo usuário. `py_compile` OK |

**Nota:** a leitura já existente no banco para este item em `historico_precos` permanece com o valor antigo (R$ 1.199,90) até a próxima coleta rodar com o scraper corrigido — nenhuma leitura histórica é reescrita retroativamente, coerente com o resto do projeto.

---

## Sprint 36 — Revisão do "▦ Visão geral" (23/08/2026)

Os 4 KPIs antigos (`KpiRibbon.jsx`) eram: Itens monitorados, Abaixo da meta, Menor
preço hoje e Última coleta. O 4º indicador (o único ponto em aberto do plano) foi
decidido com o usuário — **"Loja mais monitorada"**, entre os 3 candidatos
levantados no planejamento (Total investido / Economia potencial / Loja mais
monitorada).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S36 · Manter "Itens monitorados" e "Última coleta"; adicionar "Itens não monitorados" em vermelho; substituir "Menor preço hoje" por "Loja mais monitorada" (todo:229) | Painel mostra os 4 cards na ordem indicada; "Itens não monitorados" conta `dados.filter(d => d.monitorando === false).length` com o token `--red`; "Loja mais monitorada" mostra a loja com mais itens ativos e a contagem | ✅ Done | **Implementado em `KpiRibbon.jsx`:** "Abaixo da meta" e "Menor preço hoje" saíram (o `todo` só nomeava 3 dos 4 slots, então o 3º mantido implicitamente saía); novo card "Itens não monitorados" com `dados.filter(d => d.monitorando === false).length`; novo token `.stat-value.red { color:var(--red) }` em `Dashboard/index.jsx` (mesmo padrão do `.stat-value.amber` já existente); "Loja mais monitorada" agrupa os itens ativos por `loja` e pega a de maior contagem (`Object.entries(...).sort(...)`), sem nenhuma query nova — mesmo dado já carregado no Dashboard. Comentário desatualizado em `Sidebar.jsx` (citava as fórmulas antigas) também corrigido. **Validado ao vivo no navegador** (sessão real, `npm run dev`): painel mostrou **38 itens monitorados**, **0 itens não monitorados** (em vermelho), **KABUM** como loja mais monitorada (30 itens ativos) e **Última coleta 15:33 / 23/08/2026** preservada; `npm run build` — 111 módulos, sem erros; zero erros novos no console (só os warnings pré-existentes de GoTrueClient/React Router) |

---

## Sprint 37 — Rolagem horizontal na tabela de usuários (23/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S37 · Eliminar a barra de rolagem horizontal da tabela "Usuários Cadastrados" (`Usuarios.jsx`) (todo:231) | Em uma tela de 1366px e 1920px, a tabela cabe sem rolagem lateral, sem cortar nenhuma informação | ✅ Done | **Causa raiz medida ao vivo:** a tabela (8 colunas — Usuário/Papel/Último acesso/Status/Itens/Telegram/Banco/Ações) precisava de **1015px**, mas o card (`.page-wrap`, `min(960px,100%)`) só oferecia **958px** de largura útil — um excesso de apenas 57px. **Corrigido:** padding horizontal de `.users-table th/td` reduzido de `.9rem` para `.55rem` (padding vertical mantido); tabela passou a caber exatamente nos 958px disponíveis (medido: `scrollWidth === clientWidth`, overflow zerado). Como `.page-wrap` trava em 960px a partir dessa largura de janela, o fix vale para qualquer tela ≥960px (1366px e 1920px inclusos) sem afetar o layout de nenhuma outra página (CSS local do próprio arquivo). **Validado ao vivo no navegador:** nenhuma informação cortada — emails, badges e o botão "EXCLUIR" continuam totalmente legíveis; `npm run build` — 111 módulos, sem erros; zero erros no console |

---

## Sprint 38 — Painel de banco: detalhe por tabela, item e usuário (23/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S38 · Estender `pages/Admin.jsx` com: (1) detalhamento por item cadastrado por cada usuário e (2) quantidade de leituras (`historico_precos`) por item (todo:233) | Na página `/admin`, uma nova seção lista, por item, o dono/loja/categoria e a contagem de leituras; os números batem com uma contagem manual (ou outra fonte independente já existente) para pelo menos 1 item | ✅ Done | **Contexto real (já era assim antes desta sprint, mas o `todo:218` da V4 continua sem `OK-`):** `/admin` já existia desde as Sprints 32/32b/32c com contagens agregadas, tamanho por tabela e saúde da coleta, tudo vindo da RPC `admin_estatisticas()`. **Implementado:** nova migration `sprint38_admin_detalhe_usuarios.sql` (rodada pelo usuário no SQL Editor) estende essa RPC com a chave `itens_detalhe` — um item por linha, com `usuarios.email` (dono), loja, categoria e `(select count(*) from historico_precos where item_id = i.id)`; seções agregadas anteriores preservadas intactas. Nova seção "DETALHE POR USUÁRIO E ITEM" em `Admin.jsx`, mesmo padrão visual `.adm-table` das seções existentes, com status Ativo/Pausado colorido. **Validado ao vivo no navegador** (sessão real, banco já migrado): tabela populada com os itens reais; contagem de leituras do item "AMD Ryzen 7 9800X3D" (**81**) bateu **exatamente** com o "★ menor... 81 leitura(s)" que o `PriceChartPanel` do Dashboard já mostra para o mesmo item (fonte independente, Sprint 21) — confirma a query. `npm run build` — 111 módulos, sem erros; zero erros no console |

---

## Sprint 39 — Responsividade mobile/tablet (23/08/2026)

Viewports-alvo corrigidos por pesquisa antes de testar (os valores do planejamento
inicial — 360×720 e 800×1340 — eram aproximações; os reais são **Galaxy A30:
412×892 CSS px** e **Galaxy Tab A9+: 800×1280 retrato / 1280×800 paisagem**).
`resize_window` do Chrome não alterava o viewport real neste ambiente — a
validação usou um `<iframe>` com o tamanho exato de cada dispositivo apontando
para o app local, o que replica corretamente as media queries de CSS.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S39 · Ajustar o layout (Dashboard, Usuários, Novo Produto, Conta, Admin) para Galaxy A30 (412×892) e Galaxy Tab A9+ (800×1280 retrato / 1280×800 paisagem) (todo:235) | As 5 páginas nos 3 tamanhos (15 combinações) sem rolagem horizontal de **página** (`scrollWidth === clientWidth`); tabelas densas podem ter rolagem própria *contida*; nenhum elemento cortado; NavDrawer e modais continuam abríveis | ✅ Done | **Auditoria (15 combinações) revelou 3 bugs reais, todos corrigidos:** **(1)** `ProductTable`/Dashboard — abaixo de 700px a tabela ficava com rolagem horizontal contida mas **sem nenhuma indicação visual**, e uma correção anterior (pré-existente) simplesmente escondia a coluna Status via `display:none` (perda de informação, não solução). Substituído por layout de **cards empilhados** abaixo de 700px: cada linha vira um flex container (Produto em cima; Loja/Preço/Status numa segunda linha), toda a informação visível sem rolagem lateral. **(2)** Nas larguras de tablet (~800px) o badge "ESGOTADO" **vazava a coluna Status** — só detectado medindo a posição real do elemento (`getBoundingClientRect`), pois `table-layout:fixed` não refletia isso no `scrollWidth` da página; corrigido rebalanceando as colunas (Produto 50%→45%, Status 13%→18%) e reduzindo o padding dos badges de loja/status, com ~43px de margem de sobra após o ajuste (antes: ~5px, risco de regressão). **(3)** `Admin.jsx` — a tabela "Saúde da coleta" (Sprint 32) nunca teve um wrapper de rolagem própria, ao contrário da tabela nova da Sprint 38 (`.adm-scroll`); no celular isso vazava como rolagem horizontal de **página inteira** (34px medidos) — corrigida com o mesmo wrapper `.adm-scroll` das demais seções. **Validado sem necessidade de ajuste:** Usuários (rolagem própria já contida, com scrollbar visível do tema — Sprint 26), Novo Produto e Conta (campos já empilham corretamente), NavDrawer (abre em largura fixa de 280px, sem cortes) e `TerminalModal`/`ProductActionsDialog` (modal "Ações do produto" ocupa a largura toda no celular, todos os itens legíveis). `npm run build` — 111 módulos, sem erros. **Correção 23/08/2026 (reportada pelo usuário após a entrega):** a tabela de preços ainda tinha rolagem horizontal *própria* no celular mesmo com o layout de cards — passou pela validação inicial porque essa checava `scrollWidth` do **documento inteiro**, não do `.price-table-wrap` especificamente. Causa raiz: `.price-tooltip` (Sprint 25) usa `position:absolute` + `white-space:nowrap` sem `max-width` — mesmo **invisível** por padrão, um elemento absolutamente posicionado ainda soma na área de rolagem do ancestral com `overflow:auto` quando extrapola a largura dele; no modo card, o tooltip (ancorado no preço, que fica alinhado à direita da linha) não tinha espaço à direita e vazava até **92px**. Corrigido só no breakpoint mobile: o `<tr>` vira o contexto de posicionamento (`position:relative`), `.price-hover` volta a `position:static`, e `.price-tooltip` passa a `left:.9rem;right:.9rem` (contido dentro do padding do próprio card) com `white-space:normal` (quebra de linha em vez de uma linha só). Validado: `.price-table-wrap.scrollWidth - clientWidth = 0` no celular (era 92px), inclusive com o tooltip forçado a aberto; reconferidas as 15 combinações — nenhuma regressão (o resíduo de 21px em ~800px de largura, herdado do próprio `min-width` da tabela nessa faixa, já existia antes e não é o que foi reportado). `npm run build` — 111 módulos, sem erros |

---

## Sprint 40 — Novo scraper: loja Shopee (23/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S40 · Criar `scrapers/shopee.py` (subclasse de `ScraperBase`) e registrar `"shopee"` no dict `SCRAPERS` de `main.py`; validar com o link de teste (Deck Box Pokémon) (todo:237) | `ShopeeScraper(headless=False).coletar('<link de teste>')` retorna um `DadosProduto` com nome/preço/disponibilidade corretos comparados à página real; rodar também com `headless=True`, seguindo a metodologia da skill `scraper-nova-loja` | ✅ Done — **implementado, registrado ponta a ponta, mas não coleta em nenhum ambiente (limitação confirmada e documentada)** | **O risco sinalizado pelo próprio usuário se confirmou.** Inspeção ao vivo da página real (sessão logada): JSON-LD `Product` limpo com `offers.price`/`offers.availability` (mesmo padrão Kabum/Tuyo) — mas o HTML inicial (`curl` sem JS) é um shell vazio (`<div id="main">`), **tudo client-side**; a classe CSS do preço é um hash de CSS-modules (`pyzxvq pw3J3G`), descartada de propósito como fonte (instável a cada deploy). `scrapers/shopee.py` implementado com JSON-LD → texto completo (sem CSS), `_aguardar_preco` esperando até 25-40s pelo JSON-LD **ou** pelo redirect de bloqueio (o que vier primeiro). Registrado ponta a ponta: `SCRAPERS` (`main.py`), `.github/workflows/coletar.yml` (descrição do input `loja`), `Dashboard.constants.js` e `NovoProduto.jsx` (filtro/seleção de loja no front), e uma linha nova em `lojas` no Supabase (`nome="Shopee"`, via `SERVICE_KEY` — mesmo mecanismo usado pelo coletor, sem precisar de migração SQL manual). **Teste real com o Playwright do próprio coletor** (`headless=False` e `headless=True`, sem nenhuma sessão — o cenário real do coletor): **3/3 tentativas** redirecionadas via JS para `shopee.com.br/verify/traffic/error` ("Login Necessário"), cada uma com um `tracking_id` diferente (não é cache nem flake), confirmado em ~4-9s. **Decisão registrada** (README.md + CLAUDE.md, mesmo padrão da Pichau): diferente da Pichau (rate-limit por IP de datacenter, onde retry com backoff pode "pegar" uma janela livre), aqui é um **portão de autenticação** — sem uma sessão logada persistida, nenhuma tentativa muda o resultado, então **não foi aplicado o retry da Pichau** (não serviria pra nada, só gastaria tempo em CI). O scraper detecta o bloqueio honestamente (`_eh_parede_de_login`) e retorna `disponivel=False`/sem preço em segundos — nunca um preço ou "esgotado" falso. **CI não foi testado** (exigiria commit+push, fora do escopo desta sessão sem pedido explícito) — mas como o bloqueio não depende de tipo de IP (aconteceu neste ambiente de desenvolvimento, não só em datacenter), o resultado esperado em CI é igual ou pior, não melhor |

---

## Resumo por status

| Status | Qtde | Linhas do `todo` |
|--------|------|-------------------|
| ✅ Done | 7 | 225, 227, 229, 231, 233, 235, 237 |
| ⬜ Todo | 0 | — |
| 🟡 Pending | 0 | — |

## Skills Futuras

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|------------------|----------|------------|
| `scraper-nova-loja` | já existe (criada na V4) | Reaproveitada nas Sprints 35 (inspeção do `.in_cash-price-box` antes de trocar o seletor) e 40 (metodologia completa — inspeção real, JSON-LD, teste headless/non-headless, 3× confirmando o bloqueio) | Já feita |
| `backend-conventions` | já existe | Referência usada nas Sprints 35 e 40 (contrato `ScraperBase`, `_limpar_preco`) | Já feita |
| `frontend-design-system` | já existe | Referência para as Sprints 36 (novo card de KPI), 37 (ajuste de tabela) e 39 (responsividade — tokens/breakpoints do tema) | Já feita |
| `responsividade-dispositivos` | sugerida na Sprint 39 | Checklist replicável de viewports-alvo (os aparelhos reais do usuário, não breakpoints genéricos) para validar qualquer tela nova do projeto, evitando descobrir problemas de responsividade só depois de construída | Média (a V5 já tem 2 itens de UI densa — 37 e 39 — que se beneficiariam de um checklist fixo) |
| `admin-metricas-avancadas` | sugerida na Sprint 38 | Documentar o padrão de extensão da RPC `admin_estatisticas()` (SECURITY DEFINER, gate por `pode_ver_banco()`) para agregações por usuário/item, caso surjam novos pedidos de detalhamento no painel `/admin` | Baixa (1 pedido até agora) |
