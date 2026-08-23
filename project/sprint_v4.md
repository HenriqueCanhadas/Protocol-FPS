# PROTOCOL FPS — Planejamento de Sprints — V4

> Relatório gerado a partir da seção **V4** do arquivo `todo` (raiz do repositório).
> Data de geração: **23/08/2026** (atualizado após a Sprint 29 ser validada em CI —
> **3/3 runs reais no GitHub Actions, as 5 lojas com sucesso**, fechando o item).
>
> A V4 é uma sequência de ajustes de UX pontuais sobre a Dashboard reconstruída na V3
> (`project/sprint_v3.md`). As **Sprints 23, 24, 25, 26, 27, 28, 31, 32, 32b, 32c, 33
> e 29** foram implementadas em 19–20/08/2026 e 23/08/2026 (numeração não contígua —
> 30 continua proposta, ver abaixo). A Sprint 29 (5 scrapers + `lojas` + frontend)
> é a **primeira tarefa de back-end/scraper de toda a V3+V4** — todas as outras
> sprints executadas dessas duas versões mexeram só no frontend da Dashboard (as
> Sprints 32/32b/32c mexeram em schema/RPC/API, mas não em scraper).
>
> ✅ **`todo:214` fechado — Sprint 29 validada em CI de verdade** (não só local): o
> usuário pediu para commitar e enviar (push) o trabalho da sessão, e depois validar
> no CI de verdade. Commitado (`05d6cd7`) e enviado para `Duplicate-Main`, depois
> disparados **3 runs reais** de `workflow_dispatch` (mesma barra "3/3" usada para
> Kabum/Terabyte na Sprint 1, skill `scraper-nova-loja`) — **as 5 lojas coletaram
> com sucesso nos 3 runs, com o preço idêntico em todos** (inclusive a Amazon, sem
> nenhum bloqueio de bot a partir do IP de datacenter do runner). Detalhes completos
> na Sprint 29 abaixo, incluindo o primeiro disparo (antes do push) que confirmou o
> problema de rodar contra código desatualizado no GitHub.
>
> ✅ **Migração da Sprint 31 rodada pelo usuário e confirmada em produção local**:
> `project/migrations/sprint31_categorias_insert.sql` já está aplicada — a criação
> de categorias funciona de fato (não é mais uma pendência).
>
> ✅ **Migrações das Sprints 32, 32b e 32c rodadas pelo usuário e confirmadas ao
> vivo**: `sprint32_admin_estatisticas.sql`, `sprint32b_ver_banco.sql` e
> `sprint32c_admin_disco.sql` já estão aplicadas — `/admin` mostra dados reais, o
> acesso é individual por `usuarios.ver_banco` (não mais por `nivel`), e o medidor
> de cota de disco + barras por tabela funcionam ponta a ponta.
>
> ✅ **`todo:220` resolvido com o usuário no início da Sprint 33** (não presumido):
> a criação de categoria (Sprint 31, link "+ Nova categoria" dentro do campo
> Categoria) virou uma seção própria e sempre visível — "campo a parte" era mesmo
> um pedido de layout novo, não uma repetição da Sprint 31.
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
> - **RESULTS** — resultado alcançado (Done/Pending) ou esperado (Todo)
>
> 🚫 **Regra de trabalho:** nenhum commit é feito automaticamente — commits **somente
> quando o usuário mandar**.

---

## Visão geral do cronograma

| Sprint | Tema | Período | Dias | Itens |
|--------|------|---------|------|-------|
| 23 | ControlBar absorve a ActionBar + KPIs migram para a sidebar | 19/08/2026 | 1 | 4 |
| 24 | ControlBar: busca em pop-up, botão "Coletar" único, remoção do rótulo "Ações" | 20/08/2026 | 1 | 3 |
| 25 | ProductTable: deselecionar ao reclicar, tooltip no preço, linhas mais compactas | 20/08/2026 | 1 | 3 |
| 26 | Barra de rolagem temática | 20/08/2026 | 1 | 1 |
| 27 | Link do produto no hover do nome + editar item na fila de Novo Produto | 20/08/2026 | 1 | 2 |
| 28 | Temporizador de sessão (contagem regressiva em amarelo no cabeçalho) | 20/08/2026 | 1 | 1 |
| 29 | Novas lojas: Tuyo, Playstation, Logitec, Tangle Teezer, Amazon — 5 scrapers + `lojas` + frontend, **validados local + 3/3 runs de CI** | 23/08/2026 | 5 | 1 (5 lojas) |
| 30 *(proposta, ainda não iniciada)* | Disponibilidade real: esgotado × não localizado | a definir | 2 | 1 |
| 31 | Criar novas categorias pela tela Novo Produto (admin) | 20/08/2026 | 1 | 1 |
| 32 | Painel admin de banco/monitoramento (tamanho do banco, contagens, saúde da coleta) | 23/08/2026 | 1 | 1 |
| 32b | Restringe `/admin` a uma permissão própria (`ver_banco`), liberada só pelo dono da conta | 23/08/2026 | 1 | 1 (fora do `todo` — pedido direto do usuário) |
| 32c | Medidor de cota de disco (usado/disponível vs. plano) + barras proporcionais por tabela | 23/08/2026 | 1 | 1 (fora do `todo` — pedido direto do usuário) |
| 33 | Campo dedicado de criação de categoria em Novo Produto (revisão da Sprint 31) | 23/08/2026 | 1 | 1 |

**Sprints 23–28, 29, 31, 32, 32b, 32c e 33 concluídas** (19–20/08/2026 e 23/08/2026 —
numeração não contígua, 30 segue proposta). A Sprint 29 está **implementada e
validada — local e 3/3 runs de CI reais** (ver nota no topo e detalhe completo na
própria sprint). Restam **2 itens `⬜ Todo`** na V4 (1 na Sprint 30 proposta + 1 já
absorvido pela V3, ver "Resumo por status"). A numeração de sprints continua de
onde a Sprint 33 parou.

---

## Sprint 23 — ControlBar absorve a ActionBar + KPIs migram para a sidebar (19/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S23 · Remover o botão Histórico da ActionBar e mover Opções/Remover para o painel de filtros (todo:182) | A tabela não tem mais nenhum botão de Histórico visível; clicar em "EXPANDIR" no `PriceChartPanel` da sidebar continua abrindo o `ProductHistoryDialog` completo do item selecionado | ✅ Done | **Implementado:** `components/ActionBar.jsx` removido; Opções/Remover viraram parte do painel único de filtros (`ControlBar`), recebendo `selected`/`onOpcoes`/`onRemover` de `index.jsx` — mesma seleção global de `useProductSelection`. O atalho de teclado Enter→Histórico do `useProductSelection` foi mantido (não é o botão removido, e o `PriceChartPanel`/`ItemDetailPanel` já cobrem a função visualmente) |
| S23 · Trocar a contagem "N produto(s)" pelos botões Opções/Remover, habilitados com entorno verde/vermelho ao selecionar um item (todo:184) | Sem seleção, os botões ficam opacos/desabilitados; com um item selecionado, "Opções" mostra o mesmo entorno verde de sempre (`.opcoes-trigger`) e "Remover" passa a ter um entorno vermelho permanente (antes só aparecia no hover) | ✅ Done | **Implementado:** o `.result-count` saiu do `.filters-row`; no lugar, um grupo `.filter-actions-group` (`margin-left:auto`) com os dois botões — `.action-btn.remove:not(:disabled)` ganhou `color:var(--red)` + `border-color:rgba(255,68,68,.4)` fixos (novo), em vez de só no `:hover` |
| S23 · Botão "Coletar Agora"/"Coletar Filtrados" dentro do card de filtros (todo:186) | O botão de coleta aparece dentro do mesmo retângulo `.filters-row` dos demais filtros, não numa linha separada acima | ✅ Done | **Implementado:** o botão saiu do antigo `.toolbar-row` isolado e entrou como primeiro item de `.filters-row`, com um `.filter-sep` antes dos filtros; texto dinâmico COLETAR AGORA/COLETAR FILTRADOS e `escopoColeta()`/`onColetarClick` inalterados |
| S23 · Mover Itens monitorados/Abaixo da meta/Menor preço hoje/Última coleta para a sidebar, no estilo dos demais cards (todo:188) | Os 4 KPIs aparecem só na coluna direita, dentro de um painel com o mesmo visual (`background:var(--bg2)`, borda, padding) do `PriceChartPanel`/`CollectionsPanel`/`ItemDetailPanel`; nenhuma faixa full-width acima da tabela | ✅ Done | **Implementado:** `KpiRibbon` virou `.kpi-panel` (grid 2×2, `.kpi-cell`) renderizado dentro de `Sidebar.jsx` (topo da coluna, antes do `PriceChartPanel`); fórmulas dos 4 KPIs inalteradas. CSS morto removido (`.stats-bar`/`.stat-card` da faixa antiga, `.action-bar*` e as variantes `.hist`/`.toggle-on`/`.toggle-off`/`.meta` de `.action-btn`, que só existiam para a ActionBar removida) |

**Validação registrada:** `npm run build` (Vite) — 107 módulos, sem erros. Revisão de
código completa dos arquivos alterados (`ControlBar.jsx`, `KpiRibbon.jsx`,
`Sidebar.jsx`, `index.jsx`) e remoção do `ActionBar.jsx`; `grep` confirmou zero
referências vivas ao componente removido fora de comentários históricos. **Não
verificada ao vivo no navegador** nesta sprint (extensão Claude in Chrome não
conectada na sessão) — pendente de confirmação visual pelo usuário.

---

## Sprint 24 — ControlBar: busca em pop-up, botão "Coletar" único, sem o rótulo "Ações" (20/08/2026)

Três ajustes na mesma área (`ControlBar`), encadeados porque tocam o mesmo trecho de
JSX/CSS do painel de filtros.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S24 · Ícone de busca abre um pop-up (campo de busca + opções) em vez do input inline atual, no mesmo estilo do modal de Opções (todo:190) | Clicar no ícone ⌕ abre um overlay/modal (reaproveitando `TerminalModal`, mesma família visual do `ProductActionsDialog`) com o campo de texto e as opções de busca; a linha de filtros não expande mais um `.search-inline-input` embutido; Esc ou clique fora fecha o pop-up sem perder o termo já digitado | ✅ Done | **Implementado:** novo `dialogs/SearchDialog.jsx` sobre `TerminalModal` (`.meta-modal-overlay`/`.meta-modal`, o mesmo estilo dos modos "Editar meta"/"Alterar nome" do `ProductActionsDialog`), com campo de texto + botões LIMPAR/BUSCAR; consome `termoBusca`/`setTermoBusca` de `useDashboardFilters` sem alterar a lógica de filtragem. O ícone ⌕ na `ControlBar` agora só abre o pop-up; o `.search-inline-input` (CSS do campo antigo) foi removido |
| S24 · Unificar os rótulos "Coletar Agora"/"Coletar Filtrados" em um único "Coletar", mantendo a descrição do escopo só na confirmação (todo:192) | O botão de coleta sempre exibe o texto "COLETAR", com ou sem filtro ativo; ao clicar, o modal de confirmação continua descrevendo exatamente o escopo (ex.: "os itens da lista filtrada (categoria GPU + loja Terabyte)" ou "todos os produtos monitorados"), sem mudança de comportamento em `escopoColeta()`/`iniciarColeta()` | ✅ Done | **Implementado:** o rótulo em `ControlBar.jsx` deixou de alternar por `escopado`/`segmentada` — mostra só "COLETAR" (ou "DISPARANDO..." durante o disparo); `onColetarClick()`/`escopoColeta()` e o corpo do `ConfirmModal` (título "COLETAR AGORA" + descrição do escopo) inalterados. `escopado` removido de `useDashboardFilters` (ficou sem consumidor) |
| S24 · Remover o texto "Ações \<nome do produto\>" da linha de filtros quando um item está selecionado (todo:194) | Ao selecionar uma linha da tabela, a `ControlBar` não mostra mais nenhum rótulo com o nome do produto — essa informação já aparece no `ItemDetailPanel` (▤ Detalhe do item) e no destaque visual da própria linha selecionada | ✅ Done | **Implementado:** removido o `<span className="filter-actions-item">{selected.nome_na_loja}</span>` de `ControlBar.jsx`; os botões Opções/Remover continuam habilitados/desabilitados pela mesma prop `selected` (só sem o texto ao lado). CSS morto `.filter-actions-item` removido |

**Validação registrada:** `npm run build` (Vite) — 108 módulos (era 107; +1 pelo novo
`SearchDialog.jsx`), sem erros. `grep` em todo `src/` confirmou zero referências
sobrando a `escopado`, `.search-inline-input` e `.filter-actions-item`. **Não
verificada ao vivo no navegador** (extensão Claude in Chrome não conectada nesta
sessão, mesma limitação da Sprint 23) — o usuário deve conferir visualmente em
`npm run dev` (`http://localhost:3000`), em especial: abrir/fechar o pop-up de busca
com o ícone ⌕ e com Esc/clique fora, o texto fixo "COLETAR" com e sem filtro ativo, e
a ausência do nome do produto ao lado de Opções/Remover.

---

## Sprint 25 — ProductTable: deselecionar ao reclicar, tooltip no preço, linhas mais compactas (20/08/2026)

Três ajustes na tabela (`ProductTable.jsx` + CSS de `.price-*`/linha), agrupados porque
todos mexem na mesma área visual e no mesmo fluxo de seleção. Restrição explícita do
usuário para esta sprint: nenhuma mudança pode introduzir uma barra de rolagem
horizontal no card de filtros (`.filters-row`).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S25 · Clicar numa linha já selecionada deve deselecioná-la (todo:196) | Selecionar uma linha e clicar nela de novo limpa a seleção (`selectedId` volta a `null`); a sidebar (`PriceChartPanel`/`ItemDetailPanel`) volta ao estado vazio/placeholder e os botões Opções/Remover da `ControlBar` voltam a ficar desabilitados | ✅ Done | **Implementado:** `useProductSelection.select(id)` agora alterna (`atual === id ? null : id`); navegação por teclado (↑/↓/Enter/Esc) inalterada |
| S25 · Coluna "Preço Atual" mostra só o preço; meta/menor preço/data de coleta aparecem num tooltip ao passar o mouse (todo:198) | A célula de preço exibe apenas o valor formatado (`formatBRL`); ao dar hover, um tooltip mostra meta (`preco_meta`), menor preço histórico (`menor`/`menor_em`) e a data/hora da última coleta (`coletado_em`) — a mesma informação que antes ficava sempre visível abaixo do preço | ✅ Done | **Implementado:** novo `.price-hover`/`.price-tooltip` (mesma linguagem visual do `.hg-tooltip` do `GraficoHistorico` — fundo `bg2`, borda `green-dim`, sombra); `.price-meta`/`.price-menor`/`.price-timestamp` (sempre visíveis) removidos da célula e do CSS. **Bug encontrado e corrigido no caminho:** `TerminalModal` sempre focava o primeiro elemento focável do modal (o botão ✕ do cabeçalho) ao abrir, roubando o foco de qualquer input com `autoFocus` — não é específico desta tarefa, mas foi descoberto testando o `SearchDialog` da Sprint 24 (digitar direto após abrir o pop-up não filtrava nada) e também afetava o modal "Alterar nome" (bug pré-existente, anterior a esta sprint). Corrigido: só foca o primeiro elemento se nada dentro do modal já estiver focado. **Correção adicional 20/08 (reportada pelo usuário depois de fechar a sprint):** rolar a tabela até o fim deixava um vão vazio após o último item. Causa raiz medida diretamente no navegador: `.price-tooltip`, mesmo com `opacity:0`/`visibility:hidden`, continuava contribuindo para o `scrollHeight` da tabela (o tooltip da última linha "esticava" o fim da rolagem em ~66px); `max-height:0` por si só não bastava porque padding+borda do tooltip ainda ocupavam ~17px de altura mesmo com o conteúdo zerado. Corrigido zerando também `padding`/`border` no estado padrão (só aplicados no `:hover`/`:focus-visible`, junto com `max-height:none`). Confirmado via medição (`table.scrollHeight` === `table.offsetHeight` depois da correção; vão residual de ~1px, só a borda de 1px do próprio `.price-table-wrap`) |
| S25 · Reduzir a altura das linhas da tabela para exibir mais itens por tela (todo:200) | As linhas de `tbody tr`/`td` ficam visivelmente mais baixas (padding vertical reduzido) sem cortar texto nem quebrar o alinhamento de badges/status; mais linhas cabem na área rolável `.price-table-wrap` sem rolagem adicional, mantendo legibilidade | ✅ Done | **Implementado:** `td { padding: .55rem 1.1rem }` (era `.9rem`); combinado com a remoção de meta/menor/timestamp da tarefa anterior, a linha ficou visivelmente mais compacta sem precisar de mais ajuste |

**Validação ao vivo no navegador (Playwright, extensão Claude in Chrome conectada
nesta sessão):** `npm run build` — 108 módulos, sem erros. Testado logado na sessão
real do usuário: clique seleciona/reclique deseleciona (sidebar e botões Opções/Remover
refletem os dois estados); hover no preço mostra o tooltip com meta/★ menor/coleta;
linhas visivelmente mais baixas; pop-up de busca (Sprint 24) filtra corretamente depois
do fix do bug de foco, ícone fica "ativo", `LIMPAR` restaura a lista completa; botão
sempre "COLETAR", confirmação descrevendo o escopo certo tanto com filtro (loja
KaBuM + produto) quanto sem filtro (todos os 33 monitorados); modo "Alterar nome" do
`ProductActionsDialog` também recebendo foco corretamente após o fix (cancelado sem
salvar, nada foi alterado no banco). **Restrição do usuário confirmada:** com todos os
grupos de filtro visíveis ao mesmo tempo (admin, loja + produto ativos) a
`.filters-row` continua em uma única linha sem nenhuma barra de rolagem horizontal —
o layout usa `flex-wrap: wrap`, que quebra para uma segunda linha em vez de estourar a
largura, então isso vale em qualquer viewport mais estreito também. Zero erros no
console (só warnings pré-existentes e não relacionados: múltiplas instâncias do
GoTrueClient por ter duas abas logadas, e os future flags do React Router).

---

## Sprint 26 — Barra de rolagem temática (20/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S26 · Estilizar a barra de rolagem do site para seguir o tema, em vez da barra padrão do navegador (todo:202) | A barra de rolagem (Firefox e Chrome/Edge) usa as cores do tema — trilho em `--bg2`, polegar em `--green-dim` (`--green` no hover) — em qualquer contêiner rolável da SPA, não só na tabela | ✅ Done | **Implementado:** bloco novo em `theme.css` — `scrollbar-width:thin` + `scrollbar-color:var(--green-dim) var(--bg2)` no seletor global `*` (Firefox) e o conjunto `::-webkit-scrollbar*` equivalente (Chrome/Edge/Safari). Não constava do backlog do `todo` como item numerado; identificado por auditoria do diff de `theme.css` (11 linhas adicionadas, sem referência em nenhum sprint anterior) |

**Validação registrada:** mudança isolada de CSS (sem lógica/estado); nenhum módulo
novo, `npm run build` não afetado. Verificação visual pendente de confirmação do
usuário (rolar a tabela/modal e conferir a cor da barra em Chrome e, se usar, Firefox).

---

## Sprint 27 — Link do produto no hover + editar item na fila de Novo Produto (20/08/2026)

> A proposta original desta sprint tinha 3 itens (`todo:204/206/208`). O usuário pediu
> explicitamente para implementar **somente `todo:206` e `todo:208`** — `todo:204`
> (esgotado × não localizado) não foi tocado e virou a proposta de **Sprint 30**.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S27 · Mostrar o link do produto ao passar o mouse sobre o nome, na tabela (todo:206) | Hover no nome do produto (coluna Produto) exibe a URL de origem (`item.url`) — hoje o link só existe como `<a href>` no próprio nome, sem preview | ✅ Done | **Implementado:** novo `.prod-nome-hover`/`.prod-nome-tooltip` em `ProductTable.jsx`/`theme.css` — mesma estrutura visual do `.price-tooltip` da Sprint 25 (fundo `bg2`, borda `green-dim`, sombra), com `word-break:break-all` porque URLs de produto podem ser bem mais longas que o "R$ X" do preço; só aparece quando `item.url` existe. O nome continua sendo o mesmo `<a>` clicável de sempre |
| S27 · Permitir editar um item já na fila de envio da tela Novo Produto, antes de confirmar o cadastro (todo:208) | Na página `/novo-produto`, um item adicionado à fila pode ter seus campos (nome/URL/loja/categoria/meta) reabertos para edição antes do envio, em vez de só remover-e-recriar | ✅ Done | **Implementado:** `NovoProduto.jsx` ganhou o estado `editandoId`; novo botão ✎ em cada linha da fila (ao lado do ✕) chama `editarItem()`, que recarrega os campos no formulário e troca os rótulos ("DADOS DO PRODUTO"→"EDITANDO ITEM DA FILA", "ADICIONAR À FILA"→"SALVAR EDIÇÃO", "LIMPAR"→"CANCELAR EDIÇÃO"); salvar atualiza o item por `id_temp` (`fila.map`) em vez de duplicar; a linha em edição ganha destaque âmbar (`.item-row.editing`); remover um item que está em edição também sai do modo de edição (`removerDaFila`) |

**Validação ao vivo no navegador (Chrome, sessão real logada em `localhost:3000`):**
`npm run build` — 108 módulos, sem erros (mesma contagem de antes — só edição de
arquivos existentes, nenhum novo). Testado com dados reais: hover no nome "AMD Ryzen 7
9800X3D" mostrou a URL completa da KaBuM no tooltip, sem quebrar o layout da tabela;
em `/novo-produto`, um item de teste foi adicionado à fila (com meta), editado (nome e
categoria/loja recarregados corretamente no formulário, rótulos trocados, borda âmbar
na linha), salvo — a fila continuou com 1 item (atualizado, não duplicado) — e removido
ao final para não deixar dado de teste na fila. Console sem erros novos (só os warnings
pré-existentes do React Router e do GoTrueClient, já registrados em sprints anteriores).

---

## Sprint 28 — Temporizador de sessão no cabeçalho (20/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S28 · Temporizador ao lado do relógio no cabeçalho, em amarelo, mostrando quanto falta para o logout automático (todo:212) | O `AppHeader` mostra, ao lado do relógio BRT (`useClock`), uma contagem regressiva em amarelo (ex.: "29:58") até o logout por inatividade; o valor acompanha a atividade do usuário (reseta quando `useAutoLogout` registra atividade) e some/zera ao deslogar | ✅ Done — **validado ao vivo** | **Implementado:** novo hook `useSessionTimer.js` — lê a mesma chave de `localStorage` (`fps_ultima_atividade`, agora exportada de `useAutoLogout.js` como `CHAVE_ULTIMA_ATIVIDADE`) que o `useAutoLogout` da Sprint 13 já mantém atualizada, e recalcula `LIMITE_INATIVIDADE_MS - decorrido` a cada 1s — sem duplicar a lógica de expiração, só leitura, e sem prop drilling nem contexto novo (a decisão do plano original). `AppHeader.jsx` formata o resultado como `mm:ss` (novo `formatMMSS` em `utils/format.js`) e mostra em `var(--amber)` — reaproveitado em vez de criar um `--yellow` novo: `--amber` (`#ffb800`) já lê como amarelo/dourado no tema escuro e já é a cor de atenção usada em outros lugares (ALERTA, ★ menor preço), então um token novo só para isto seria uma abstração a mais sem diferença visual perceptível. O temporizador some sozinho ao deslogar porque o `AppHeader` só é montado dentro do bloco "logado" de `App.jsx` — nenhuma lógica extra de esconder precisou ser escrita |

**Validação ao vivo no navegador (Chrome, `localhost:3000` logado):** `npm run
build` — 109 módulos (era 108; +1 pelo novo hook), sem erros. Contagem regressiva
conferida em sincronia real com o relógio (29:39 → 29:28 em 11s de parede, via
zoom em screenshots); um clique na página resetou o temporizador para perto de
30:00, confirmando que atividade em qualquer lugar da SPA reseta a contagem (mesmo
mecanismo do `useAutoLogout`); mesmo comportamento visível em `/` e
`/novo-produto` (o `AppHeader` fica acima do roteador, então não remonta ao trocar
de rota). Console sem erros novos (só o warning pré-existente do GoTrueClient).

---

## Sprint 29 — Novas lojas: Tuyo, Playstation, Logitec, Tangle Teezer, Amazon (23/08/2026)

> Primeira tarefa de back-end/scraper de toda a V3+V4 — todas as sprints 17–28/31–33
> mexeram só no frontend da Dashboard/schema. Segue o contrato de `scrapers/base.py`
> (`ScraperBase`) e a metodologia da skill `scraper-nova-loja` (criada nesta mesma
> sessão): inspecionar a página real ANTES de escrever código, testar local
> (`headless=True`/`False`), só então registrar. Começou com só a Tuyo (pedido do
> usuário), depois foi completada inteira ("faça a sprint 29 inteira") com as
> outras 4 lojas + registro em `lojas` (Supabase) + frontend.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S29 · Scraper + registro da loja Tuyo (todo:214) | `TuyoScraper(headless=True).coletar(url)` retorna `DadosProduto` com nome/preço/disponibilidade corretos | ✅ Done — **validado com dados reais** | `scrapers/tuyo.py`. Shopify — o produto é um `ProductGroup` (schema.org) com variantes (cor) em `hasVariant`, cada uma com preço/disponibilidade próprios; a URL identifica a variante por `?variant=<id>`, casado contra `hasVariant[].offers.url`/`@id` (senão pegaria a variante errada). Ordem: JSON-LD → meta `og:price:amount`/`og:title` → CSS (`.product__price--regular`, `h1.product__title`) → JS. **Validado com as duas variantes reais do link de teste:** Navy Blue (esgotada de verdade) → `preco=None, disponivel=False`; Off White (disponível) → `preco=349.0, disponivel=True` — batendo exatamente com o JSON-LD/DOM inspecionados ao vivo antes de escrever o código |
| S29 · Scraper + registro da loja Playstation Store (todo:214) | `PlaystationScraper(headless=True).coletar(url)` retorna `DadosProduto` correto | ✅ Done — **validado com dados reais** | `scrapers/playstation.py`. SPA Next.js — JSON-LD `Product` único (sem `availability`, loja digital não tem "esgotado" tradicional); preço também em `[data-qa='mfeCtaMain#offer0#finalPrice']` — **cuidado confirmado na inspeção real**: a página lista preços de OUTRAS edições do mesmo jogo em `[data-qa='mfeUpsell#...']`, nunca usar esses. Esgotamento = ausência do botão `mfeCtaMain#cta#action` ou texto de indisponibilidade. **Validado:** `preco=455.9, disponivel=True`, nome completo, idêntico ao inspecionado ao vivo, **e confirmado em 3/3 runs reais de CI** (ver nota ao final da sprint) |
| S29 · Scraper + registro da loja Logitec (Logitech Store BR) (todo:214) | `LogitecScraper(headless=True).coletar(url)` retorna `DadosProduto` correto | ✅ Done — **validado com dados reais** | `scrapers/logitec.py`. Nome do arquivo/slug como digitado no `todo` ("Logitec", não "Logitech") — decisão de nomenclatura registrada aqui. Magento, **sem JSON-LD** (confirmado 0 scripts `ld+json`) — a extração real é via meta `product:price:amount` (1199.9, bate com o preço exibido) **cuidado**: existe um segundo preço `.in_cash-price-box` (desconto PIX) que não é o de referência. Disponibilidade via `div.stock.available`/`unavailable` (padrão de tema Magento). **Validado:** `preco=1199.9, disponivel=True`, nome idêntico ao `h1.page-title` |
| S29 · Scraper + registro da loja Tangle Teezer BR (todo:214) | `TangleteezerScraper(headless=True).coletar(url)` retorna `DadosProduto` correto | ✅ Done — **validado com dados reais** | `scrapers/tangleteezer.py`. VTEX — mesma particularidade da Tuyo (múltiplas variantes com preço/disponibilidade próprios via `AggregateOffer.offers[]`), mas resolvida mais simples: o `Product` raiz já tem o `sku` da variante selecionada, só casar contra `offers.offers[].sku` (sem precisar da query string da URL). **Validado:** `preco=160.0, disponivel=True`, sku casado corretamente, nome "Escova de Cabelo The Ultimate Detangler" |
| S29 · Scraper + registro da loja Amazon BR (todo:214) | `AmazonScraper(headless=True).coletar(url)` retorna `DadosProduto` correto | ✅ Done — **validado local + 3/3 runs de CI reais, sem bloqueio de bot** | `scrapers/amazon.py`. **Achado durante a inspeção:** ao abrir a página manualmente (navegador comum, não Playwright) para desenhar o scraper, a Amazon respondeu uma vez com a interstitial anti-bot "Clique no botão abaixo para continuar comprando". **Não tentamos clicar/contornar essa interstitial** (fora do escopo permitido); reaberta a página momentos depois, carregou normal — não era bloqueio persistente. **Bug real encontrado e corrigido antes de finalizar:** o primeiro rascunho combinava 3 seletores de preço num único `query_selector("a, b, c")` — a página da Amazon tem DEZENAS de outros preços (produtos relacionados, combos); esse padrão pega o primeiro em ORDEM NO DOM da união, não o mais específico primeiro (confirmado ao vivo: 41 elementos `.a-price .a-offscreen` na página, vários "null" ou de outros produtos). Corrigido para tentar cada seletor **isolado**, do mais específico ao mais amplo. **Resultado final, o mais significativo da sprint:** rodou com sucesso nos **3 runs reais de CI** a partir do IP de datacenter do GitHub Actions, sem nenhum sinal de bloqueio — `preco=265.17` idêntico nos 3 runs, igual ao validado localmente. Diferente da Pichau, a Amazon **não precisou** do tratamento de retry/challenge |
| S29 · Categoria/UI de cadastro para as 5 lojas novas (todo:214) | `NovoProduto.jsx` e o filtro de loja do Dashboard reconhecem as 5 lojas novas; um item de cada loja pode ser cadastrado ponta a ponta | ✅ Done — **validado ao vivo (UI) + 3/3 runs de CI (coleta)** | **Implementado:** as 5 lojas inseridas em `lojas` (Supabase, com `url_base` — coluna documentada em `banco.md` que eu não conhecia até o INSERT falhar por `NOT NULL`, corrigido na hora); `LOJAS_DETECTADAS`/`LOJAS_LABEL` em `NovoProduto.jsx` e `LOJAS_FILTER` em `Dashboard.constants.js` atualizados; comentários de `coletar.yml`/`CLAUDE.md`/`README.md`/`banco.md` atualizados com os 5 slugs novos. **Validado ao vivo (UI):** cadastrado 1 item de teste por loja nova — DETECTAR reconheceu corretamente o domínio de cada uma, os 8 selects de loja aparecem corretos, itens salvos com a badge certa no Dashboard. **Validado em CI:** 5 itens de teste recriados via service key, coletados com sucesso em 3 runs reais de `workflow_dispatch` (ver nota abaixo). Todos os itens/leituras de teste removidos ao final de cada rodada |

**✅ CI (GitHub Actions) — validado com 3/3 runs reais, todas as 5 lojas com
sucesso.** Primeira tentativa (antes do commit) confirmou um problema real: o
`workflow_dispatch` roda o código já commitado/enviado na branch remota
(`Duplicate-Main`), e nada desta sessão tinha sido commitado ainda — o run
ignorou os 5 itens de teste como "loja desconhecida" (0 leituras gravadas, nenhum
dado incorreto, só nenhuma validação de fato) — confirmado via
`git log origin/Duplicate-Main` parado no commit da Sprint 31. O usuário então
pediu explicitamente para commitar, dar push e testar na branch. Feito: commit
`05d6cd7` (26 arquivos, Sprints 29/32/32b/32c/33) enviado para `Duplicate-Main`,
depois **3 dispatches reais** (`ITEM_IDS` com 5 itens de teste recriados via
`SUPABASE_SERVICE_KEY`, um por loja nova), cada um monitorado via API do GitHub
até `completed`/`success`:

| Run | Tuyo | Playstation | Logitec | Tangle Teezer | Amazon |
|---|---|---|---|---|---|
| [32650434361](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/32650434361) | R$ 349,00 | R$ 455,90 | R$ 1.199,90 | R$ 160,00 | R$ 265,17 |
| [32650607960](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/32650607960) | R$ 349,00 | R$ 455,90 | R$ 1.199,90 | R$ 160,00 | R$ 265,17 |
| [32650732940](https://github.com/HenriqueCanhadas/Protocol-FPS/actions/runs/32650732940) | R$ 349,00 | R$ 455,90 | R$ 1.199,90 | R$ 160,00 | R$ 265,17 |

**3/3 runs idênticos entre si e idênticos ao validado localmente** — mesma barra
usada para Kabum/Terabyte na Sprint 1 (`sprint_v1.md`). Nenhuma das 5 lojas
apresentou challenge/bloqueio a partir do IP de datacenter do runner — em
particular a Amazon, que era a maior suspeita de precisar do tratamento estilo
Pichau, **não precisou**. `todo:214` fechado — as 15 leituras de teste (5 itens ×
3 runs) e os 5 itens foram removidos do banco ao final via `SUPABASE_SERVICE_KEY`.

---

## Sprint 30 — proposta: Disponibilidade real — esgotado × não localizado (ainda não iniciada)

> Único item que sobrou da proposta original da Sprint 27 — o usuário pediu para
> implementar só `todo:206`/`todo:208` naquela sprint e deixar este de fora por ora.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S30 · Diferenciar "esgotado" de "não localizado" na coleta, informando de fato quando o produto está esgotado (todo:204) | Um item cujo scraper não achou o seletor de preço (erro/challenge) aparece com um status diferente de um item cujo scraper confirmou disponivel=false (esgotado de verdade); o usuário consegue distinguir os dois casos na tabela | ⬜ Todo | **Esperado:** provavelmente exige um novo valor de status em `DadosProduto`/`historico_precos` (hoje só há `disponivel` booleano) — a decisão de schema fica para o início da sprint |

---

## Sprint 31 — Criar novas categorias pela tela Novo Produto (20/08/2026)

> Primeira tarefa da V3+V4 que precisa de uma mudança de schema (RLS) — todas as
> anteriores mexiam só em componentes/CSS. `produtos` tinha apenas política de
> SELECT para autenticados (dado de referência compartilhado, ver `project/banco.md`
> §6); não havia INSERT liberado, então uma tentativa direta do frontend seria
> bloqueada pelo próprio RLS do Supabase.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S31 · Botão "+ Nova categoria" (admin) na tela Novo Produto abre campo inline para nomear e criar uma categoria nova; só admin consegue (todo:216) | Logado como admin, o campo Categoria mostra um `<select>` com as categorias existentes e, abaixo, um botão "+ Nova categoria"; clicar abre um campo de texto + botões CRIAR/✕; digitar um nome e confirmar (Enter ou CRIAR) insere a categoria em `produtos` e ela aparece imediatamente como opção do select, já selecionada, sem recarregar a página. Usuário não-admin não vê o botão "+ Nova categoria", e mesmo que tentasse via requisição direta o RLS bloqueia | ✅ Done — **validado ao vivo de ponta a ponta** | **Implementado:** `NovoProduto.jsx` passou a receber `isAdmin` (novo prop encadeado em `App.jsx`, rota `/novo-produto`); as opções de categoria agora vêm de `categorias` (estado carregado de `produtos.select("id,categoria,nome")`, antes era o array fixo `CATEGORIAS`) via `ordenarCategorias()` — mantém GPU/CPU/RAM/PSU/MOBO/STORAGE/DIVERSOS na ordem e nos rótulos de sempre (`CATEGORIA_LABEL_FIXA`) e ordena as novas por nome, no fim da lista; `criarCategoria()` deriva o slug interno via `slugCategoria()` (maiúsculo, sem acento/espaço — ex. "Water Cooler" → `WATER_COOLER`) e faz `INSERT` em `produtos`, atualizando `produtosDB`/`categorias` em memória (sem novo fetch) e pré-selecionando a categoria criada. Migração `project/migrations/sprint31_categorias_insert.sql` cria a policy `produtos_insert_admin` (RLS, `with check (is_admin())` — reaproveita `is_admin()` da Sprint 5), **rodada pelo usuário e confirmada ativa**. Os campos Categoria e Loja, que eram chips clicáveis, viraram `<select>` nativo (`.form-select`, mesmo padrão visual de `.filter-select`/`.user-select` já usados no Dashboard/Usuarios — sem lib nova); o botão "+ Nova categoria" saiu de dentro da lista de chips e virou um link-botão abaixo do select |

**Validação ao vivo no navegador, em duas rodadas (Chrome reconectado nesta sessão,
`localhost:3000` logado como admin):**
1. **Antes da migração:** `npm run build` — 108 módulos, sem erros. Os dois `<select>`
   (Categoria com as 7 opções + Loja com as 3 lojas) confirmados via árvore de
   acessibilidade; `DETECTAR` continua preenchendo o select de Loja sozinho ao colar
   uma URL; item de teste adicionado à fila com os dois selects (GPU/KaBuM), editado
   (✎ recarregou os selects com os valores corretos) e removido ao final. Tentativa
   de criar a categoria "Water Cooler Teste" foi recusada pelo Supabase com
   `new row violates row-level security policy for table "produtos"` — confirmou que
   a policy ainda não estava aplicada, e que o código trata o erro de RLS sem quebrar
   (toast de erro, nada gravado).
2. **Depois do usuário rodar a migração:** criada ao vivo a categoria "ZZZ Teste
   Sprint31 Apagar" (slug `ZZZ_TESTE_SPRINT31_APAGAR`) — apareceu imediatamente no
   select já selecionada, e **persistiu depois de recarregar a página** (prova de
   que a policy `produtos_insert_admin` está ativa e o INSERT foi real, não só
   otimista no estado local). Como não existe UI de apagar categoria, a limpeza foi
   feita por um script pontual com a `SUPABASE_SERVICE_KEY` (conferindo antes que
   nenhum item usava essa categoria) — a tabela `produtos` voltou ao estado original
   de 7 categorias, confirmado recarregando a tela novamente.

---

## Sprint 32 — Painel admin de banco/monitoramento (23/08/2026)

> Segunda tarefa de back-end/schema da V3+V4 (a primeira de scraper é a Sprint 29
> proposta; esta mexeu em RPC/RLS como a Sprint 31). O `todo:218` não especificava
> métricas exatas nem onde a seção moraria na navegação — **decisões confirmadas
> com o usuário antes de implementar** (per a própria skill `autonomous-execution`,
> que marca "decisão em aberto no plano" como um dos poucos pontos que exigem
> parar e perguntar): página **nova em `/admin`** (não aba em `/usuarios`), com
> **as três categorias de métrica propostas** — contagens de linhas, tamanho do
> banco e saúde do cron/coleta.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S32 · Nova página admin-only `/admin` com métricas operacionais do banco: contagens de linhas, tamanho das tabelas e saúde da coleta (todo:218) | Logado como admin, `/admin` (novo item "▣ Admin" no menu lateral, abaixo de "◈ Usuários") mostra: itens monitorados/total/pausados, leituras e alertas (total + hoje), usuários cadastrados, tamanho de cada tabela principal + total, e última coleta geral + por loja (com leituras nas últimas 24h); usuário não-admin não vê o item de menu e é redirecionado ao acessar a rota direto (mesma guarda de `/usuarios`) | ✅ Done — **validado ao vivo** | **Implementado:** nova RPC `public.admin_estatisticas()` (`SECURITY DEFINER`) em `project/migrations/sprint32_admin_estatisticas.sql`, retornando um único `jsonb` com `contagens`/`tamanho` (`pg_total_relation_size` + `pg_size_pretty`, já formatado no banco)/`coleta` (última leitura geral + agregação por loja via `lojas ⟕ itens ⟕ historico_precos`); novo `services/admin.service.js` (`buscarEstatisticas()` via `supabase.rpc(...)` — primeiro uso de RPC custom no frontend); nova `pages/Admin.jsx` seguindo o mesmo padrão visual de `pages/Usuarios.jsx`; rota `/admin` em `App.jsx` e item "▣ Admin" em `NavDrawer.jsx` (gate revisado na Sprint 32b, ver abaixo). **Decisão de escopo registrada:** "saúde do cron/coleta" foi implementada como proxy observável a partir de `historico_precos` (última leitura geral/por loja, contagem nas últimas 24h) — **não** é uma leitura do histórico de execuções do GitHub Actions (sucesso/falha por run), que exigiria uma integração servidor-side nova com a API do GitHub; a tela deixa isso explícito num aviso de rodapé. **Validação:** `npm run build` — 111 módulos, sem erros. **Validado ao vivo em duas rodadas** (Chrome reconectado, sessão real logada como pedrosacanhadas): 1ª rodada confirmou dados reais em `/admin` (33 itens, 3398 leituras, tamanho de cada tabela, e a saúde da coleta batendo com a limitação conhecida da Pichau — última coleta 09/07 vs. Kabum/Terabyte em 22/08); 2ª rodada (pós Sprint 32b) reconfirmou `/admin` funcionando pelo novo gate `ver_banco` |

**Migrações aplicadas e confirmadas ao vivo pelo usuário:**
`project/migrations/sprint32_admin_estatisticas.sql` e `sprint32b_ver_banco.sql`
(ver Sprint 32b abaixo) — ambas rodadas no SQL Editor do Supabase; `/admin`
mostrando dados reais foi conferido ao vivo nesta sessão, com screenshot e sem
erros no console.

---

## Sprint 32b — Restringe `/admin` a uma permissão própria (`ver_banco`) (23/08/2026)

> Pedido direto do usuário no mesmo dia da Sprint 32, **não vinha do `todo`** —
> registrado aqui por ser follow-up imediato da Sprint 32 (mesma RPC/página),
> mas é uma decisão de acesso nova: "na parte de usuários somente colocar o
> usuário pedrosacanhadas@gmail.com ver o banco, e somente ele pode liberar para
> outra pessoa ver o banco". Instrução explícita e sem ambiguidade — não exigiu
> parar para perguntar (só as pequenas decisões de nomenclatura/coluna ficaram a
> critério de implementação, relatadas abaixo).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S32b · `/admin` deixa de depender de `isAdmin` e passa a depender de uma permissão própria (`usuarios.ver_banco`), com `pedrosacanhadas@gmail.com` liberado por padrão | Um admin comum (`nivel=2`) sem `ver_banco=true` não vê mais "▣ Admin" no menu nem consegue abrir `/admin` direto (redirecionado ao `/`); `pedrosacanhadas@gmail.com` continua vendo normalmente, sem nenhuma ação manual além de rodar a migração | ✅ Done — **validado ao vivo** | **Implementado:** migração `sprint32b_ver_banco.sql` — coluna `usuarios.ver_banco boolean default false`, backfill `true` só para `pedrosacanhadas@gmail.com`, nova função `pode_ver_banco()` (mesmo padrão `SECURITY DEFINER` de `is_admin()`) e `admin_estatisticas()` recriada trocando o gate de `is_admin()` para `pode_ver_banco()`. Frontend: `useAuth.js` passou a buscar `ver_banco` junto de `nivel`/`nome` (com fallback para o select antigo se a coluna ainda não existir, para não derrubar `isAdmin` durante a janela pré-migração) e expõe `podeVerBanco`; `NavDrawer.jsx` mostra "▣ Admin" por `podeVerBanco` (independente de `isAdmin` — a "Usuários" continua só para admin); `Admin.jsx` troca o gate/redirect de `isAdmin` para `podeVerBanco`. **Validado ao vivo:** antes de rodar a migração, `/admin` ficou inacessível **até para o próprio pedrosacanhadas** (efeito colateral esperado e avisado ao usuário — o gate virou estritamente `ver_banco`, que só existe depois da migração); depois de rodar e recarregar a sessão, `/admin` voltou a funcionar normalmente para ele |
| S32b · Só `pedrosacanhadas@gmail.com` pode ligar/desligar o `ver_banco` de outra pessoa, pela tela Usuários | Endpoint `/api/usuarios` ganha `acao=ver_banco`; chamado por qualquer admin que não seja o dono, retorna 403 mesmo com token de admin válido; chamado pelo dono, atualiza `ver_banco` do `user_id` alvo | ✅ Done — **validado ao vivo** | **Implementado em paridade Flask×Vercel** (`app.py` e `api/usuarios.js`): a ação busca o email de quem está chamando (`uid` do token) e compara com a constante `pedrosacanhadas@gmail.com` — 403 para qualquer outro admin, mesmo com nível 2. `Usuarios.jsx` ganhou uma coluna "Banco" (mesmo padrão visual do toggle "Telegram" já existente) com `souDono = user.email === DONO_EMAIL` controlando `disabled` do botão — outros admins veem o estado mas não conseguem clicar. **Validado ao vivo:** logado como pedrosacanhadas, a coluna "Banco" apareceu com ele já `✓ ON` (seed da migração) e os demais `OFF`; toggle testado em `teste.claude@gmail.com` (OFF→ON→OFF, revertido ao estado original ao final do teste, sem deixar dado de teste); zero erros no console em ambas as telas |

**Validação de regressão:** antes de `sprint32b_ver_banco.sql` rodar, a tela
`/usuarios` foi conferida com a migração ausente — a coluna "Banco" simplesmente
não apareceu (fallback `ver_banco_ok=false` do endpoint), sem quebrar a listagem
nem gerar erro de console; confirma que o fallback de schema-em-atraso funciona
como os já existentes (`telegram_ok`, Sprint 9).

---

## Sprint 32c — Medidor de cota de disco + barras proporcionais por tabela (23/08/2026)

> Pedido direto do usuário, mesmo dia das Sprints 32/32b, **não vinha do `todo`**:
> "gostaria de saber quanto cada tabela está consumindo, quanto ainda tenho de
> disco disponível... utilize também o plugin de front-end para essa parte".
> Antes de implementar, uma pergunta genuína ao usuário (a cota do plano Supabase
> não é uma informação que o Postgres saiba sozinho) e consulta às skills
> `frontend-design-system` (tokens/paleta do projeto) e `dataviz` (forma correta:
> "uma razão contra um limite" → **meter**; comparação de magnitude entre 6
> tabelas → **barra proporcional**, não um gráfico de pizza/rosca).

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S32c · Medidor de uso de disco (banco inteiro vs. cota do plano), com severidade por cor e espaço disponível calculado | O card "ESPAÇO EM DISCO" mostra o tamanho real do banco (não só as 6 tabelas do app), a % da cota, quanto ainda está disponível, e uma barra cujo preenchimento fica verde/âmbar/vermelho conforme a faixa de uso (< 70% / 70–90% / ≥ 90%) | ✅ Done — **validado ao vivo** | **Implementado:** migração `sprint32c_admin_disco.sql` recria `admin_estatisticas()` adicionando `pg_database_size(current_database())` (banco inteiro — auth/storage/índices geridos pelo Supabase incluídos, não só as 6 tabelas do app) em `tamanho.banco_completo_bytes`/`banco_completo`. Frontend: constante `ADMIN_QUOTA_BYTES` (500 MB, plano Free — informado pelo usuário; documentado como hardcoded porque o Postgres não expõe a cota do plano) e `severidadeUso()` com os limiares 70%/90%; medidor construído em HTML/CSS puro (track `--bg3` + fill `--green`/`--amber`/`--red`, sem lib de gráfico, no mesmo espírito do único SVG customizado do projeto). **Validado ao vivo:** 13 MB usados (2,7% da cota), 486,6 MB disponíveis de 500 MB, barra verde (bem abaixo de 70%) — batendo com o número real do banco |
| S32c · Tamanho por tabela como barra proporcional (magnitude), em vez de tabela de texto simples | O card "TAMANHO POR TABELA" mostra uma barra horizontal por tabela, comprimento proporcional ao tamanho, ordenada da maior para a menor, com o valor formatado no fim da barra | ✅ Done — **validado ao vivo** | **Implementado:** a RPC passou a devolver `tamanho.tabelas` como array `{tabela, bytes, pretty}` já ordenado por `bytes desc` (era um objeto fixo por nome de coluna); `Admin.jsx` renderiza uma `.disco-row` por tabela com barra `width: (bytes/maiorTabela)*100%` (hue único `--green-dim`, não a paleta de severidade do medidor — é magnitude, não alarme) e o valor em `tabular-nums`, alinhado à direita (regra do `dataviz`: rótulo na ponta da barra, nunca dentro se não couber). **Bug encontrado e corrigido no próprio teste ao vivo:** `maiorTabela` tinha sido declarado dentro do escopo de uma IIFE do card de disco e usado no card de tabelas logo abaixo, fora daquele escopo — `ReferenceError` quebrando a página inteira (tela preta). Corrigido subindo o cálculo para o escopo do componente, antes do `return`. **Validado ao vivo após o fix:** barras corretas e proporcionais — Histórico de preços (976 kB, barra cheia) muito à frente de Itens (128 kB) e as demais (Alertas/Usuários 64 kB, Produtos/Lojas 48 kB) |

**Bug de regressão encontrado e corrigido durante a própria validação desta
sprint** (não chegou a ficar em produção): antes da correção, qualquer resposta
"antiga" da RPC (sem os campos novos) também quebrava a página com tela preta em
vez de cair no estado "indisponível" já existente — o `carregar()` agora valida
que `tamanho.tabelas` é um array e `tamanho.banco_completo_bytes` é number antes
de aceitar os dados, tratando qualquer formato inesperado como indisponível em
vez de deixar o React quebrar. **Validação final ao vivo:** dois reloads limpos
sem nenhum erro de console, dados reais em todos os três cards do `/admin`
(Visão geral, Espaço em disco, Tamanho por tabela) e na Saúde da coleta abaixo.

---

## Sprint 33 — Campo dedicado de criação de categoria em Novo Produto (23/08/2026)

> Pergunta feita ao usuário no início da sprint (per a skill `autonomous-execution`
> — decisão marcada como "em aberto" no plano exige parar e perguntar):
> Sprint 31 já entregou "+ Nova categoria" como link dentro do campo Categoria; o
> `todo:220` pede "um campo a parte". Confirmado com preview visual: o pedido é
> **transformar em seção própria e separada**, tirando a criação de dentro do
> campo Categoria — não é uma repetição da Sprint 31.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S33 · Campo dedicado (seção própria, fora do `<select>`) para criar categoria em Novo Produto, já utilizável na hora (todo:220) | A criação de categoria deixa de ser um botão-link abaixo do `<select>` de Categoria (comportamento da Sprint 31) e passa a ter seu próprio card/seção visível na tela (entre o formulário principal e a Fila de Envio); ao criar, a categoria nova aparece imediatamente disponível e já selecionada no `<select>` de Categoria, sem recarregar a página | ✅ Done — **validado ao vivo** | **Implementado:** novo `form-card` "CRIAR NOVA CATEGORIA" (admin-only, mesmo padrão visual de `data-label` usado em todo o app) inserido entre o card "DADOS DO PRODUTO" e "FILA DE ENVIO" em `NovoProduto.jsx`; reaproveita 100% a lógica já existente da Sprint 31 (`criarCategoria()`, `slugCategoria()`, policy `produtos_insert_admin`) — mudança é só de posicionamento/apresentação, sem lógica nova. Removido o estado `criandoCategoria` (toggle expandir/recolher), que deixou de fazer sentido com a seção sempre visível; o CSS `.link-btn` (só usado pelo link removido) também saiu, código morto. **Validado ao vivo:** criada a categoria de teste "ZZZ Teste Sprint33 Apagar" pela nova seção — apareceu imediatamente selecionada no campo Categoria acima, sem reload; zero erros de console; categoria de teste removida ao final via script pontual com `SUPABASE_SERVICE_KEY` (confirmado antes que nenhum item usava ela, mesmo procedimento de limpeza da Sprint 31) |

**Nota de processo:** durante a limpeza pós-teste, tentei por engano navegar ao
painel web do Supabase (ação incorreta — exigiria a sessão logada do usuário, que
esta automação não tem); revertido imediatamente sem nenhuma ação lá, e a limpeza
foi refeita do jeito certo (script local com a service key, mesmo padrão já usado
na Sprint 31). Isso também fechou uma aba do navegador que o usuário havia logado
manualmente mais cedo na sessão — uma nova aba foi aberta em seguida e a sessão
(armazenada no perfil do Chrome, não na aba) continuou logada normalmente.

---

## Resumo por status

| Status | Qtde | Linhas do `todo` |
|--------|------|-------------------|
| ✅ Done | 18 | 182, 184, 186, 188, 190, 192, 194, 196, 198, 200, 202, 206, 208, 212, 214, 216, 218, 220 |
| ⬜ Todo | 2 | 204 (proposto na Sprint 30), 210 (absorvido pela V3 — ver nota na própria linha) |
| 🟡 Pending | 0 | — |

## Skills Futuras

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|------------------|----------|------------|
| `frontend-design-system` | já existe | Continua a referência de cores/tipografia/tom de voz usada nestas sprints (pop-up de busca, tooltip de preço, entorno dos botões, reaproveitamento do `--amber` como cor de atenção na Sprint 28) | Já feita |
| `backend-conventions` | já existe | Referência obrigatória para a Sprint 29 (5 scrapers novos) — contrato `ScraperBase`, ordem de extração JSON-LD→meta→CSS→JS e registro no dict `SCRAPERS` | Já feita — primeira vez que a V3/V4 realmente precisa dela |
| `db-migrations` | sugerida na Sprint 31, reforçada nas 32/32b/32c | A V3/V4 até aqui não mexia em schema/RLS; a Sprint 31 precisou de uma policy nova (`produtos_insert_admin`) e as Sprints 32/32b/32c precisaram de **3 migrações no mesmo dia** (cada uma recriando `admin_estatisticas()` de novo) — é fácil esquecer de rodar a migração mais recente antes de testar (aconteceu 3x nesta V4, cada vez com o erro certo mas exigindo uma volta de ida e volta com o usuário); uma skill/checklist "toda sprint com arquivo novo em `project/migrations/` precisa do usuário confirmar que já rodou no SQL Editor antes de dar a tarefa por concluída" evitaria esse ponto cego recorrente | Alta (3 ocorrências na mesma sessão) |
| `scraper-nova-loja` | sugerida desde a `sprint_v2.md` (S1/S4) — **criada em 23/08/2026**, pedido direto do usuário depois da Sprint 29 (Tuyo) | `.claude/skills/scraper-nova-loja/SKILL.md` — não é só o andaime da subclasse (isso já está na `backend-conventions`); documenta a **metodologia de teste** dos 3 scrapers já validados (Kabum/Terabyte/Pichau), como o ambiente CI difere do local (IP de datacenter, flags do Chromium, timeouts, detecção de challenge em `base.py`), e o padrão Pichau (retry+challenge honesta+decisão documentada) para quando uma loja nova bloquear sistematicamente do CI. Também fecha a `ci-diagnostics` sugerida na Sprint 1 (`sprint_v1.md`), que nunca virou skill separada | Já feita |
| `db-admin-metrics` | sugerida na Sprint 32 | RPC(s) `SECURITY DEFINER` reaproveitáveis para expor métricas operacionais (tamanho de tabelas, contagens, saúde do cron) sem duplicar introspecção manual a cada nova pergunta "admin quer ver X do banco" | Média |
