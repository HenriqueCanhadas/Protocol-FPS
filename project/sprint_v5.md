# PROTOCOL FPS — Planejamento de Sprints — V5

> Relatório gerado a partir da seção **V5** do arquivo `todo` (raiz do repositório).
> Data de geração/atualização: **25/08/2026**.
>
> A V5 sucede a V4 (`project/sprint_v4.md`, Sprints 23–33): os 7 itens
> (`todo:225` a `todo:237`) foram implementados e validados ao vivo/com testes
> reais, todos no mesmo dia (23/08/2026), Sprints 34 a 40. A única exceção a
> "coleta funcionando de ponta a ponta" é a Sprint 40 (Shopee): o scraper existe
> e está registrado em todo o sistema, mas a loja tem uma limitação estrutural
> confirmada (bloqueio de autenticação, 3/3 tentativas reais) e documentada em
> `README.md`/`CLAUDE.md`, no mesmo padrão já usado para a Pichau.
>
> A Sprint 41 reabriu a V5 para fechar `todo:204` — a proposta "Sprint 30",
> deixada de fora da V4 a pedido explícito do usuário (ver `sprint_v4.md`) e
> nunca retomada até agora. As Sprints 42–44 fecham 3 pedidos novos que o
> usuário adicionou direto no `todo` (linhas 239/241/243), no mesmo dia.
>
> **Sprints 45–50:** 6 itens novos adicionados pelo usuário direto no `todo`
> em 24–25/08/2026 (`todo:245`, `todo:247`, `todo:249`, `todo:251`, `todo:254`
> e `todo:256`) — um bug de categorias dinâmicas, um ajuste de layout do
> Admin, três lojas novas (AliExpress, Mocadopop e Mercado Livre) e ordenação
> por cabeçalho de coluna na tabela do Dashboard. As Sprints 45, 46 e 50 já
> foram implementadas e validadas (a 50 fora de ordem, a pedido do usuário) —
> o `todo` foi atualizado para `OK-` nas 3 linhas correspondentes (245, 247,
> 256) para refletir o código já presente no working tree; as Sprints 47–49
> (as 3 lojas novas) permanecem planejadas, ainda não iniciadas — datas
> estimadas a partir do dia seguinte à geração deste relatório (26/08/2026),
> pulando fim de semana (29–30/08).
>
> **Sprints 51–52:** 2 itens novos adicionados pelo usuário direto no `todo`
> em 25/08/2026 (`todo:258` e `todo:260`) — estilo dos campos da tela de
> login e remoção do texto de breadcrumb "Dashboard › X" em 4 páginas
> internas. As Sprints 51 e 52 já foram implementadas, ambas em 25/08/2026 e
> validadas só por build/leitura de código — o navegador não estava
> disponível nesta sessão (extensão Claude in Chrome desconectada) para
> confirmação visual em nenhuma das duas.
>
> **Sprint 53:** item novo adicionado pelo usuário direto no `todo` em
> 25/08/2026 (`todo:262`) — quebrar `NovoProduto`/`Usuários` em 2 blocos
> (esquerda/direita), como já feito no Admin (Sprint 46). Implementada no
> mesmo dia; validada ao vivo no navegador logo em seguida, junto com um
> pedido de ajuste do usuário sobre a mesma sprint (ver Sprint 53).
>
> **Sprint 54:** item novo em 25/08/2026 (`todo:264`) — replicar no Admin o
> mecanismo do Dashboard que trava a página inteira (sem rolagem própria) e
> faz só o conteúdo e a sidebar rolarem por dentro de si mesmos. Implementada
> e validada ao vivo no mesmo dia.
>
> **Sprint 55:** item novo em 25/08/2026 (`todo:266`) — 3 ajustes de UI no
> Novo Produto: título "NOVO PRODUTO" em 1 linha só, e o card "Criar Nova
> Categoria" simplificado (campo de texto ocupando a largura toda, botão
> abaixo dele, hint removido). Implementada e validada ao vivo no mesmo dia.
>
> **Sprint 56:** item novo em 25/08/2026 (`todo:268`) — 2 correções visuais:
> nomes de tabela quebrando linha no card "Tamanho por tabela" do Admin, e o
> botão "CRIAR CATEGORIA" (Novo Produto) que a Sprint 55 deixou em estilo
> neutro/branco por padrão, agora verde. Implementada e validada ao vivo no
> mesmo dia.
>
> **Sprint 57:** item novo em 25/08/2026 (`todo:270`) — pedido de validação
> geral dos cards da sidebar do Admin ("texto mal configurado" + a
> visualização de "Visão Geral" especificamente). Achado real: o card "Visão
> Geral" forçava 2 colunas numa sidebar estreita demais para isso, e os
> rótulos ("Itens monitorados", "Leituras de preço") quebravam no meio da
> palavra. Corrigido e validado ao vivo no mesmo dia.
>
> **Sprint 58:** item novo em 25/08/2026 (`todo:272`) — 2 correções pontuais
> ainda nos cards da sidebar do Admin: o título "Tamanho por Tabela (Protocol
> Fps)" simplificado para "Tamanho por Tabela", e o rótulo "Visão Geral"
> (borda superior do card) que aparecia literalmente cortado ao meio pela
> linha da borda — bug introduzido pela própria Sprint 54 (rolagem interna da
> sidebar). Implementada e validada ao vivo no mesmo dia.
>
> **Sprint 59:** item novo em 25/08/2026 (`todo:274`) — efeito colateral
> direto do próprio fix da Sprint 58 (mesmo dia): o `padding-top` adicionado
> só à sidebar para não cortar o rótulo "Visão Geral" desalinhou o topo da
> sidebar em relação ao topo da tabela "Detalhe por usuário e item" (~13px
> mais baixo). Corrigida e validada ao vivo no mesmo dia, com medição exata
> via JavaScript no navegador (diff de 0px após o ajuste).
>
> **Sprints 60–62:** 3 itens novos adicionados pelo usuário direto no `todo`
> em 25/08/2026 (`todo:276`, `todo:278`, `todo:280`) — mover o título de cada
> página para o cabeçalho (ao lado do menu hambúrguer), remover os textos de
> resumo/subtítulo do corpo como consequência dessa mudança, e deixar o
> cabeçalho da tabela "Detalhe por usuário e item" (Admin) fixo durante a
> rolagem interna (Sprint 54). Implementadas e validadas ao vivo no mesmo dia
> (25/08/2026), fora da ordem cronológica originalmente planejada (depois das
> Sprints 47–49, scrapers novos), a pedido explícito do usuário.
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
| 41 | Distinguir "esgotado confirmado" de "não localizado" na coleta | 23/08/2026 | 1 | 1 |
| 42 | Aviso de loja sem coleta (Pichau/Shopee) em Novo Produto | 24/08/2026 | 1 | 1 |
| 43 | Admin: layout fluido + filtro/ordenação no detalhe por usuário e item | 24/08/2026 | 1 | 1 |
| 44 | Dashboard: nova coluna Categoria na tabela | 24/08/2026 | 1 | 1 |
| 45 | Categorias novas não aparecem nos filtros nem para reatribuir categoria de item | 25/08/2026 | 1 | 1 |
| 46 | Admin: separar a visualização em 2 blocos (padrão Dashboard) | 25/08/2026 | 1 | 1 |
| 47 | Novo scraper — loja AliExpress | 26–27/08/2026 | 2 | 1 |
| 48 | Novo scraper — loja Mocadopop + migração dos itens do projeto legado | 28/08–01/09/2026 | 3 | 1 |
| 49 | Novo scraper — loja Mercado Livre | 02–03/09/2026 | 2 | 1 |
| 50 | Dashboard: ordenar clicando no cabeçalho da coluna, além do dropdown Ordenar | 25/08/2026 | 1 | 1 |
| 51 | Tela de login: campos de usuário/senha no estilo verde do tema | 25/08/2026 | 1 | 1 |
| 52 | Remover o texto de breadcrumb "Dashboard › X" das páginas internas | 25/08/2026 | 1 | 1 |
| 53 | Novo Produto e Usuários: layout em 2 blocos (esquerda/direita), padrão Admin | 25/08/2026 | 1 | 1 |
| 54 | Admin: página sem rolagem própria, tabela e sidebar rolando por dentro (padrão Dashboard) | 25/08/2026 | 1 | 1 |
| 55 | Novo Produto: título em 1 linha; card Criar Categoria simplificado | 25/08/2026 | 1 | 1 |
| 56 | Admin: nomes de tabela sem quebra em "Tamanho por tabela"; botão Criar Categoria verde | 25/08/2026 | 1 | 1 |
| 57 | Admin: card "Visão Geral" — labels quebrando no meio da palavra em 2 colunas | 25/08/2026 | 1 | 1 |
| 58 | Admin: título "Tamanho por Tabela" simplificado; rótulo "Visão Geral" cortado ao meio | 25/08/2026 | 1 | 1 |
| 59 | Admin: alinhar o topo da sidebar com o topo da tabela de detalhe | 25/08/2026 | 1 | 1 |
| 60 | Mover o título da página (Novo Produto/Usuários/Admin/Dashboard/Conta) para o cabeçalho, ao lado do menu hambúrguer | 25/08/2026 | 1 | 1 |
| 61 | Remover os textos de resumo do corpo das páginas (ex. subtítulo do Admin), consequência da Sprint 60 | 25/08/2026 | 1 | 1 |
| 62 | Admin: cabeçalho da tabela "Detalhe por usuário e item" fixo durante a rolagem | 25/08/2026 | 1 | 1 |

Sprints 34 a 40 concluídas, todas validadas ao vivo/com testes reais no mesmo
dia (23/08/2026). A numeração continua de onde a Sprint 33 (V4) parou. Único
item que não fecha em "coleta funcionando": a Sprint 40 entrega o scraper e o
registro ponta a ponta da loja Shopee, mas com uma limitação estrutural
confirmada e documentada (ver detalhes na própria sprint) — a loja não coleta
em nenhum ambiente hoje, por decisão análoga à já registrada para a Pichau.
A Sprint 41 fecha `todo:204`, pendente desde a V4. As Sprints 45 (`todo:245`),
46 (`todo:247`) e 50 (`todo:256`) já foram concluídas e validadas, todas em
25/08/2026 — a 50 foi implementada fora da ordem numérica, a pedido explícito
do usuário. O `todo` foi atualizado para `OK-` nessas 3 linhas nesta mesma
atualização do relatório, para refletir o código já presente no working tree
(confirmado por inspeção direta: `ThOrdenavel`/`.admin-grid`/`buscarCategorias`
já existem em `ProductTable.jsx`/`Admin.jsx`/`dashboard.service.js`). As
Sprints 47 a 49 (as 3 lojas novas — AliExpress, Mocadopop, Mercado Livre)
permanecem **planejadas, ainda não iniciadas** — itens `todo:249/251/254`,
ainda com prefixo `-` no `todo`.

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
| S40 · Criar `scrapers/shopee.py` (subclasse de `ScraperBase`) e registrar `"shopee"` no dict `SCRAPERS` de `main.py`; validar com o link de teste (Deck Box Pokémon) (todo:237) | `ShopeeScraper(headless=False).coletar('<link de teste>')` retorna um `DadosProduto` com nome/preço/disponibilidade corretos comparados à página real; rodar também com `headless=True`, seguindo a metodologia da skill `scraper-nova-loja` | ✅ Done — **implementado, registrado ponta a ponta, mas não coleta em nenhum ambiente (limitação confirmada e documentada)** | **O risco sinalizado pelo próprio usuário se confirmou.** Inspeção ao vivo da página real (sessão logada): JSON-LD `Product` limpo com `offers.price`/`offers.availability` (mesmo padrão Kabum/Tuyo) — mas o HTML inicial (`curl` sem JS) é um shell vazio (`<div id="main">`), **tudo client-side**; a classe CSS do preço é um hash de CSS-modules (`pyzxvq pw3J3G`), descartada de propósito como fonte (instável a cada deploy). `scrapers/shopee.py` implementado com JSON-LD → texto completo (sem CSS), `_aguardar_preco` esperando até 25-40s pelo JSON-LD **ou** pelo redirect de bloqueio (o que vier primeiro). Registrado ponta a ponta: `SCRAPERS` (`main.py`), `.github/workflows/coletar.yml` (descrição do input `loja`), `Dashboard.constants.js` e `NovoProduto.jsx` (filtro/seleção de loja no front), e uma linha nova em `lojas` no Supabase (`nome="Shopee"`, via `SERVICE_KEY` — mesmo mecanismo usado pelo coletor, sem precisar de migração SQL manual). **Teste real com o Playwright do próprio coletor** (`headless=False` e `headless=True`, sem nenhuma sessão — o cenário real do coletor): **3/3 tentativas** redirecionadas via JS para `shopee.com.br/verify/traffic/error` ("Login Necessário"), cada uma com um `tracking_id` diferente (não é cache nem flake), confirmado em ~4-9s. **Decisão registrada** (README.md + CLAUDE.md, mesmo padrão da Pichau): diferente da Pichau (rate-limit por IP de datacenter, onde retry com backoff pode "pegar" uma janela livre), aqui é um **portão de autenticação** — sem uma sessão logada persistida, nenhuma tentativa muda o resultado, então **não foi aplicado o retry da Pichau** (não serviria pra nada, só gastaria tempo em CI). O scraper detecta o bloqueio honestamente (`_eh_parede_de_login`) e retorna `disponivel=False`/sem preço em segundos — nunca um preço ou "esgotado" falso. **CI testado a pedido do usuário** ("uma última possibilidade"): commit `ef43ee4` + push para `Duplicate-Main`, item de teste real inserido em `itens` (mesmo produto Deck Box Pokémon) e linha nova em `lojas` via `SERVICE_KEY`, `workflow_dispatch loja=shopee` disparado via API do GitHub. **Resultado** ([run 32674108485](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/32674108485), job `success`): **diferente do mecanismo local, mesma conclusão** — no CI a página não chegou a redirecionar para `/verify/traffic/` nem a carregar o JSON-LD; ficou com `título=''` pelos 40s inteiros do timeout, um bloqueio ainda mais silencioso a partir do IP de datacenter do runner (provável descarte de rede das chamadas de API da Shopee antes de qualquer resposta, em vez do redirect "educado" visto localmente). O coletor tratou certo mesmo assim: 0 preço salvo, `disponivel=False`, "histórico não salvo", job terminou com sucesso — sem crash, sem dado falso. **Conclusão final:** Shopee confirmada não-operante em **todos** os ambientes testados (local headless/non-headless **e** CI), por dois mecanismos de bloqueio distintos que convergem para o mesmo resultado — a decisão de não coletar Shopee está definitiva até o projeto suportar sessão autenticada persistida (fora do escopo atual) |

---

## Sprint 41 — Esgotado confirmado × não localizado (23/08/2026)

Proposta original desta pergunta ("Sprint 30") registrada em `project/sprint_v4.md`
desde a Sprint 29 e deixada de fora a pedido explícito do usuário na época
("implementar somente `todo:206` e `todo:208`") — nunca retomada até agora.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S41 · Diferenciar "esgotado" de "não localizado" na coleta, informando de fato quando o produto está esgotado (todo:204) | Um item cujo scraper não achou o seletor de preço (erro/challenge) aparece com um status diferente de um item cujo scraper confirmou `disponivel=false` (esgotado de verdade); o usuário consegue distinguir os dois casos na tabela | ✅ Done — **validado ponta a ponta contra o banco real, pós-migração** | **Achado ao investigar:** os 9 scrapers já colapsavam os dois casos no mesmo resultado (`disponivel=false, preco=None`) — e como `historico_precos.preco` era `NOT NULL`, o coletor **nunca gravava linha nenhuma** quando não havia preço (`if dados.preco is None: continue`, sem insert). Ou seja, nem o esgotamento real chegava a aparecer na Dashboard: ela só mostrava o último preço válido anterior, para sempre, em qualquer dos dois casos. **Implementado:** novo campo `DadosProduto.encontrado` (`scrapers/base.py`, default `True`) — `False` só nos ramos que hoje representam falha de extração (challenge/bloqueio detectado, exceção/timeout no `coletar()` do `base.py`, ou o fallback final "preço não encontrado" depois de esgotados todos os seletores) nos 9 scrapers; os ramos de esgotamento **confirmado** (JSON-LD/DOM/meta explicitamente dizendo fora de estoque) mantêm o default `True`. `main.py`: agora toda leitura vira uma linha em `historico_precos` (mesmo sem preço), com o novo campo `encontrado` no payload; 3 contadores no resumo final (`✓ Com preço` / `✗ Esgotados` / `✗ Não localizados`); alerta e verificação de meta continuam pulados sempre que não há preço, como antes. **Migração** `project/migrations/sprint41_status_localizacao.sql` (idempotente, rodada pelo usuário no SQL Editor): `preco` deixou de ser `NOT NULL` e a coluna `encontrado boolean not null default true` foi adicionada (linhas antigas todas retrocompatíveis com `true`, conferido via `select ... limit 3` no banco real). Front-end (`Dashboard.constants.js`): novo `statusItem(item)` compartilhado por `ProductTable` e `ItemDetailPanel` (antes cada um duplicava a mesma lógica de 3 estados) — 4º estado `NÃO LOCALIZADO` (token `--blue`, novo `.status-badge.notfound`) quando `item.encontrado === false`, checado **antes** de `disponivel` para não ser mascarado por ele; `dashboard.service.js` passa `encontrado` em todos os `select`s de `historico_precos` relevantes (`buscarItens`, `buscarAtividadeRecente`, `buscarDetalheDia`, `buscarHistoricoCompleto`); `ProductHistoryDialog`/`CollectionDayDialog`/`ItemDetailPanel` (feed de atividade) mostram "não localizado" em vez de "esgotado" nas linhas onde `encontrado===false` (o `GraficoHistorico` não precisou de mudança — já filtra pontos sem preço antes de plotar, então nunca renderiza uma leitura não localizada). **Validação ponta a ponta pós-migração (mesmo dia):** confirmado por `select` direto no banco que `historico_precos` já tem a coluna `encontrado` (linhas pré-existentes com `true`, coerente com o default). Item de teste real criado via `SUPABASE_SERVICE_KEY` (loja Kabum, dono admin) apontando para o mesmo produto confirmado esgotado usado na validação anterior; rodado o coletor de verdade (`ITEM_ID=<id> python main.py`, modo PONTUAL) duas vezes: (1) com a URL original → log "✗ ESGOTADO (confirmado)", linha salva com `preco=None, disponivel=False, encontrado=True`; (2) com a URL trocada para um host inexistente → log "✗ NÃO LOCALIZADO (erro/challenge/seletor ausente)", linha salva com `preco=None, disponivel=False, encontrado=False`. As duas linhas conferidas por leitura direta do banco batem exatamente com o esperado, e a leitura mais recente (não localizado) é a que a Dashboard usaria como "última leitura" — exatamente o caso que `statusItem()` precisa resolver como `NÃO LOCALIZADO`, checando `encontrado` antes de `disponivel`. `python -m py_compile` nos 10 arquivos Python e `npm run build` (111 módulos) OK. Item e as 2 leituras de teste removidos do banco ao final (`SUPABASE_SERVICE_KEY`), confirmado vazio por `select` |

---

## Sprint 42 — Aviso de loja sem coleta (Pichau/Shopee) em Novo Produto (24/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S42 · Ao selecionar Shopee (e, se possível, Pichau) no formulário de Novo Produto, mostrar um aviso de que o projeto não consegue coletar essa loja (todo:239) | Selecionar Shopee ou Pichau no select de Loja mostra um aviso explicando a limitação; selecionar qualquer outra loja não mostra nada | ✅ Done — **validado ao vivo** | **Implementado:** novo dict `LOJAS_SEM_COLETA` em `NovoProduto.jsx` com o texto de cada loja (Pichau: bloqueio de IP de datacenter — só funciona coleta local; Shopee: parede de login — não coleta em nenhum ambiente hoje), mesma linguagem já usada em `README.md`/`CLAUDE.md`/`sprint_v4.md`/`sprint_v5.md` para essas 2 limitações. Renderizado como `.field-warn` (novo token global em `theme.css`, borda/texto `--amber`) logo abaixo do `<select>` de Loja, condicional a `LOJAS_SEM_COLETA[loja]`. **Validado ao vivo no navegador:** trocando o select entre Shopee → aviso amber aparece com o texto da parede de login; Pichau → aviso troca para o texto do bloqueio de datacenter; KaBuM → aviso desaparece (nenhuma das 7 lojas saudáveis mostra o aviso). Zero erros no console. `npm run build` — 111 módulos, sem erros |

---

## Sprint 43 — Admin: layout fluido + filtro/ordenação (24/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S43 · Tornar o layout de `/admin` mais fluido (ocupar todo o espaço da tela) e permitir filtrar/ordenar a tabela "Detalhe por usuário e item" por loja, usuário, item etc. (todo:241) | `/admin` usa mais largura de tela do que as 960px atuais; a tabela de detalhe tem um campo de busca e/ou filtro por loja, e clicar numa coluna ordena a lista por ela | ✅ Done — **validado ao vivo** | **Layout:** `.page-wrap` de `Admin.jsx` saiu de `min(960px,100%)` (o mesmo cap usado por páginas de formulário estreitas, como `NovoProduto`/`Usuarios`) para `min(1800px,100%)` — justificado porque `/admin` é uma tela de métricas/tabelas densas, não um formulário, e se beneficia do espaço extra em telas grandes; nenhuma outra página foi tocada (CSS local do arquivo). **Filtro/ordenação:** a tabela "Detalhe por usuário e item" ganhou uma busca de texto livre (usuário/item/loja/categoria) + um `<select>` de loja (opções derivadas dos dados já carregados) e cabeçalhos clicáveis nas 6 colunas com indicador ▲/▼ da coluna ativa — tudo client-side via `useMemo` sobre a lista que a RPC `admin_estatisticas()` já retorna inteira (mesmo padrão do `useDashboardFilters` do Dashboard; nenhuma query nova, nenhuma mudança na RPC). Ordenação trata número/booleano/texto (`Leituras`/`Status` vs. `Usuário`/`Item`/`Loja`/`Categoria`) e contador "N de M item(ns)" acompanha o filtro. **Validado ao vivo no navegador (sessão real, 39 itens):** busca "Ryzen" → 1 de 39 (item certo); filtro loja=Shopee → 1 de 39 (item certo); clique em "Leituras" ordenou ascendente (0, 1, 1...) e o clique de novo inverteria para descendente; responsivo testado via iframe 412×892 (Galaxy A30) — busca e select empilham em coluna cheia, sem overflow. Zero erros no console em nenhum dos passos. `npm run build` — 111 módulos, sem erros |

---

## Sprint 44 — Dashboard: coluna Categoria na tabela (24/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S44 · Adicionar uma coluna simples informando a categoria do item na tabela do Dashboard (todo:243) | A tabela do Dashboard mostra a categoria de cada item numa coluna própria, junto de Produto/Loja/Preço/Status | ✅ Done — **validado ao vivo** | **Implementado:** nova coluna "Categoria" em `ProductTable.jsx`, entre Loja e Preço Atual, usando o `CAT_LABEL` já existente em `Dashboard.constants.js` para o rótulo amigável (ex. `STORAGE` → "Armazenamento", `PSU` → "Fonte"; sigla bruta como fallback para categorias novas criadas pelo admin, que não têm entrada fixa no dict). O texto de categoria que já existia como subtexto embaixo do nome do produto (`.prod-cat`) foi removido — ficaria duplicado com a coluna nova; o subtexto agora só aparece (visão admin) para a badge "◈ dono". Larguras das colunas redistribuídas para caber a 5ª coluna (Produto 45%→40%, Loja 17%→15%, Status 18%→15%, Categoria nova 12%) e o `min-width` da tabela subiu de 760px para 820px. O layout de cards do celular (Sprint 39/V4) foi ajustado — os seletores `td:nth-child(N)` que reordenam as colunas em modo card foram reindexados para as 5 colunas (Preço continua sendo empurrado para a direita via `margin-left:auto`, agora no 4º filho em vez do 3º). **Validado ao vivo no navegador:** coluna populada com as categorias reais da sessão (CPU, GPU, Diversos, Armazenamento, etc.); modo card testado via iframe 412×892 (Galaxy A30) com zoom no elemento — loja + categoria + preço + status numa linha só, sem corte nem rolagem horizontal. Zero erros no console. `npm run build` — 111 módulos, sem erros |

---

## Sprint 45 — Categorias novas não aparecem nos filtros / na troca de categoria (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S45 · Corrigir para que uma categoria criada via "+ Nova categoria" (Sprints 31/33) apareça (1) no filtro de categoria do Dashboard e (2) no modal "Alterar categoria" de um item já existente (todo:245) | Criar uma categoria nova em Novo Produto e, sem reload manual do outro lugar, ela aparece como opção no filtro de categoria do Dashboard e no modal "Alterar categoria" de qualquer item | ✅ Done | **Causa raiz confirmada:** `ControlBar.jsx` (filtro) e `ProductActionsDialog.jsx` (modal "Alterar categoria") importavam a lista fixa `FILTROS_CAT` de `Dashboard.constants.js` (as 7 categorias originais), enquanto `NovoProduto.jsx` já buscava `produtos` do banco dinamicamente (Sprint 31) — qualquer categoria criada depois (ex.: as já reais `CARTAO_DE_MEMORIA`/`CONSOLE`, encontradas no próprio banco durante a investigação) ficava invisível nesses dois pontos, mesmo já usada por itens cadastrados. **Corrigido:** nova `buscarCategorias()` em `dashboard.service.js` (mesma tabela `produtos`, sem filtro); `Dashboard/index.jsx` carrega essa lista uma vez (estado `categorias`) e repassa para `ControlBar` e `ProductActionsDialog`, substituindo `FILTROS_CAT` (removido — sem consumidor restante) nos dois componentes; novo helper `ordenarCategorias`/`rotuloCategoria` em `Dashboard.constants.js` (mesma convenção de ordenação fixa-primeiro-depois-alfabética já usada em `NovoProduto.jsx`), com fallback pelo nome salvo no banco (`produtos.nome`) em vez da sigla crua para categorias sem rótulo fixo. **Validado ao vivo (Playwright, sem tocar em nenhuma conta real):** usuário e item de teste temporários criados via API admin/SERVICE_KEY, usando uma categoria **já real e existente no banco** ("Console", criada num sprint anterior) — exatamente o caso relatado. Login na SPA local confirmou: o `<select>` de Categoria da toolbar já lista "Cartão de Memória" e "Console" junto das 7 fixas; filtrar por "Console" mostra o item de teste; selecionar o item e abrir Opções → Alterar categoria mostra o chip "CONSOLE" já pré-selecionado (mesmo padrão visual dos demais chips, sem overflow). Zero erros no console do navegador. Usuário e item de teste removidos ao final (nenhum dado de teste permanece no banco). `npm run build` — 111 módulos, sem erros |

---

## Sprint 46 — Admin: separar em 2 blocos, padrão Dashboard (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S46 · Reorganizar `pages/Admin.jsx` em 2 blocos visuais, no mesmo espírito conteúdo+sidebar do Dashboard (`.dash-grid`, Sprint 21) (todo:247) | `/admin` mostra a informação dividida em 2 blocos lado a lado (ou empilhados no mobile, seguindo os breakpoints já validados na Sprint 39), em vez do empilhamento único atual de seções | ✅ Done | **Decisão confirmada com o usuário:** bloco principal (largo) = "Detalhe por usuário e item" (a tabela densa, com busca/filtro/ordenação da Sprint 43); bloco lateral (360px, fixo ao rolar — `position:sticky`) = os 4 painéis de métrica agregada (Visão geral/Espaço em disco/Tamanho por tabela/Saúde da coleta), mesmo papel que a sidebar do Dashboard tem em relação à tabela de preços. **Implementado:** novo `.admin-grid`/`.admin-content`/`.admin-sidebar` (mesmo corte de 1100px do `.dash-grid`, Sprint 21) só no CSS local de `Admin.jsx`; dentro da sidebar, `.stat-grid` força 2 colunas e `.dr-nome` (barras de "Tamanho por tabela") encolhe para 84px — mesmo ajuste de densidade que o Dashboard já faz para caber 4 KPIs num painel estreito. **Bug pego só ao testar de fato em 412px (Galaxy A30):** a regra mobile inicial usava `grid-template-columns:1fr` puro — sem o `minmax(0, ...)`, a track de grid ainda cresce para caber o min-content dos descendentes (a tabela de detalhe), "estourando" a viewport em 25px mesmo com o card avisando 1 coluna só; corrigido para `minmax(0,1fr)` (mesmo princípio do `min-width:0` do flexbox, aplicado a grid). **Validado ao vivo com Playwright** (usuário de teste temporário com `ver_banco=true`, removido ao final — nenhuma conta real tocada): desktop 1600px — conteúdo 1165px + sidebar exatos 360px, rótulos dos cards no bloco certo, sidebar permanece visível ao rolar a tabela (sticky); 900px — os 2 blocos empilham (confirmado nenhum lado a lado) e `scrollWidth-clientWidth=0`; Galaxy A30 (412×892, via iframe) — overflow de página **0** após o fix do grid (era 25px antes). Zero erros no console em todos os passos. `npm run build` — 111 módulos, sem erros |

---

## Sprint 47 — Novo scraper: loja AliExpress (26–27/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S47 · Criar `scrapers/aliexpress.py` (subclasse de `ScraperBase`) e registrar `"aliexpress"` no dict `SCRAPERS` de `main.py`; validar com o link de teste (todo:249) | `AliExpressScraper(headless=False).coletar('<link de teste>')` retorna um `DadosProduto` com nome/preço/disponibilidade corretos comparados à página real; seguir a metodologia da skill `scraper-nova-loja` (inspeção real antes de escolher seletor, teste headless e non-headless, e se possível 3 runs de CI reais) | ✅ Done — **validado local (2/2) + limitação de CI confirmada (3/3)** | **Inspeção real** (navegador, `pt.aliexpress.com`): JSON-LD `Product` limpo com `offers.price`("29.56")/`priceCurrency`("BRL", batendo com o preço visível R$29,56)/`availability`("InStock") — sem meta tags `og:price:*`/`product:price:*` (ausentes, confirmado). **Implementado** `scrapers/aliexpress.py` seguindo o molde da Kabum (JSON-LD → CSS ofuscado `price-default--current--<hash>` → varredura JS), disponibilidade contra o mesmo conjunto schema.org do projeto + fallback por palavras-chave (não confirmado ao vivo o caminho esgotado, mesmo precedente documentado na Amazon); registrado em `SCRAPERS` (`main.py`) e nas 3 listas do frontend (`LOJAS_DETECTADAS`/`LOJAS_LABEL` em `NovoProduto.jsx`, `LOJAS_FILTER` em `Dashboard.constants.js`). **Validado local:** `headless=False` e `headless=True` bateram exatamente com a página real (`preco=29.56, disponivel=True, encontrado=True`, nome completo). **Confirmado o risco que a própria sprint já sinalizava:** criado 1 item de teste real no Supabase (loja `Aliexpress` inserida em `lojas`, categoria Diversos, dono removido ao final) para rodar `workflow_dispatch loja=aliexpress` **3 vezes reais** em `Duplicate-Main` — as **3 rodadas** mostraram o mesmo bloqueio sistemático: o IP de datacenter do runner faz o AliExpress redirecionar `pt.aliexpress.com` para `www.aliexpress.us` (item id diferente, vitrine americana), página que não renderiza dentro do timeout (`título=''`). Diferente da Pichau (rate-limit, retry ajudaria) e mais parecido com a Shopee em espírito (bloqueio estrutural, não transitório) — mas um terceiro mecanismo distinto (redirecionamento geográfico, não parede de login). O scraper reagiu corretamente: `encontrado=False` → "NÃO LOCALIZADO" nos 3 runs, nunca um falso "esgotado". **Decisão registrada** (README.md "Limitação conhecida" + CLAUDE.md "Known limitation — AliExpress", mesmo padrão da Pichau/Shopee): loja cadastrável normalmente, mas a coleta automática diária só funciona rodando localmente; aviso adicionado em `LOJAS_SEM_COLETA` (`NovoProduto.jsx`) para não surpreender o usuário. Item/histórico de teste removidos do Supabase ao final (a loja `Aliexpress` ficou registrada permanentemente, mesmo padrão da Sprint 29). `npm run build` — 111 módulos, sem erros |

---

## Sprint 48 — Novo scraper: loja Mocadopop + migração dos itens do projeto legado (28/08–01/09/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S48 · Criar `scrapers/mocadopop.py` e registrar `"mocadopop"` em `SCRAPERS`; validar com o link de teste (todo:251) | `MocadopopScraper(headless=False).coletar('<link de teste>')` retorna nome/preço/disponibilidade corretos; seguir a metodologia da skill `scraper-nova-loja` | ✅ Done — **validado local (9/9) + 3/3 runs de CI reais, sem bloqueio** | **Decisão em aberto resolvida com o usuário:** escopo (b) confirmado — scraper novo **e** migração dos dados legados. Achado que mudou o plano original: os dados legados **não estão em outro banco** — o usuário confirmou que vivem no MESMO projeto Supabase, em duas tabelas paralelas (`produtos_funko`, 9 itens; `historico_precos_funko`, 1107 leituras de 25/04 a 25/08/2026 — cron legado ainda ativo). Isso permitiu migrar via API (SERVICE_KEY) em vez de precisar de um dump externo. **Inspeção real (Playwright, plataforma "Loja Integrada", confirmado via `meta[name=generator]`):** sem JSON-LD e sem meta tags de preço em toda a plataforma (confirmado em 3 produtos reais). Armadilha real encontrada e corrigida (mesmo padrão já documentado no comentário da Amazon): a página do produto e os carrosséis de relacionados reusam as mesmas classes de preço/botão — sem escopo, `.preco-promocional` pegava o preço de um produto errado; corrigido escopando toda extração dentro de `div.span12.produto` (container único por página). **Implementado** `scrapers/mocadopop.py`: preço = `.desconto-a-vista` (Pix, com extração por regex — o elemento às vezes tem uma segunda linha "Economize: R$ X" que quebraria uma limpeza ingênua do texto inteiro) → fallback `data-sell-price` (atributo numérico limpo) → fallback preço de tabela; disponibilidade = visibilidade real do form `#avise-me-cadastro` (id único, sempre presente no HTML com `display:none`, mostrado via JS só quando esgotado — não confirmado ao vivo o caminho esgotado, os 9 produtos legados estavam todos disponíveis, mesmo precedente da Amazon) + varredura de palavras-chave. Registrado em `SCRAPERS` (`main.py`) e nas 3 listas do frontend. **Validado local:** os 9 URLs legados retornaram `preco`/`disponivel` **idênticos ao último valor já registrado no histórico legado** (899.91, 89.91, 629.91, 1169.91, 440.91×2, 260.91, 899.91, 269.91) — 9/9 batendo, headless=True e headless=False conferidos num deles. **Migração executada e validada** (`project/migrations/sprint48_mocadopop_migracao.sql`, documentado mas rodado de fato via API por já estar no mesmo projeto): loja `Mocadopop` criada; 9 itens migrados (categoria Diversos, dono pedrosacanhadas@gmail.com, `monitorando=true` — decisão do usuário, diferente do `false` da Sprint 8/Kabum, já que o scraper novo assume a coleta desses itens); 1107 leituras migradas preservando `coletado_em` original e mapeando `status` legado (`Disponível`→`disponivel=true,encontrado=true`; `Erro de Conexão`, sempre com `preco=null`, 0 exceções→`disponivel=false,encontrado=false`, semântica de "não localizado", nunca um esgotado real — o legado nunca detectou esgotamento de fato). **Conferido ponta a ponta:** contagem exata por item, legado == novo, 1107/1107; timestamp e status de uma linha de erro conferidos manualmente. Tabelas legadas (`produtos_funko`/`historico_precos_funko`) mantidas intactas. **CI validado: 3 runs reais de `workflow_dispatch loja=mocadopop`** em `Duplicate-Main` — **3/3 com sucesso total**, os 9 itens coletados em cada rodada com os mesmos preços da validação local (1169.91, 440.91×2, 260.91, 899.91×2, 269.91, 89.91, 629.91), `Esgotados: 0`, nenhum sinal de challenge/bloqueio — diferente de Pichau/Shopee/AliExpress, a Mocadopop **não tem nenhuma limitação conhecida de datacenter**, coleta normalmente no cron diário. **Pendente apenas do lado do usuário:** desativar o cron do repositório legado `Monitoramento` (fora do alcance deste projeto) para não duplicar coleta/histórico dos mesmos 9 itens dali em diante. `npm run build` — 111 módulos, sem erros. **Bug real encontrado pelo usuário após a entrega inicial (mesmo dia) e corrigido:** o "9/9 batendo" acima estava **mascarando um bug** — o usuário pediu pra validar contra o preço real da loja e confirmou visualmente (navegador real) que 2 dos 9 produtos (Evangelion Eva Unit 01 747 e LoL Dj Sona Concussive 08, ambos "Item raro"/"Encomenda") na verdade mostram **"Consulte o preço"** (a loja não publica preço pra esses itens), não os valores que o scraper reportava. Causa raiz: `div.span12.produto` não é escopo suficiente — carrosséis de "relacionados" moram dentro dele, mais abaixo na página; para a maioria dos produtos isso não importava (o preço do próprio produto vem primeiro no DOM), mas nesses 2 casos o bloco do próprio produto não tem nenhum elemento de preço, então o seletor "vazava" pro primeiro preço de um card de carrossel — que por coincidência batia com o valor já existente no histórico (o que mascarou o bug na validação inicial "9/9"). **Corrigido:** escopo trocado para `div.principal.geral` (mais estreito, exclui os carrosséis); adicionada detecção explícita de "sob consulta" via `.preco-produto` só pra log mais claro. Re-testado: os 2 casos agora retornam corretamente `encontrado=False` ("não localizado", sem inventar preço) e os outros 7 continuam batendo. As 3 leituras erradas que os runs de CI desta sprint já tinham gravado pra esses 2 itens (899.91 e 89.91) foram corrigidas no Supabase (apagadas e regravadas como não-localizado, mesmos timestamps). **Ressalva sobre o histórico migrado:** não é possível auditar se o scraper do projeto legado `Monitoramento` tinha o mesmo tipo de bug nas 1107 leituras já migradas (código-fonte daquele repositório não está acessível) — as leituras antigas desses 2 itens específicos podem conter contaminação semelhante; ficou fora do escopo corrigir dados históricos de origem incerta. Revalidado em CI após o fix — ver resultado abaixo |

---

## Sprint 49 — Novo scraper: loja Mercado Livre (02–03/09/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S49 · Criar `scrapers/mercadolivre.py` e registrar `"mercadolivre"` em `SCRAPERS`; validar com o link de teste (todo:254) | `MercadoLivreScraper(headless=False).coletar('<link de teste>')` retorna nome/preço/disponibilidade corretos comparados à página real; seguir a metodologia da skill `scraper-nova-loja` | ⬜ Todo | **Nota:** o link de teste do `todo` traz uma URL longa com parâmetros de rastreamento de anúncio (`matt_*`, `gclid`, etc.) — confirmar que o scraper extrai o mesmo produto a partir da URL "limpa" (`.../p/MLB...`), já que esses parâmetros de campanha tendem a expirar/mudar e não devem ser parte do contrato do scraper. Resultado esperado: mesma ordem de extração em camadas (JSON-LD → meta → CSS → texto) já usada nos demais scrapers; Mercado Livre também tem histórico de bot-protection — se o CI travar, registrar a mesma decisão honesta já aplicada a Pichau/Shopee em vez de insistir sem uma sessão persistida |

---

## Sprint 50 — Dashboard: ordenar pelo cabeçalho da coluna (25/08/2026)

Implementada fora da ordem numérica, a pedido explícito do usuário — as
Sprints 47 a 49 (lojas novas) continuam planejadas para depois.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S50 · Além do dropdown "Ordenar" da `ControlBar`, permitir ordenar a tabela do Dashboard clicando direto no cabeçalho de cada coluna (Produto/Loja/Categoria/Preço Atual/Status), com indicador ▲/▼ na coluna ativa — mesmo padrão já entregue na tabela "Detalhe por usuário e item" do Admin (Sprint 43) (todo:256) | Clicar no cabeçalho de uma coluna ordena a tabela por ela (clique de novo inverte asc/desc, com a seta trocando de sentido); o dropdown "Ordenar" e o clique no cabeçalho ficam sincronizados — ordenar por um dos dois reflete no outro | ✅ Done | **Decisão resolvida pelo próprio enunciado da sprint** (que já listava as 5 colunas como clicáveis): `Categoria` e as demais colunas sem critério prévio (`Loja`, `Status`) entraram como **novos critérios de ordenação**, não só como um clique "mudo". **Implementado:** `useDashboardFilters.js` ganhou `loja`/`categoria`/`status` no bloco de ordenação por texto (`localeCompare`, mesmo tratamento que `nome` já tinha) — `categoria` ordena pela sigla salva em `produtos.categoria` (não pelo rótulo amigável, mesma comparação já usada nos filtros) e `status` pelo texto do badge (`statusItem(item).texto` — ALERTA/ESGOTADO/NÃO LOCALIZADO/OFF/OK, ordem alfabética simples, sem hierarquia de severidade). `ControlBar.jsx`: dropdown "Ordenar" ganhou as mesmas 3 opções novas (Loja/Categoria/Status), então os dois controles operam sobre o mesmo `sortCampo`/`sortDir` — sincronizados por construção, não por lógica extra. `ProductTable.jsx`: novo `<th>` reutilizável `ThOrdenavel` (mesmo nome de padrão do `thOrdenavel` do Admin) chama `toggleSort(campo)` e mostra ▲/▼ quando `sortCampo` bate com a coluna; CSS `.sortable`/`.sort-arrow` adicionado ao `css` local de `Dashboard/index.jsx`, mesmas classes do Admin (base para a skill `tabela-ordenavel-padrao` sugerida). Nenhuma duplicação de lógica de ordenação — cabeçalho e dropdown chamam o mesmo `toggleSort`. Como já esperado, `<thead>` continua escondido abaixo de 700px (Sprint 39) — recurso de desktop, dropdown é o único caminho no celular, sem mudança ali. **Validado ao vivo com Playwright** (usuário de teste temporário promovido a admin só para leitura, removido ao final — nenhuma conta real tocada, nenhuma escrita nos dados): clicar "Loja" ordenou asc (AMAZON→KABUM→…) e o dropdown passou a mostrar "Loja" automaticamente (prova da sincronização bidirecional); clique de novo inverteu para desc (TUYO→TANGLE TEEZER→…) com a seta trocando ▲→▼; escolher "Categoria" no dropdown fez a seta aparecer no `<th>` Categoria; clicar "Status" ordenou ESGOTADO antes de OK e sincronizou o dropdown; clicar "Produto" confirmou ordem alfabética exata (`sorted()` bateu 100%). Zero erros no console. `npm run build` — 111 módulos, sem erros |

---

## Sprint 51 — Tela de login: estilo verde do tema (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S51 · Ajustar `LoginScreen` para que a escrita digitada nos campos de usuário e senha use o mesmo verde de texto do tema (`--green`), com fundo semelhante ao do botão de pesquisa (`.search-icon-btn`, Sprint 24) (todo:258) | Digitar nos campos de usuário/senha da tela de login mostra o texto em `--green` sobre um fundo no mesmo estilo do botão de busca do Dashboard, mantendo legibilidade e sem quebrar autofill/placeholder | ✅ Done | **Causa raiz do "fundo semelhante ao botão de pesquisa":** o botão que abre a busca do Dashboard (`.search-icon-btn`, `ControlBar.jsx`) usa `background:var(--bg3)` — mais claro que o `var(--bg)` que os campos de login (`.field-input`, classe global reaproveitada em todos os formulários do projeto) usavam antes. **Implementado em `theme.css`:** regra escopada `.login-box .field-input` (especificidade maior que `.field-input` sozinha, então sobrepõe só dentro da tela de login sem tocar nos demais formulários — `NovoProduto`, `SearchDialog`, `ProductActionsDialog` etc. continuam com o fundo `--bg` de sempre) com `background:var(--bg3)` (mesmo tom do botão de busca), `color:var(--green)` e `caret-color:var(--green)` (texto digitado e cursor piscante no verde do tema, em vez do `var(--text)` cinza padrão); placeholder mantido em `--text-muted` para não perder o contraste de "campo vazio vs. preenchido". Adicionado também um override de autofill (`:-webkit-autofill`) com `-webkit-text-fill-color:var(--green)` e `-webkit-box-shadow:0 0 0 1000px var(--bg3) inset`, já que o Chrome força fundo branco/texto preto por padrão no autofill — sem o override, um usuário com email/senha salvos veria o campo fora do tema ao reabrir a página. `npm run build` — 111 módulos, sem erros. **Validação:** só por build e leitura de código — a extensão Claude in Chrome não estava conectada nesta sessão, então não foi possível confirmar visualmente no navegador; a extensão foi desconectada antes da tentativa de screenshot, sem qualquer ação deste agente. Recomenda-se conferir visualmente na próxima sessão com o navegador disponível |

---

## Sprint 52 — Remover breadcrumb "Dashboard › X" das páginas internas (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S52 · Remover o texto de breadcrumb "Dashboard › Novo Produto", "Dashboard › Usuários", "Dashboard › Admin" e "Dashboard › Conta" das 4 páginas correspondentes (todo:260) | Nenhuma das 4 páginas mostra mais o texto "Dashboard › X" acima do conteúdo; navegação (NavDrawer, `AppHeader`) e o restante do layout de cada página permanecem intactos | ✅ Done | **Localizado:** as 4 páginas tinham um `<nav className="breadcrumb"><Link to="/">Dashboard</Link><span>›</span><span>X</span></nav>` idêntico logo no topo do `.page-wrap`, cada uma com sua própria cópia local das 3 regras CSS `.breadcrumb`/`.breadcrumb a`/`.breadcrumb a:hover` (nunca foi um componente compartilhado). **Removido** o bloco `<nav>` inteiro de `NovoProduto.jsx`, `Usuarios.jsx`, `Admin.jsx` e `Conta.jsx` — o `page-title`/`page-title-sm` de cada página passa a ser o primeiro elemento visível dentro do `.page-wrap`, sem heading perdido (o título grande da página já cumpre esse papel de accessibility landmark); removidas junto as 3 regras `.breadcrumb*` mortas do `css` local de cada arquivo (nenhuma outra página as usa). **Import `Link` de `react-router-dom`** removido nas 4 páginas (era usado só no breadcrumb): em `NovoProduto.jsx`/`Conta.jsx` era o único import da lib; em `Admin.jsx`/`Usuarios.jsx` estava combinado com `Navigate` (`import { Link, Navigate }`), mantido só `Navigate` (usado pelo redirect de rota admin-only). Grep confirmou zero referências restantes a `breadcrumb` ou `Link` nas 4 páginas. `npm run build` — 111 módulos, sem erros (bundle JS levemente menor, de 523.22 kB para 521.45 kB, coerente com a remoção de código morto). **Validação:** inicialmente só por build (extensão Claude in Chrome desconectada); **confirmado visualmente 25/08/2026** (mesma sessão da Sprint 53) em `/novo-produto` e `/usuários` — nenhum "Dashboard › X" acima do título, `AppHeader`/menu hambúrguer intactos. `Admin.jsx`/`Conta.jsx` não foram reabertas nesta validação visual (mudança idêntica nas 4, risco baixo) |

---

## Sprint 53 — Novo Produto e Usuários: layout em 2 blocos (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S53 · Quebrar `NovoProduto.jsx` e `Usuarios.jsx` em 2 blocos visuais (esquerda/direita), no mesmo espírito do `.admin-grid` do Admin (Sprint 46) e do `.dash-grid` do Dashboard (Sprint 21), em vez do único bloco centralizado atual (todo:262) | As duas páginas mostram o conteúdo dividido em 2 colunas lado a lado em telas largas (empilhadas no mobile, mesmo corte de 1100px já validado nas Sprints 21/39/46); nenhum campo/ação existente é perdido | ✅ Done | **Decisão de conteúdo por página** (mesmo critério do Admin: bloco maior = conteúdo primário/mais denso; bloco lateral = ações auxiliares): em `NovoProduto.jsx`, esquerda (`.np-content`) = formulário "Dados do Produto" + "Criar Nova Categoria" (admin-only); direita (`.np-sidebar`, 380px, sticky) = "Fila de Envio". Em `Usuarios.jsx`, esquerda (`.nu-content`) = tabela "Usuários Cadastrados" (a mais densa, se beneficia da largura extra); direita (`.nu-sidebar`, 380px, sticky) = "Criar Usuário" + "Alterar Senha de Usuário" empilhados. **Implementado:** novo `.np-grid`/`.nu-grid` (`display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:2rem`) + `*-content`/`*-sidebar`, mesmo corte de `@media (max-width:1100px)` que stacka para 1 coluna e tira o `position:sticky` da sidebar — padrão idêntico ao `.admin-grid`/`.dash-grid` já existentes (nenhuma classe nova inventada, só replicada). `page-wrap` alargado para caber 2 colunas confortavelmente: `NovoProduto` de `min(800px,100%)` para `min(1200px,100%)`; `Usuarios` de `min(960px,100%)` para `min(1500px,100%)` — dimensionado para a tabela de usuários (8 colunas com Telegram/Banco) continuar cabendo sem rolagem horizontal na coluna de conteúdo (~1088px disponíveis, folga sobre os 958px medidos como suficientes na Sprint 37). **Ajuste necessário na fila de envio:** `.item-row` de `NovoProduto` usava 4 colunas fixas (`1fr auto auto auto` — nome, loja, meta, ações) pensadas para os ~800px de largura antigos; na sidebar de 380px ficaria espremido. Trocado para 2 colunas (`1fr auto`, mesmo layout que só existia como fallback mobile antes) — cada item quebra em 2 linhas (nome+categoria / loja+meta+ações via auto-wrap do grid) em qualquer largura, e a regra mobile antiga (que já era essa mesma coisa) foi removida por redundante. **Limpeza:** `page-title`/`page-subtitle` seguem fora do grid (span completo, acima das 2 colunas), sem duplicar heading. `npm run build` — 111 módulos, sem erros nas duas páginas. **CORREÇÃO/AJUSTES 25/08/2026 (pedido do usuário, mesmo dia):** (1) `page-wrap` alargado de novo, agora igual ao Admin (`min(1800px,100%)` nas duas páginas, em vez dos 1200px/1500px iniciais) para "usar todo o espaço da tela, semelhante à tela de admin"; (2) em `NovoProduto.jsx`, "Criar Nova Categoria" saiu do bloco esquerdo e passou para a sidebar direita, acima de "Fila de Envio"; (3) em `Usuarios.jsx`, "Criar Usuário" saiu da sidebar e passou para o topo do bloco esquerdo, acima de "Usuários Cadastrados"; (4) a sidebar de `Usuarios.jsx` (agora só com "Alterar Senha de Usuário") alargada de 380px para 460px, para os 2 campos de senha lado a lado (`fields-grid cols-2`) respirarem melhor. **Validado ao vivo no navegador** (sessão real do usuário, login feito por ele a pedido deste agente): `/novo-produto` — formulário à esquerda ocupando a largura toda da tela, "Criar Nova Categoria" e "Fila de Envio" empilhados à direita, exatamente como pedido; `/usuarios` — "Criar Usuário" acima da tabela "Usuários Cadastrados" (8 colunas, Telegram/Banco/Ações incluídos) à esquerda sem nenhuma rolagem horizontal, "Alterar Senha de Usuário" isolada e mais larga à direita; confirmado também que o breadcrumb "Dashboard › X" (Sprint 52) segue ausente nas duas páginas. Console sem erros novos (só os 3 warnings pré-existentes de GoTrueClient/React Router, já catalogados em sprints anteriores). `npm run build` — 111 módulos, sem erros |

---

## Sprint 54 — Admin: página sem rolagem própria (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S54 · Replicar em `Admin.jsx` o mecanismo de rolagem do Dashboard (`index.jsx`, Sprint 21): a página em si não rola — só a tabela de detalhe (conteúdo) e a sidebar de métricas rolam por dentro de si mesmas (todo:264) | Em telas ≥1101px, header/título do Admin ficam sempre visíveis; rolar sobre a tabela "Detalhe por usuário e item" só move a tabela; rolar sobre a sidebar só move a sidebar; a página em volta não rola. Abaixo de 1101px volta a rolar normalmente (mobile) | ✅ Done | **Mecanismo copiado 1:1 do Dashboard:** um `useEffect` que usa `matchMedia("(min-width: 1101px)")` para travar `#app` (`height:100vh; overflow:hidden`) e `document.body` (`overflow:hidden`) só quando a tela é larga o bastante para o grid de 2 colunas — mesmo corte de 1100px já usado pelo `.admin-grid`; desfaz tudo no cleanup (troca de breakpoint ou saída da página), então as outras páginas não são afetadas. **CSS** (`@media (min-width:1101px)`, mesma técnica de `.dash-main`/`.dash-content`/`.price-table-wrap`/`.dash-sidebar`): `.admin-main` e `.admin-content` ganham `min-height:0; overflow:hidden`; `.admin-grid` ganha `flex:1; min-height:0; align-items:stretch` para de fato ocupar a altura disponível. Como o conteúdo do Admin tem só 1 card (Detalhe por usuário e item, diferente do Dashboard que tem `.price-section` como wrapper extra), a regra estica esse card direto: `.admin-content .form-card { flex:1; display:flex; flex-direction:column; min-height:0 }`; dentro dele, a tabela (`.admin-content .adm-scroll`, que já tinha `overflow-x:auto` para a rolagem horizontal) ganha `flex:1; min-height:0; overflow-y:auto` — busca/contagem/dica ficam fixos no topo/rodapé do card, só a tabela rola verticalmente. A sidebar (`.admin-sidebar`) ganha `min-height:0; overflow-y:auto; padding-right:.4rem`, rolando como bloco único (os 4 painéis empilhados), igual à sidebar do Dashboard. **Validado ao vivo no navegador** (sessão real do usuário): confirmado visualmente que ADMIN/subtítulo ficam fixos no topo; scroll sobre a tabela moveu só a tabela (de "AMD Ryzen..." até "MicroSD..."/"PlayStation...", cabeçalho da busca intacto); scroll sobre a sidebar moveu só a sidebar até o fim (Saúde da coleta + nota de rodapé), sem alterar a posição da tabela nem da página; nenhum scroll na página em si em nenhum momento. Console sem erros. `npm run build` — 111 módulos, sem erros |

---

## Sprint 55 — Novo Produto: título em 1 linha e card Criar Categoria simplificado (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S55 · (1) Título "NOVO PRODUTO" em `NovoProduto.jsx` numa linha só, sem quebra forçada; (2) card "Criar Nova Categoria": remover o hint "Fica disponível no campo Categoria acima assim que criada, já selecionada.", campo de texto ocupando a largura total do card, botão "CRIAR CATEGORIA" simples abaixo do campo (em vez de ao lado) (todo:266) | Título sem `<br>`, uma linha; card sem o texto de hint; input do nome da categoria vai até a borda do card; botão fica numa linha própria, abaixo do input | ✅ Done | **Título:** `<div className="page-title">NOVO<br />PRODUTO</div>` virou `<div className="page-title">NOVO PRODUTO</div>` — o `<br/>` era uma quebra manual (única página do projeto com título de 2 palavras forçado em 2 linhas; `Admin`/`Usuários`/`Conta` já eram título de 1 palavra); `clamp(2.5rem,7vw,4rem)` do `.page-title` já cabe em 1 linha com folga no `.page-wrap` de 1800px (Sprint 53). **Card Criar Categoria:** removida a `<div className="cat-new-row">` que colocava input+botão lado a lado (`display:flex`) — agora o `<input className="field-input">` fica sozinho no `.field-group` (100% da largura do card, mesmo padrão dos demais campos do formulário) e o botão `CRIAR CATEGORIA` foi trocado de `btn-primary` (verde, remetia a ação principal da página) para `btn-secondary` (mesmo estilo neutro usado em "LIMPAR"/"CANCELAR EDIÇÃO"), numa linha própria abaixo do input, largura 100% — "algo simples", como pedido, em vez de competir visualmente com os outros CTAs primários da página. Removido também o hint `<div className="field-hint">Fica disponível...</div>`. CSS morto `.cat-new-row`/`.cat-new-row .field-input` removido (sem mais consumidor). `npm run build` — 111 módulos, sem erros. **Validado ao vivo no navegador** (sessão real do usuário, mesma sessão persistida das Sprints anteriores): "NOVO PRODUTO" renderiza numa linha só; card "Criar Nova Categoria" mostra o input ocupando a largura inteira do card, botão "CRIAR CATEGORIA" numa linha abaixo em estilo neutro, sem o texto de hint. Console sem erros |

---

## Sprint 56 — Admin: nomes de tabela sem quebra; botão Criar Categoria verde (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S56 · (1) No card "Tamanho por tabela" (Admin), ajustar nome e/ou tamanho da coluna para o texto não quebrar linha e desalinhar a barra/tamanho; (2) botão "CRIAR CATEGORIA" (Novo Produto, sidebar) trocar de branco/neutro (padrão da Sprint 55) para verde como cor default (todo:268) | As 6 linhas do card "Tamanho por tabela" mostram o nome numa linha só, alinhadas com a barra e o tamanho ao lado; o botão "CRIAR CATEGORIA" aparece verde sem precisar de hover | ✅ Done | **Causa raiz do texto quebrando:** `.disco-row .dr-nome` tem `width:150px` na base, mas `.admin-sidebar .disco-row .dr-nome { width:84px }` (Sprint 46) reduz para caber nos 360px da sidebar — nesse espaço, "Histórico de preços" (20 caracteres) e "Produtos (categorias)" (22) quebravam em 2-3 linhas (sem `white-space:nowrap` nem truncamento), esticando a altura da linha e desalinhando a barra/tamanho ao lado, exatamente o "quebrando o aspecto" relatado. **Corrigido em duas frentes:** (1) `NOME_TABELA` com rótulos mais curtos — `historico_precos` "Histórico de preços"→"Histórico", `produtos` "Produtos (categorias)"→"Categorias" (as outras 4 já eram curtas: Itens/Alertas/Usuários/Lojas); (2) `.disco-row .dr-nome` ganhou `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` como proteção estrutural (qualquer nome de tabela futuro, por mais longo que seja, trunca com reticências em vez de quebrar/esticar a linha); a coluna na sidebar também foi alargada de 84px para 96px, folga extra para os nomes curtos novos não rasparem a borda. **Botão Criar Categoria:** a Sprint 55 tinha trocado a classe de `btn-primary` (verde) para `btn-secondary` (neutro/`--text-dim`, visualmente "branco") como parte de simplificar o layout (campo full-width + botão abaixo) — revertido só a cor, mantendo o layout: `className` voltou para `btn-primary`, então o botão é verde por padrão (border+texto `var(--green)`), preservando a posição abaixo do campo e a largura 100% da Sprint 55. `npm run build` — 111 módulos, sem erros. **Validado ao vivo no navegador:** card "Tamanho por tabela" com as 6 linhas (Histórico/Itens/Alertas/Usuários/Categorias/Lojas) cada uma numa única linha, barra e tamanho (ex. "976 kB") alinhados; botão "CRIAR CATEGORIA" confirmado verde (borda e texto) por padrão, sem precisar de hover. Console sem erros |

---

## Sprint 57 — Admin: card "Visão Geral" quebrando texto (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S57 · Validar os 4 cards da sidebar do Admin (Visão Geral/Espaço em Disco/Tamanho por Tabela/Saúde da Coleta) — usuário reportou texto mal configurado, especificamente na visualização de "Visão Geral" (todo:270) | Nenhum label dos 4 cards quebra no meio da palavra nem fica torto; "Visão Geral" em especial exibe os 4 indicadores de forma legível na largura da sidebar | ✅ Done | **Auditoria dos 4 cards (medição real via DOM, não só visual):** Espaço em Disco, Tamanho por Tabela (já corrigido na Sprint 56) e Saúde da Coleta OK — só "Visão Geral" tinha o problema. **Causa raiz medida:** `.admin-sidebar .stat-grid { grid-template-columns:1fr 1fr }` (Sprint 46) força 2 colunas mesmo a sidebar tendo só ~290px úteis (360px − padding do card) — cada célula ficava com ~135px, e o label "Leituras de preço" precisa de 153px numa linha só (medido via clone off-screen) — sobrava menos que o necessário, então quebrava no meio ("LEITURAS DE" / "PREÇO", "ITENS" / "MONITORADOS"), com o `letter-spacing:.2em` do `.stat-label` piorando ainda mais o aperto. **Corrigido removendo a força de 2 colunas** (`.admin-sidebar .stat-grid { grid-template-columns:1fr 1fr }` deletado) — o `.stat-grid` base já usa `grid-template-columns:repeat(auto-fit,minmax(160px,1fr))`, uma regra pensada justamente para isso: com ~290px disponíveis e mínimo de 160px por coluna, 2 colunas não cabem (2×160=320>290) e o auto-fit já colapsa sozinho para 1 coluna, sem precisar de override nenhum — os 4 indicadores empilham verticalmente, cada um com a largura toda da sidebar. **Validado ao vivo com medição JS direta no navegador** (sessão real): antes da correção, `getBoundingClientRect().height` dos labels "Itens monitorados" e "Leituras de preço" media 36px (2 linhas) contra 18px de "Alertas hoje"/"Usuários" (1 linha); depois da correção, os 4 labels medem exatamente 18px — nenhum quebra mais. Visualmente confirmado por zoom de screenshot: "ITENS MONITORADOS", "LEITURAS DE PREÇO", "ALERTAS HOJE" e "USUÁRIOS" cada um numa linha só, empilhados com o valor e o subtexto de cada indicador. `npm run build` — 111 módulos, sem erros. Console sem erros |

---

## Sprint 58 — Admin: título "Tamanho por Tabela" e rótulo "Visão Geral" cortado (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S58 · (1) Simplificar o título do card "Tamanho por Tabela (Protocol Fps)" para algo mais simples, sem chegar ao fim do card — "Tamanho por Tabela"; (2) corrigir o rótulo "Visão Geral" (borda superior do card), que está sendo cortado ao meio (todo:272) | O título do card de tamanho por tabela cabe com folga, sem tocar as bordas; o rótulo "VISÃO GERAL" aparece inteiro e legível sobre a borda superior do card, sem a linha cortando o texto | ✅ Done | **(1) Título simplificado:** `data-label="TAMANHO POR TABELA (PROTOCOL FPS)"` → `data-label="TAMANHO POR TABELA"` em `Admin.jsx` — o `(PROTOCOL FPS)` era redundante (a página inteira já é do Protocol FPS) e, com `letter-spacing:.3em` do `.form-card::before`, empurrava o texto quase até a borda direita do card de 360px. **(2) Causa raiz do corte em "Visão Geral" (achada por inspeção visual com zoom + análise do CSS, não só chute):** o rótulo de cada card usa `.form-card::before { content:attr(data-label); position:absolute; top:-1px; transform:translateY(-50%); ... }` — um técnica de "entalhe na borda" onde metade do texto fica ACIMA do topo do card, sobre a própria linha da borda. Para os cards do meio/fim da sidebar (Espaço em Disco, Tamanho por Tabela, Saúde da Coleta) essa metade "flutua" livre no `gap:1.25rem` que já existe entre os cards anteriores. O PRIMEIRO card ("Visão Geral") não tem gap acima — e a Sprint 54 (mesmo dia) deu à `.admin-sidebar` um `overflow-y:auto` sem nenhum `padding-top`, então a metade de cima do rótulo passou a ficar exatamente na borda do container com rolagem, sendo cortada por ela; sobrou só a metade de baixo do texto, visualmente parecendo "cortado ao meio" pela linha da borda. Os outros 3 cards nunca teve esse problema porque não são o primeiro filho. **Corrigido:** `padding-top:.9rem` adicionado a `.admin-sidebar` dentro do mesmo `@media (min-width:1101px)` da Sprint 54 — dá ao primeiro card o mesmo "respiro" que os demais já tinham de graça via o gap entre irmãos, sem alterar layout, posição sticky ou o mecanismo de rolagem interna. `npm run build` — 111 módulos, sem erros. **Validado ao vivo no navegador com zoom em screenshot:** "VISÃO GERAL" renderiza inteiro e legível sobre a borda, sem corte; "TAMANHO POR TABELA" cabe com folga, sem tocar as bordas do card, os 6 nomes de tabela (Sprint 56) continuam numa linha só cada. Console sem erros |

---

## Sprint 59 — Admin: alinhar sidebar com a tabela de detalhe (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S59 · Alinhar o topo do primeiro card da sidebar ("Visão Geral") com o topo da tabela "Detalhe por usuário e item" à esquerda, ambos no mesmo nível (todo:274) | As bordas superiores dos 2 cards (tabela à esquerda, "Visão Geral" à direita) ficam exatamente na mesma altura, sem nenhuma coluna começando mais alta/baixa que a outra | ✅ Done | **Causa raiz medida com precisão (`getBoundingClientRect()` via JS no console do navegador, não só olho):** o fix da Sprint 58 (mesmo dia) adicionou `padding-top:.9rem` só a `.admin-sidebar`, para dar espaço ao rótulo "Visão Geral" que estava sendo cortado pelo `overflow-y:auto`. Isso empurrou o card "Visão Geral" 13.5px mais para baixo que a tabela de detalhe (medido: `sidebarTop − contentTop = 13.5px`), já que `.admin-content` (a coluna da tabela) não tinha o mesmo padding. **Corrigido:** o mesmo `padding-top:.9rem` foi replicado em `.admin-content` — a coluna da tabela não precisava da folga por si só (seu card nunca foi cortado), mas ganhar o mesmo respiro no topo faz as duas colunas começarem exatamente na mesma altura, já que ambas agora "perdem" a mesma distância do topo do `.admin-grid`. Comentário do CSS atualizado explicando as duas razões do padding-top (evitar corte + manter alinhamento) para não parecer redundante numa leitura futura. `npm run build` — 111 módulos, sem erros. **Validado ao vivo no navegador com medição exata:** antes do fix, `sidebarTop − contentTop = 13.5px`; depois, **`diff = 0px`** — as duas bordas superiores nas mesmas coordenadas de tela; confirmado também visualmente por screenshot (bordas "DETALHE POR USUÁRIO E ITEM" e "VISÃO GERAL" na mesma linha) e que o rótulo "VISÃO GERAL" continua sem corte (fix da Sprint 58 preservado). Console sem erros |

---

## Sprint 60 — Título da página no cabeçalho (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S60 · Em vez de "Novo Produto"/"Usuários"/"Admin" como título grande no corpo de cada página, mover para o cabeçalho (`AppHeader`), ao lado do menu hambúrguer; a página `/` (Dashboard) mostra "Dashboard" (todo:276) | O cabeçalho mostra o nome da página atual ao lado do ícone de menu, em todas as rotas (incl. `/` → "Dashboard"); o `page-title` grande não aparece mais duplicado no corpo | ✅ Done | **Implementado:** `AppHeader.jsx` ganhou `useLocation()` (`react-router-dom`) + um dict local `PAGE_LABELS` (mesmos 5 nomes já usados no `NavDrawer` — Dashboard/Novo Produto/Usuários/Admin/Conta) resolvendo o rótulo pelo `pathname`; como `App.jsx` já redireciona toda rota legada para uma dessas 5 antes de renderizar o header, não precisou de fallback. **Layout:** o nome entrou num novo `<div className="header-left">` junto do botão hambúrguer (mesmo grupo flex, pra não brigar com o `justify-content:space-between` do header de 3 blocos — esquerda/logo central "PROTOCOL FPS"/meta à direita); novo `.header-page-name` (`--text-dim`, letter-spacing .15em, uppercase) escondido abaixo de 480px (`.header-left` some com prioridade pro logo central no celular estreito). `npm run build` — 111 módulos, sem erros. **Validado ao vivo no navegador nas 5 rotas:** "DASHBOARD" em `/`, "NOVO PRODUTO" em `/novo-produto`, "USUÁRIOS" em `/usuarios`, "ADMIN" em `/admin`, "CONTA" em `/conta` — todos ao lado do menu hambúrguer, atualizando ao navegar entre páginas. Console sem erros. **CORREÇÃO 25/08/2026 (mesmo dia, pedido do usuário):** `.header-page-name` tinha saído em `--text-dim` (cinza apagado, mesmo tom neutro do relógio no cabeçalho) — trocado para `var(--green)`, a mesma cor que o `page-title` grande tinha no corpo antes de migrar pro cabeçalho, mantendo o nome da página no verde do tema em vez de neutro. Validado ao vivo em `/` e `/admin` (DASHBOARD/ADMIN em verde, mesmo tom do ícone do menu hambúrguer); `npm run build` — 111 módulos, sem erros; console sem erros |

---

## Sprint 61 — Remover textos de resumo do corpo (25/08/2026)

Consequência direta da Sprint 60 — implementada em sequência, mesmo dia.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S61 · Remover os textos de resumo/subtítulo do corpo das páginas (ex.: "Métricas operacionais do banco — acesso liberado individualmente pelo dono da conta" no Admin, e os subtítulos equivalentes de Novo Produto/Usuários) (todo:278) | Nenhuma página mostra mais o parágrafo de resumo abaixo do título; o `page-title`/`page-subtitle` (ou o que sobrar deles) não deixam vazio nem quebram o espaçamento do restante do layout | ✅ Done | **Removido** o bloco `<div><div className="page-title">X</div><div className="page-subtitle">...</div></div>` de `NovoProduto.jsx`, `Usuarios.jsx` e `Admin.jsx` (título + subtítulo juntos), e o `<div className="page-title-sm">CONTA</div>` isolado de `Conta.jsx` (essa página nunca teve subtítulo) — as 4 páginas incluídas por consistência, já que a Sprint 60 pôs o nome das 5 no cabeçalho (Dashboard nunca teve título/subtítulo duplicado no corpo, nada a remover lá). Nenhum texto continha informação não-decorativa que precisasse de outro lugar — todos eram só o nome da página repetido ou uma frase de contexto já óbvia pela própria página (ex. "Adicione URLs para monitorar" no formulário de Novo Produto). CSS morto `.page-title`/`.page-subtitle`/`.page-title-sm` removido das 4 páginas (cada uma tinha sua própria cópia local, nenhuma outra regra dependia delas). `.page-wrap`/`.page-wrap-sm` (flex column) seguem funcionando normalmente com 1 filho a menos. `npm run build` — 111 módulos, sem erros. **Validado ao vivo:** as 4 páginas renderizam direto no primeiro card/formulário, sem título grande nem parágrafo de resumo acima; nenhum espaçamento quebrado. Console sem erros |

---

## Sprint 62 — Admin: cabeçalho da tabela fixo na rolagem (25/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S62 · Na tabela "Detalhe por usuário e item" do Admin, deixar o cabeçalho (`<thead>`) fixo (sticky) durante a rolagem vertical interna da tabela (`.adm-scroll`, Sprint 54) (todo:280) | Rolar a tabela do Admin mantém a linha de cabeçalho (Usuário/Item/Loja/Categoria/Leituras/Status) sempre visível no topo, como já acontece na tabela do Dashboard (`thead { position:sticky; top:0 }`) | ✅ Done | **Implementado:** `.admin-content .adm-table thead { position:sticky; top:0; z-index:2; background:var(--bg2) }` — mesmo padrão do `thead` do `ProductTable` do Dashboard, mas escopado só a `.admin-content` (a tabela "Detalhe por usuário e item") e colocado dentro do mesmo `@media (min-width:1101px)` da Sprint 54, já que só nesse breakpoint a tabela rola por dentro de si mesma (abaixo disso a página inteira rola normalmente e um `thead` sticky não faria sentido). A tabela "Saúde da Coleta" da sidebar foi deixada de fora de propósito — ela rola como bloco único junto dos outros painéis da sidebar (Sprint 54), não tem uma rolagem própria que precise de cabeçalho fixo. `npm run build` — 111 módulos, sem erros. **Validado ao vivo no navegador:** rolar a tabela de detalhe (de "AMD Ryzen..." até "MicroSD..."/"PlayStation...") manteve a linha "USUÁRIO / ITEM / LOJA / CATEGORIA / LEITURAS / STATUS" sempre visível no topo do card, sem sobrepor a busca/filtro acima nem re-scrollar junto das linhas. Console sem erros |

---

## Resumo por status

| Status | Qtde | Linhas do `todo` |
|--------|------|-------------------|
| ✅ Done | 26 | 204, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 256, 258, 260, 262, 264, 266, 268, 270, 272, 274, 276, 278, 280 |
| ⬜ Todo | 3 | 249, 251, 254 |
| 🟡 Pending | 0 | — |

## Skills Futuras

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|------------------|----------|------------|
| `scraper-nova-loja` | já existe (criada na V4) | Reaproveitada nas Sprints 35 (inspeção do `.in_cash-price-box` antes de trocar o seletor) e 40 (metodologia completa — inspeção real, JSON-LD, teste headless/non-headless, 3× confirmando o bloqueio) | Já feita |
| `backend-conventions` | já existe | Referência usada nas Sprints 35 e 40 (contrato `ScraperBase`, `_limpar_preco`) | Já feita |
| `frontend-design-system` | já existe | Referência para as Sprints 36 (novo card de KPI), 37 (ajuste de tabela) e 39 (responsividade — tokens/breakpoints do tema) | Já feita |
| `responsividade-dispositivos` | sugerida na Sprint 39 | Checklist replicável de viewports-alvo (os aparelhos reais do usuário, não breakpoints genéricos) para validar qualquer tela nova do projeto, evitando descobrir problemas de responsividade só depois de construída | Média (a V5 já tem 2 itens de UI densa — 37 e 39 — que se beneficiariam de um checklist fixo) |
| `admin-metricas-avancadas` | sugerida na Sprint 38 | Documentar o padrão de extensão da RPC `admin_estatisticas()` (SECURITY DEFINER, gate por `pode_ver_banco()`) para agregações por usuário/item, caso surjam novos pedidos de detalhamento no painel `/admin` | Baixa (1 pedido até agora) |
| `scraper-nova-loja` | reaproveitada nas Sprints 47/48/49 (planejadas) | Metodologia já existente, aplicável direto às 3 lojas novas (AliExpress, Mocadopop, Mercado Livre) — inclui o critério de quando aceitar "só funciona local" (padrão Pichau/Shopee) em vez de insistir sem sessão persistida | Já feita |
| `categoria-dinamica` | sugerida na Sprint 45 | Documentar o contrato único para "lista de categorias" (hoje fragmentado entre o dict estático `CAT_LABEL` do Dashboard e a busca dinâmica de `NovoProduto.jsx`), para que a próxima categoria criada por um admin não precise de uma sprint de correção como a 45 | Média (2º ponto de atrito com categoria dinâmica desde a Sprint 31) |
| `tabela-ordenavel-padrao` | sugerida na Sprint 50 | Documentar o padrão de cabeçalho clicável + seta ▲/▼, hoje implementado 2× de forma independente (`thOrdenavel` no Admin, Sprint 43; `ThOrdenavel` no Dashboard, Sprint 50 — mesmas classes CSS `.sortable`/`.sort-arrow`, mas dois componentes/arquivos diferentes) como um componente/convenção única, em vez de reimplementar a mesma lógica a cada tabela nova | Média (2ª implementação do mesmo padrão — bom momento para unificar antes de uma 3ª) |
