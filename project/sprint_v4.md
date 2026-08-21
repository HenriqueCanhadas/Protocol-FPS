# PROTOCOL FPS — Planejamento de Sprints — V4

> Relatório gerado a partir da seção **V4** do arquivo `todo` (raiz do repositório).
> Data de geração: **20/08/2026** (atualizado após a Sprint 28 — temporizador de
> sessão no cabeçalho).
>
> A V4 é uma sequência de ajustes de UX pontuais sobre a Dashboard reconstruída na V3
> (`project/sprint_v3.md`). As **Sprints 23, 24, 25, 26, 27, 28 e 31** foram
> implementadas em 19–20/08/2026 (numeração não contígua — 29/30 continuam
> propostas, ver abaixo). Restam **3 itens `⬜ Todo`** no `todo` (linhas 204, 210 e
> 214) que ainda não viraram sprint executada — ver "Resumo por status". **214**
> (novas lojas Tuyo/Playstation/Logitec/Tangleteezer/Amazon, proposta de Sprint 29)
> é a **primeira tarefa de back-end/scraper de toda a V3+V4** — todas as outras
> sprints executadas dessas duas versões mexeram só no frontend da Dashboard.
>
> ✅ **Migração da Sprint 31 rodada pelo usuário e confirmada em produção local**:
> `project/migrations/sprint31_categorias_insert.sql` já está aplicada — a criação
> de categorias funciona de fato (não é mais uma pendência).
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
| 29 *(proposta, ainda não iniciada)* | Novas lojas: Tuyo, Playstation, Logitec, Tangleteezer, Amazon | a definir | 5 | 1 (5 lojas) |
| 30 *(proposta, ainda não iniciada)* | Disponibilidade real: esgotado × não localizado | a definir | 2 | 1 |
| 31 | Criar novas categorias pela tela Novo Produto (admin) | 20/08/2026 | 1 | 1 |

**Sprints 23–28 e 31 concluídas** (19–20/08/2026 — numeração não contígua, 29/30
seguem propostas). Restam **3 itens `⬜ Todo`** na V4 (1 na Sprint 29 proposta, 1 na
Sprint 30 proposta + 1 já absorvido pela V3, ver "Resumo por status"). A numeração
de sprints continua de onde a Sprint 23 parou.

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

## Sprint 29 — proposta: Novas lojas — Tuyo, Playstation, Logitec, Tangleteezer, Amazon (ainda não iniciada)

> Primeira tarefa de back-end/scraper de toda a V3+V4 — todas as sprints 17–27 desta
> e da versão anterior mexeram só no frontend da Dashboard. Segue o contrato de
> `scrapers/base.py` (`ScraperBase`): cada loja nova é uma subclasse implementando
> `_aguardar_preco(page)` e `extrair_dados(page, url)`, mais uma entrada no dict
> `SCRAPERS` do `main.py` — ver skill `backend-conventions`.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S29 · Scraper + registro da loja Tuyo (todo:214) | `python -c "from scrapers.tuyo import TuyoScraper; print(TuyoScraper(headless=False).coletar('https://tuyo.com.br/products/growler-4l?variant=50773185102140'))"` retorna um `DadosProduto` com nome/preço/disponibilidade corretos | ⬜ Todo | **Esperado:** extração por JSON-LD → meta tags → CSS → JS, na ordem padrão do projeto (ver `kabum.py`); link de teste fornecido pelo usuário |
| S29 · Scraper + registro da loja Playstation Store (todo:214) | Mesmo teste com `PlaystationScraper` e `https://store.playstation.com/pt-br/product/UP9000-PPSA03671_00-WOLVERINEDELUXE0` | ⬜ Todo | **Esperado:** loja internacional (store.playstation.com) — validar se bloqueia datacenter/CI como a Pichau (risco conhecido do projeto) antes de assumir cobertura no CI |
| S29 · Scraper + registro da loja Logitec (Logitech Store BR) (todo:214) | Mesmo teste com `LogitecScraper` e `https://www.logitechstore.com.br/mouse-logitech-g-pro-x2-superstrike/?srsltid=...` | ⬜ Todo | **Esperado:** confirmar se a URL de teste (com `srsltid` de tracking) permanece estável o suficiente para monitoramento recorrente, ou se deve ser normalizada ao cadastrar |
| S29 · Scraper + registro da loja Tangle Teezer BR (todo:214) | Mesmo teste com `TangleteezerScraper` e `https://www.tangleteezer.com.br/the-ultimate-detangler/p?...` (URL com múltiplos parâmetros de campanha `gad_*`/`gclid`) | ⬜ Todo | **Esperado:** mesma ressalva de normalização de URL da Logitec |
| S29 · Scraper + registro da loja Amazon BR (todo:214) | Mesmo teste com `AmazonScraper` e `https://www.amazon.com.br/Aparador-raspador-OneBlade-pentes-bivolt/dp/B0C2877GJS?ref_=ast_sto_dp` | ⬜ Todo | **Esperado:** Amazon é conhecida por anti-bot agressivo — maior risco de bloqueio em CI (datacenter) do grupo, análogo à limitação já documentada da Pichau; decisão de aceitar coleta só local (como a Pichau) pode ser necessária |
| S29 · Categoria/UI de cadastro para as 5 lojas novas (todo:214) | `NovoProduto.jsx` e o filtro de loja do Dashboard reconhecem as 5 lojas novas (slug = nome da loja em minúsculas sem espaços, convenção do `SCRAPERS`); um item de cada loja pode ser cadastrado e coletado ponta a ponta | ⬜ Todo | **Esperado:** inserir as 5 lojas em `lojas` (Supabase) + listas de loja em `coletar.yml`/`README.md`/`CLAUDE.md`, seguindo o precedente da categoria STORAGE/DIVERSOS (Sprints 3 e 8, `sprint_v1.md`/`sprint_v2.md`) |

**Escopo aberto para o início da sprint:** o `todo` só define os 5 links de teste —
não há decisão ainda sobre nomes exatos de arquivo/slug (`tuyo`/`logitec` como
digitado pelo usuário, mesmo que "Logitec" normalmente se escreva "Logitech") nem
sobre CI (quais das 5 vão bloquear datacenter como a Pichau/possivelmente
Playstation/Amazon). Recomenda-se validar cada loja isoladamente com
`headless=False` (ver `CLAUDE.md`, seção Commands) antes de registrar no `SCRAPERS`.

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

## Resumo por status

| Status | Qtde | Linhas do `todo` |
|--------|------|-------------------|
| ✅ Done | 15 | 182, 184, 186, 188, 190, 192, 194, 196, 198, 200, 202, 206, 208, 212, 216 |
| ⬜ Todo | 3 | 204 (proposto na Sprint 30), 210 (absorvido pela V3 — ver nota na própria linha), 214 (proposto na Sprint 29, 5 lojas) |
| 🟡 Pending | 0 | — |

## Skills Futuras

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|------------------|----------|------------|
| `frontend-design-system` | já existe | Continua a referência de cores/tipografia/tom de voz usada nestas sprints (pop-up de busca, tooltip de preço, entorno dos botões, reaproveitamento do `--amber` como cor de atenção na Sprint 28) | Já feita |
| `backend-conventions` | já existe | Referência obrigatória para a Sprint 29 (5 scrapers novos) — contrato `ScraperBase`, ordem de extração JSON-LD→meta→CSS→JS e registro no dict `SCRAPERS` | Já feita — primeira vez que a V3/V4 realmente precisa dela |
| `db-migrations` | sugerida na Sprint 31 | A V3/V4 até aqui não mexia em schema/RLS; a Sprint 31 precisou de uma policy nova (`produtos_insert_admin`) e é fácil esquecer de rodar a migração manual antes de testar — uma skill/checklist "toda sprint com arquivo em `project/migrations/` precisa do usuário confirmar que já rodou no SQL Editor antes de dar a tarefa por concluída" evitaria esse ponto cego | Média |
| `scraper-nova-loja` | sugerida desde a `sprint_v2.md` (S1/S4), nunca criada | Andaime para nova loja: gerar a subclasse de `ScraperBase`, o esqueleto de `_aguardar_preco`/`extrair_dados` e o registro no dict `SCRAPERS` — útil agora que a Sprint 29 pede **5 lojas de uma vez** | Alta (recomendada antes de iniciar a Sprint 29) |
