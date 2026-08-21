# PROTOCOL FPS — Planejamento de Sprints — V3 ✅ CONCLUÍDA (18/08/2026)

> Relatório gerado a partir da seção **V3** do arquivo `todo` (raiz do repositório).
> Data de geração: **18/08/2026**. **V3 concluída no mesmo dia** — ver seção
> "V3 concluída" ao final do documento para o porquê de ter saído tão mais rápido
> que os 21 dias úteis estimados no cronograma abaixo (mantido como registro
> histórico do planejamento original). A V3 nasce de um pedido específico do usuário:
> reestruturar a página de Dashboard usando como referência de **organização de
> pastas/componentes** um protótipo gerado no Lovable (zip em
> `project/project-complete.zip`, extraído em `project/project-complete-extracted/`
> para análise), aplicando a **paleta de cores e o design system do próprio projeto**
> (`.claude/skills/frontend-design-system`) em cima dessa nova estrutura.
>
> **Decisões confirmadas com o usuário antes do planejamento:**
> 1. **Stack**: mantém 100% a stack atual (JS puro, CSS puro, react-router-dom,
>    Flask/Vercel) — NÃO adota TypeScript/Tailwind/shadcn/TanStack Start/Router do
>    protótipo. Só a organização de pastas/componentes é copiada; o protótipo em si
>    não entra no build.
> 2. **Dados**: tudo entra na mesma leva de sprints — a nova estrutura já nasce
>    ligada ao Supabase real (o protótipo usa dados 100% mockados), com paridade
>    completa das features atuais (filtros admin/dono, paginação de 1000 linhas,
>    trigger de coleta, remoção server-side).
> 3. **Substituição**: a rota `/` troca direto para a nova estrutura ao final da V3;
>    a `Dashboard.jsx` antiga é removida (não fica em paralelo).
>
> A numeração de sprints **continua de onde a V2 parou** (Sprint 16). A V3 **não**
> depende da Sprint 15 (`todo:136`, esgotado × não localizado — é mudança de
> scraper/back-end, roda em paralelo se quiser) mas **absorve a Sprint 16**
> (`todo:148`, refino dos cards do topo e dos Alertas recentes) — ela deixa de fazer
> sentido como sprint isolada porque a V3 reconstrói exatamente essa área do zero.
>
> **Relação com `project/sprint_front.md`:** aquele documento é um plano ANTERIOR de
> redesign (HUD + KPI hero + sidebar de alertas/quedas/tendência em 3 fases) que foi
> implementado e **revertido 3 vezes no mesmo dia (16/07/2026)** por decisão do
> usuário. A V3 é uma direção de design **diferente e independente** (baseada no
> protótipo Lovable, com sidebar de gráfico/coletas/detalhe do item em vez de
> alertas/quedas/tendência) — não reaproveita nem depende daquele plano revertido.
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
> - **RESULTS** — resultado esperado ao concluir
>
> 🚫 **Regra de trabalho:** nenhum commit é feito automaticamente — commits **somente
> quando o usuário mandar**.

---

## Visão geral do cronograma

| Sprint | Tema | Período | Dias | Itens |
|--------|------|---------|------|-------|
| 17 | Fundação: pastas + hooks | 19/08 – 21/08 | 3 | 2 |
| 18 | Tema visual: paleta + ícones | 24/08 – 25/08 | 2 | 1 |
| 19 | Tabela & ações | 26/08 – 31/08 (dias úteis) | 4 | 3 |
| 20 | Dialogs (ações, histórico, modal genérico) | 01/09 – 04/09 | 4 | 3 |
| 21 | Sidebar: gráfico, detalhe, coletas por dia | 07/09 – 11/09 | 5 | 4 |
| 22 | Fechamento: alertas, regressão, corte da versão antiga | 14/09 – 16/09 | 3 | 4 |

**Total: 21 dias úteis, 19/08 → 16/09/2026.** É a maior V do projeto até agora —
reescreve por completo o arquivo mais denso do frontend (`Dashboard.jsx`, ~1620
linhas) preservando cada feature já validada em produção.

---

## Sprint 17 — Fundação: estrutura de pastas & hooks (19/08 – 21/08)

Só reorganização e extração de lógica. **Nenhum comportamento muda** nesta sprint —
é o mesmo princípio que o próprio plano do protótipo descreveu para si mesmo
("a tela fica idêntica, é só reorganização de arquivos").

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S17 · Estrutura de pastas `src/pages/Dashboard/{index.jsx,components/,dialogs/}` + `src/hooks/` + `src/services/` + `src/utils/format.js` (todo:153) | Build Vite continua OK; app roda idêntico ao de hoje; nenhum arquivo passa de JS puro para TS, nenhum Tailwind/shadcn entra no `package.json` | ✅ Done | **Implementado (18/08/2026):** split mecânico em `components/{KpiRibbon,ControlBar,ProductTable}.jsx`, `dialogs/{ProductHistoryDialog(+GraficoHistorico),OpcoesModal,MetaModal,RenomearModal,CategoriaModal}.jsx`, `Dashboard.constants.js`, `services/dashboard.service.js`, `utils/format.js`. Desvio consciente do plano original: **não** foram criados `Header.jsx`/`ActionBar.jsx`/`Sidebar.jsx` (mantido `AppHeader.jsx` global; ActionBar/Sidebar são conceitos novos sem equivalente hoje, ficam para as Sprints 19/21). CSS mantido único em `index.jsx` por segurança nesta sprint. **Testado ao vivo** com `npm run dev` + Chrome na sessão real logada do usuário: build 102 módulos OK (era 87-88 no arquivo único), zero erros de console, KPIs/toolbar/filtros/ordenação/modais/alertas conferidos idênticos ao original |
| S17 · Hooks `useClock`, `useDashboardFilters`, `useProductSelection` (todo:155) | `useDashboardFilters` continua resolvendo `itensDoDia` via Supabase paginado (não mock); `useProductSelection` navega a lista visível com ↑/↓, abre histórico com Enter, limpa seleção com Esc, e ignora teclas quando o foco está em input/textarea ou um modal está aberto | ✅ Done | **Implementado (18/08/2026):** `useClock` extraído e também adotado pelo `AppHeader.jsx` (antes tinha o próprio estado/efeito duplicado); `useDashboardFilters` com toda a lógica de filtro/ordenação, comportamento validado ao vivo; `useProductSelection` criado e funcional, mas **ainda sem consumidor** — passa a ser usado na Sprint 19 pelo `ProductTable`/`ActionBar`. Bônus: removido o estado `busca`/`setBusca`, código morto já no arquivo original (nunca lido em lugar nenhum) |

---

## Sprint 18 — Tema visual: paleta de cores & ícones (24/08 – 25/08)

O pedido central do usuário: aplicar o design system do projeto por cima da
estrutura nova, antes de portar os componentes visuais em si.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S18 · Substituir a paleta do protótipo pelos tokens de `theme.css` e trocar ícones lucide-react por glifos Unicode (todo:157) | Nenhuma cor fora dos tokens `--bg/--green/--amber/--red/--blue/--text*/--border*`; nenhum import de `lucide-react` sobrevive; fontes seguem `--mono` (corpo) / `--display` (headings/valores em destaque), igual ao resto do app | ✅ Done | **Implementado (18/08/2026):** como a Sprint 17 portou o **código real** (já themado) em vez do código do protótipo, a nova estrutura nasceu 100% nos tokens certos e sem nenhum import de `lucide-react` — auditoria por `grep` em todo `src/` confirmou. Único ponto fora do padrão encontrado, **pré-existente e sem relação com o protótipo**: a cor ad-hoc `#37c8ff` da badge de dono (visão admin, `.filter-btn-user.active`/`.prod-dono`) — consolidada para `var(--blue)`, o mesmo token usado desde a Sprint 13. Build + teste visual ao vivo OK |

---

## Sprint 19 — Tabela & ações (26/08 – 31/08, dias úteis)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S19 · `KpiRibbon` com fórmulas reais (todo:159) | Os 4 cards batem com o banco real: Itens monitorados, Abaixo da meta ("de N com meta definida"), Menor preço hoje (com nome do produto), Última coleta com hora/data reais — nada de "HÁ 42S" fixo | ✅ Done | **Já entregue na Sprint 17** — o componente foi construído a partir da lógica real do Dashboard.jsx desde o primeiro split, nunca teve o valor mockado do protótipo. Confirmado ao vivo: os 4 cards batem com o banco real |
| S19 · `ProductTable` com seleção de linha (todo:161) | Clicar/navegar até uma linha destaca ela; a tabela mantém tudo que o protótipo não tem: link clicável do produto, badge de dono (admin), ★ menor preço com tooltip de data, timestamp da última coleta | ✅ Done | **Implementado (18/08/2026):** linha clicável seleciona (destaque `--green-soft` + borda esquerda verde), `useProductSelection` ligado (↑/↓ navega, Enter abre histórico, Esc limpa — desabilitado enquanto qualquer modal está aberto); coluna "Ações" removida, larguras redistribuídas (Produto 50%/Loja 17%/Preço 20%/Status 13%). Link do produto usa `stopPropagation` para não disparar seleção junto da abertura em nova aba. **Testado ao vivo:** seleção por clique e teclado, digitação na busca sem conflito com as teclas de navegação, zero erros de console |
| S19 · `ActionBar` sobre o item selecionado (todo:163) | Histórico/Opções/Remover operam sobre a seleção global em vez de 3 botões por linha; sem seleção, a barra fica desabilitada com o texto "SELECIONE UM ITEM..." | ✅ Done | **Implementado (18/08/2026):** novo `components/ActionBar.jsx` — sem seleção mostra "Selecione um item da tabela" com os 3 botões desabilitados; com seleção mostra o nome do item e habilita Histórico/Opções/Remover. **Mudança de paradigma de UX confirmada e adotada** (modelo do protótipo); Remover continua chamando `opcRemover` → `/api/remover` (server-side, SERVICE_KEY) — nenhuma lógica de remoção mudou, só quem a aciona. Regressão do COLETAR FILTRADOS reconferida ao vivo (filtro por busca "ryzen" → "1 de 33", botão "COLETAR FILTRADOS" correto) |

---

## Sprint 20 — Dialogs: ações, histórico, modal genérico (01/09 – 04/09)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S20 · `TerminalModal` genérico (foco preso + Esc) (todo:179) | Tab/Shift+Tab não escapa do modal aberto; Esc fecha qualquer modal — feature nova, nenhum modal atual tem isso hoje | ✅ Done | **Implementado (18/08/2026):** `components/TerminalModal.jsx` — foco preso (Tab/Shift+Tab cicla dentro do modal) + Esc fecha; mantém `overlayClassName`/`className` por props para reusar exatamente as classes CSS de cada modal (`.modal-overlay`/`.opcoes-overlay`/`.meta-modal-overlay`), sem re-estilizar nada. **Testado ao vivo:** 6 Tabs num menu de 6 elementos focáveis voltou exatamente ao primeiro (`✕`) — wrap-around correto; Esc fecha `ProductActionsDialog` e `ProductHistoryDialog` |
| S20 · `ProductActionsDialog` consolidado (todo:165) | Editar meta, Alterar nome, Alterar categoria, Coletar agora (pontual) e Ativar/Desativar continuam gravando no banco exatamente como hoje | ✅ Done | **Implementado (18/08/2026):** `dialogs/ProductActionsDialog.jsx` com estado `modo` (menu/meta/nome/categoria) — os 4 modais antigos (`OpcoesModal`+`MetaModal`+`RenomearModal`+`CategoriaModal`) foram removidos; `index.jsx` reduzido a um único `acoesItem` no lugar de 4 estados separados; sub-formulários resetados por `useEffect` ao entrar em cada modo; sempre reabre no menu (nunca "volta" pro menu ao cancelar — igual ao comportamento original de sair inteiramente). **Testado ao vivo:** meta pré-preenchida com o valor real + sugestões corretas, cancelar/Esc fecha tudo, reabrir volta ao menu, zero erros de console |
| S20 · `ProductHistoryDialog` com remoção em massa preservada (todo:167) | Gráfico + lista completa paginada (1000 em 1000) idênticos a hoje; seleção múltipla + "Remover selecionados" com confirmação inline continuam funcionando via `/api/remover` | ✅ Done | **Já entregue na Sprint 17** — renomeado de `HistoricoModal` no próprio split mecânico, com a remoção em massa intacta (o protótipo não tinha essa feature, mas como aqui foi porte do código real, ela nunca saiu). Testado ao vivo abrindo o histórico de um item real (80 leituras, gráfico + seleção OK) |

---

## Sprint 21 — Sidebar: gráfico, detalhe do item, coletas por dia (07/09 – 11/09)

A sprint mais pesada — duas das quatro peças exigem lógica/consulta **nova**, não
só reorganização.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S21 · `PriceChartPanel` sempre visível (todo:169) | Selecionar qualquer linha da tabela atualiza o gráfico da sidebar sem abrir modal; "EXPANDIR" abre o `ProductHistoryDialog` completo | ✅ Done | **Implementado (18/08/2026):** `GraficoHistorico` extraído para arquivo próprio (compartilhado entre `ProductHistoryDialog` e o novo `PriceChartPanel`, sem duplicar código); layout `.dash-grid` novo (conteúdo + sidebar 320px sticky, colapsa em 1 coluna <1100px). **Não** adotou o `StepChart` do protótipo — mesmo estilo de gráfico do app inteiro. **Testado ao vivo:** placeholder sem seleção, atualização ao trocar de linha, "EXPANDIR" abre o histórico completo do mesmo item, zero erros numa carga a frio |
| S21 · `ItemDetailPanel` + decisão sobre o log de coleta (todo:171) | Painel mostra os campos do item selecionado (produto/loja/categoria/preço/meta+delta%/status/menor/última coleta); a área de "log" não exibe nenhum dado inventado | ✅ Done | **Decisão validada com o usuário (18/08/2026):** feed real em vez de mockado ou removido — nova `buscarAtividadeRecente()` traz as últimas leituras de `historico_precos` (join com item/loja), sem inventar nada. **Implementado:** `components/ItemDetailPanel.jsx` com resumo chave/valor + lista "Atividade recente" (atualiza a cada 60s). **Testado ao vivo:** delta da meta correto (+25,0% num item real), feed com leituras reais do banco, zero erros de console |
| S21 · `CollectionsPanel` (últimos N dias) (todo:173) | Lista os últimos 7 dias de coleta com contagem real de itens por dia (dia civil BRT); clicar num dia filtra a tabela, "⤢" abre o `CollectionDayDialog` | ✅ Done | **Implementado (18/08/2026):** nova `buscarColetasPorDia()` (agregação por dia civil BRT, paginada); clicar num dia aplica o **mesmo** `filtroDia` da toolbar — não é um filtro paralelo, é o mesmo estado do `useDashboardFilters`. Escopo reduzido como o plano já previa: "↻N atualizados" (variação dia a dia) ficou de fora. **Testado ao vivo:** contagens batendo com o banco, clique sincronizado com o date-picker da toolbar (mesma contagem "14 de 33" nos dois lugares) |
| S21 · `CollectionDayDialog` com variação % (todo:175) | Abrir um dia específico mostra os itens coletados naquele dia com preço e variação % vs. a leitura anterior | ✅ Done | **Implementado (18/08/2026):** nova `buscarDetalheDia()` — leituras do dia + a leitura imediatamente anterior de cada item (lote de queries pequenas e indexadas; catálogo pequeno, sem N+1 pesado). **Bug pego no teste ao vivo:** variação 0,0% aparecia em vermelho (deveria ser neutra) — corrigido antes de fechar a sprint. Validado com o cenário real de um item com +1,1% |

---

## Sprint 22 — Fechamento: alertas, footer, regressão & corte da versão antiga (14/09 – 16/09)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S22 · Seção "Alertas recentes" de volta (todo:177) | A lista dos alertas do dia (abaixo_meta/queda_preco) aparece na nova estrutura — o protótipo não tem nada equivalente, precisa ser desenhada manualmente no novo layout | ✅ Done | **Nunca chegou a sair** — como a Sprint 17 foi split incremental (não reescrita paralela), a seção ficou inline em `index.jsx` o tempo todo. Confirmado ao vivo o estado vazio "Nenhum alerta disparado hoje." e o footer junto. Resolve também o `todo:148` (Sprint 16 absorvida) |
| S22 · `TerminalFooter` + manter `NavDrawer.jsx` atual (todo:181) | Footer com o mesmo texto de hoje; menu lateral continua com rotas reais (`/`, `/novo-produto`, `/usuarios`, `/conta`) e logout real — **não** é substituído pela versão mockada do protótipo | ✅ Done | Footer real ficou inline em `index.jsx` desde a Sprint 17, idêntico ao original; `NavDrawer.jsx` não foi tocado, como decidido — continua com rotas reais e logout real |
| S22 · Regressão do invariante COLETAR FILTRADOS (todo:183) | Com qualquer combinação de filtros (categoria/loja/produto/usuário/busca/dia) + qualquer ordenação, "COLETAR FILTRADOS" dispara exatamente os `item_ids` monitorados do recorte visível — igual a hoje | ✅ Done | **Validado ao vivo (18/08/2026):** categoria GPU + loja Terabyte → "1 de 33" na tabela; confirmação mostrou "os itens da lista filtrada (categoria GPU + loja Terabyte)" e "1 item será coletado", batendo exatamente com a única linha visível. Cancelado sem disparar o workflow de verdade (ação real contra o GitHub Actions). `escopoColeta()` não foi tocado em nenhuma sprint da V3 — confirmado por leitura de código e por este teste |
| S22 · Remover `Dashboard.jsx` antigo e trocar a rota `/` (todo:185) | Rota `/` serve só a nova estrutura; nenhum import morto do arquivo antigo sobra no bundle; build de produção OK | ✅ Done | Como o split foi **incremental** — não uma reescrita paralela a trocar depois — o arquivo antigo já foi removido no mesmo passo da Sprint 17 e a rota `/` (`App.jsx`, `import "@/pages/Dashboard"`) já resolve para a nova estrutura sem nenhuma mudança de import necessária; `grep` confirmou zero referências ao arquivo antigo |

---

## Resumo por status

| Status | Qtde | Linhas do `todo` |
|--------|------|-------------------|
| ✅ Done | 17 | 153, 155, 157, 159, 161, 163, 165, 167, 169, 171, 173, 175, 177, 179, 181, 183, 185 |
| ⬜ Todo | 0 | — |
| 🟡 Pending | 0 | — |

## V3 concluída (18/08/2026)

As 6 sprints planejadas (17-22) foram implementadas e validadas ao vivo **no mesmo
dia** em que o plano foi aprovado — bem mais rápido que os 19 dias úteis
estimados originalmente, pelos motivos abaixo:

- A Sprint 17 reconstruiu cada arquivo a partir do **código real já existente**
  (não do protótipo mockado), então KPIs com fórmula real, paleta certa,
  `ProductHistoryDialog` com remoção em massa, seção de Alertas e o corte do
  arquivo antigo já nasceram corretos — sem trabalho extra dedicado nas
  Sprints 18/20/22 que os pressupunham.
- As mudanças de UX genuinamente novas (Sprint 19: seleção de linha + `ActionBar`;
  Sprint 20: `TerminalModal` + `ProductActionsDialog` consolidado; Sprint 21: os
  3 painéis da sidebar + `CollectionDayDialog`) foram implementadas, testadas ao
  vivo (build + `npm run dev` + Chrome na sessão real do usuário) e validadas uma
  a uma, sem acumular trabalho não verificado.
- A única decisão que o plano marcava como "em aberto" — o que substitui o log de
  scraping mockado do protótipo (Sprint 21) — foi levada ao usuário no momento
  certo: **feed real de atividade** (últimas leituras de `historico_precos`).
- A regressão final do invariante COLETAR FILTRADOS foi confirmada ao vivo com uma
  combinação de filtros (categoria + loja), sem ter sido quebrada em nenhum ponto.

**Bugs pegos e corrigidos durante os próprios testes ao vivo** (nenhum chegou a
ficar em produção): variação 0,0% aparecendo em vermelho no `CollectionDayDialog`
(Sprint 21); um processo Vite fantasma preso na porta 3000 entre sessões de teste
(ambiente, não código).

---

## Notas técnicas transversais

- **Nada de Tailwind/shadcn/TypeScript entra no projeto** — só a organização de
  pastas do protótipo é copiada; todo componente novo é `.jsx` + CSS local
  (`const css = \`...\`` no topo do arquivo), no mesmo padrão que `Dashboard.jsx`,
  `NovoProduto.jsx`, `Usuarios.jsx` e `Conta.jsx` já usam.
- **Teto de 1000 linhas do PostgREST** continua valendo para toda query nova desta
  V3 (`CollectionsPanel`, `CollectionDayDialog`) — usar embed aliased com `limit`
  próprio ou paginação por `.range()`, nunca uma busca sem teto.
- **`escopoColeta()` é intocável em lógica** — Sprint 22 existe justamente para
  travar isso antes do corte final da versão antiga.
- **Paridade de rota (Flask × Vercel)** não é afetada por esta V3 — nenhuma rota de
  API nova é criada; tudo aqui é reorganização de componentes React consumindo os
  mesmos endpoints/queries já existentes.
- **Maior risco da V3**: Sprint 19 (mudança de paradigma de ação por linha → ação
  sobre seleção global) e Sprint 21 (duas peças com consulta nova) — se o usuário
  quiser reduzir risco, dá pra fatiar cada uma dessas sprints ao meio.
- **Fluxo de trabalho:** nenhum commit automático — commits **somente quando o
  usuário mandar** (vale para todo o trabalho deste plano).

## Skills Futuras

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|------------------|----------|------------|
| `coleta-scope-regression` | S22 | Checklist automatizado do invariante "COLETAR FILTRADOS = recorte inteiro visível" após qualquer mudança de renderização/seleção da lista — já proposta em `sprint_front.md`, ainda não criada, e mais relevante do que nunca com a mudança de paradigma da Sprint 19 | Alta |
| `dashboard-selecao-teclado` | S17/S19 | Checklist de acessibilidade/UX para o novo modelo de seleção de linha + navegação por teclado (foco visível, não conflitar com inputs/modais, leitores de tela) | Média |
| `mock-to-real-parity` | S17–S21 | Ao portar qualquer componente de um protótipo/mock (Lovable ou outro), checklist para garantir que nenhuma função mockada (`buildHistory`, `buildCollections`, dados fixos tipo "HÁ 42S") sobrevive sem ser religada a uma fonte real antes do merge | Média |
| `frontend-design-system` | já existe | Continua a referência de cores/tipografia/tom de voz usada em toda a V3 (Sprint 18 em diante) | Já feita |
