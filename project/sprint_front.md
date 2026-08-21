# PROTOCOL FPS — Sprint Front — Redesign do Dashboard em 3 fases

> Documento de **planejamento de UI/UX** — atualizado em **16/07/2026** com a
> **direção definida pelo usuário**: evoluir o Dashboard em 3 fases de esforço
> crescente — (1) ajustes de hierarquia mantendo o layout, (2) layout dividido em
> duas colunas, (3) separação em abas/rotas. As ideias da primeira versão deste
> documento que não entraram nas fases foram preservadas no **Backlog** ao final.
>
> ⚠️ **Este arquivo NÃO substitui o `todo`** (que segue como fonte da verdade do
> planejamento). As fases escolhidas devem ser copiadas para o `todo` (seção V2 ou
> uma futura V3) para entrarem no fluxo normal do `sprint-planner`. Todas as tarefas
> estão como ⬜ **Todo** — a coluna RESULTS descreve o resultado **esperado**.
>
> 🚫 **Regra de trabalho:** nenhum commit deste trabalho é feito automaticamente —
> commits **somente quando o usuário mandar**.
>
> Relação com o plano vigente: a Sprint 16 do `todo` (linha 144 — refino dos cards do
> topo e dos Alertas recentes) é **absorvida pela Fase 1** (KPI hero) e pela
> **Fase 2** (Alertas migram para a sidebar); decidir juntas para não retrabalhar.

---

## Diagnóstico — por que a tela hoje fica confusa

1. **Os 4 KPIs do topo têm o mesmo peso visual do resto** — nada diz "olhe aqui
   primeiro"; a tabela ocupa quase tudo sem respiro.
2. **Tudo é uma tabela única e plana** com 28+ itens, sem hierarquia; a célula de
   Preço carrega até 4 linhas de texto (preço, `meta:`, `★ menor:`, timestamp).
3. **A toolbar tem até 4 fileiras de controles** (busca+coletar / usuários /
   categorias / lojas+ordenação+dia) — ~20 botões visíveis o tempo todo.
4. **Os Alertas recentes ficam "enterrados"** abaixo da tabela — o conteúdo mais
   acionável da tela é o que menos se vê.
5. **Não há visão de saúde da coleta** — última coleta é um card estático; próxima
   coleta, situação por loja e logs só olhando o GitHub Actions.

---

## Visão geral das fases

| Fase | Tema | Esforço | Ataca |
|------|------|---------|-------|
| **Fase 1** ↩ | Ajustes de hierarquia: KPI hero + HUD de status + filtros em barra única — implementada e **revertida** em 16/07 (reset geral ao original) | Leve (mantém layout) | 1, 3, 5 |
| **Fase 2** ↩ | Layout dividido: tabela em foco + sidebar (alertas, top quedas, tendência) — implementada e **revertida** em 16/07 por decisão do usuário | Média | 2, 4 |
| **Fase 3** ↩ | Abas/rotas: Overview · Watchlist · Histórico · Coletas — implementada e **revertida** em 16/07 por decisão do usuário | Alta | 2, 3, 5 |
| Backlog | Linha compacta, cards/mobile, sinal visual (Δ%, sparkline), fixar produto | — | 2 |

As fases são **incrementais**: a Fase 1 vale sozinha; a Fase 2 reaproveita os blocos
da Fase 1 (HUD e KPIs viram o topo das duas colunas); a Fase 3 redistribui os mesmos
blocos entre rotas — nada construído antes é jogado fora.

---

## Fase 1 — Ajustes de hierarquia (mudança leve, mantém layout)

Foco: dizer ao olho **o que importa primeiro**, sem mexer na estrutura da página.
Nenhuma query nova além do que o Dashboard já carrega.

**Mockup — topo da página:**

```
┌ HUD ──────────────────────────────────────────────────────────────────────────┐
│ ● ÚLTIMA COLETA 09:04 · 16/07   ◔ PRÓXIMA ~09:00 amanhã   LOJAS: ●KaBuM ●Terabyte ◐Pichau │
└────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────┐  ┌───────────┐ ┌───────────┐ ┌───────────┐
│  MENOR PREÇO HOJE            │  │ MONITORA- │ │ ABAIXO DA │ │ ECONOMIA  │
│  R$ 3.699,99                 │  │ DOS: 28   │ │ META: 3   │ │ R$ 412,00 │
│  Ryzen 7 9800X3D · TERABYTE  │  └───────────┘ └───────────┘ └───────────┘
│  ▼ 3,4% vs. ontem            │        (chips secundários, clicáveis)
└──────────────────────────────┘
┌ ⌕ Buscar…            ┐ [◇ FILTROS (2)] [↕ Preço Atual ↓] [⚡ COLETAR FILTRADOS]
   ⟨ GPU ✕ ⟩ ⟨ KaBuM ✕ ⟩ ⟨ limpar tudo ⟩                       8 de 28 produtos
```

> ↩ **Fase 1 implementada em 16/07/2026 e revertida no mesmo dia**, no reset
> geral ao código original pedido pelo usuário (pull da main + descarte das
> alterações locais). Antes da reversão havia sido validada: build Vite OK e
> E2E visual real (desktop 1440px, painel de filtros, chips e mobile 420px
> por screenshot). Os RESULTS abaixo ficam como registro de COMO foi feita,
> caso queira reaplicar no futuro.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| Fase 1 · KPI hero + KPIs secundários | O topo mostra 1 card grande com a métrica principal e os outros 3 como chips menores ao lado; em <700px o hero empilha sobre os chips | ↩ Revertida | **Implementado (16/07/2026):** hero = "Menor preço hoje" (valor em 2.9rem com glow + nome do produto e loja); chips = Monitorados, Abaixo da meta (âmbar) e **Economia** (nova métrica: Σ `meta − preço atual` dos itens abaixo da meta, 100% client-side; mostra "—" quando nada bateu a meta). O card "Última coleta" saiu dos KPIs e virou item do HUD. <700px vira coluna única; <480px os chips empilham. Absorve parte da Sprint 16 do `todo` (linha 144) |
| Fase 1 · HUD de status fixo no topo | Barra fina e fixa (sticky) estilo HUD de jogo mostrando: última coleta (dado atual), **próxima coleta** (calculada do cron diário 12:00 UTC / 09:00 BRT) e um **semáforo por loja** com indicador pulsante verde/amarelo/vermelho | ↩ Revertida | **Implementado (16/07/2026):** `.hud-bar` sticky logo abaixo do header global (offset medido via `offsetHeight` do header, recalculado no resize); última coleta com dot de frescor + "◔ Próxima ~09:00 hoje/amanhã" (calculada do cron 12:00 UTC; tooltip avisa que disparo manual não entra); semáforo por loja derivado da leitura mais recente dos itens monitorados — 🟢 <26h · 🟡 26–50h · 🔴 >50h (dots pulsam com o keyframe `pulse` do tema, cadência maior quanto pior). **Pichau vira ◐ "(manual)"** fora do frescor, com tooltip explicando o bloqueio de datacenter; loja sem item monitorado fica cinza. E2E real: KaBuM 🟢, Terabyte 🔴 (>50h de fato) e Pichau ◐ — sinais honestos contra o banco |
| Fase 1 · Filtros agrupados em barra única | As 3 fileiras de filtros (Usuários / Categorias / Lojas+dia) colapsam numa barra única: busca + botão ◇ FILTROS (painel/drawer com tudo, contador de ativos) + dropdown de ordenação + COLETAR; filtros ativos viram **chips removíveis** (✕) com "limpar tudo" | ↩ Revertida | **Implementado (16/07/2026):** linha única = busca + ◇ FILTROS (N) + dropdown de ordenação (5 critérios + botão ↑/↓, mesmos `sortCampo`/`sortDir`) + COLETAR; painel colapsável com as fileiras Categoria / Loja (+produto) / ◈ Usuário (só admin) / Dia de coleta — **mesmos states de sempre, `escopoColeta()` intocado**. Chips removíveis por filtro + "limpar tudo" (só com 2+), contagem "X de Y" na linha dos chips. E2E real: GPU+KaBuM → FILTROS (2), 2 chips, botão virou COLETAR FILTRADOS, "0 de 27" correto (não há GPUs na KaBuM); remover o chip GPU recalculou para "24 de 27" na hora |

---

## Fase 2 — Layout dividido (mudança média)

Foco: a tabela vira o **palco principal** e o contexto acionável (alertas, quedas,
tendência) ganha morada fixa numa **sidebar direita** — em vez de ficar enterrado
abaixo da dobra.

**Mockup:**

```
┌ HUD (Fase 1) ──────────────────────────────────────────────────┐
├──────────────────────────────────────────┬─────────────────────┤
│  KPI hero + chips (Fase 1)               │  ◆ ALERTAS ATIVOS   │
│  ⌕ busca · ◇ filtros · ⚡ coletar         │  ↓META Ryzen 9800X3D│
│ ┌──────────────────────────────────────┐ │  ↓META RX 9070 XT   │
│ │  Tabela de produtos                  │ │  ─────────────────  │
│ │  (foco principal, mais respiro)      │ │  ▼ TOP QUEDAS 24H   │
│ │                                      │ │  1. Fury 32GB  ▼8,0%│
│ │                                      │ │  2. B650M      ▼4,2%│
│ │                                      │ │  ...top 5           │
│ │                                      │ │  ─────────────────  │
│ │                                      │ │  ~ TENDÊNCIA GERAL  │
│ │                                      │ │  ▁▂▂▃▂▄▃▂ (7 dias)  │
│ └──────────────────────────────────────┘ │                     │
└──────────────────────────────────────────┴─────────────────────┘
```

> ↩ **Fase 2 implementada e REVERTIDA em 16/07/2026** por decisão do usuário
> ("Volte para o Modelo da Fase 1") — o código saiu do working tree e o
> Dashboard voltou ao estado exato do fim da Fase 1 (bundle byte-idêntico).
> Antes da reversão ela havia sido validada: build OK e 2 E2E reais (sidebar
> com blocos honestos, tooltip da tendência "14/07 · índice 99.4", queda de
> 20,1% exata com item de teste, clique → scroll + flash, toast fora do
> recorte). Os RESULTS abaixo ficam como registro de COMO foi feito, caso
> queira reaplicar no futuro.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| Fase 2 · Grid de duas colunas | Dashboard vira grid `tabela (flex) + sidebar (~300–340px)`; em <1100px a sidebar desce para baixo da tabela (uma coluna); nada da tabela atual muda de comportamento | ↩ Revertida | **Implementado (16/07/2026):** `.dash-main` virou grid `minmax(0,1fr) + 320px` (o `minmax(0,…)` preserva o scroll horizontal interno da tabela); <1100px colapsa em coluna única com a sidebar depois da tabela. A seção "Alertas recentes" saiu de baixo da tabela e virou bloco da sidebar — parte da Sprint 16 do `todo` resolvida aqui. E2E: screenshot 1440px (duas colunas) e 1000px full-page (uma coluna) conferidos |
| Fase 2 · Sidebar: Alertas ativos | Bloco 1 lista os produtos **abaixo da meta agora** (array `abaixoMeta` já calculado) + os alertas disparados hoje (query atual de `alertas`); clicar num alerta rola até o item na tabela e o destaca (mesmo flash verde do histórico, Sprint 10) | ↩ Revertida | **Implementado (16/07/2026):** dois blocos — "◆ Abaixo da meta agora" (do `abaixoMeta`, com preço × meta) e "⚡ Alertas de hoje" (query atual + `item_id` no select para o clique); `irParaItem()` rola até a linha (`prod-row-<id>`) com o flash `hgFlash` reaproveitado; **item fora do recorte filtrado mostra toast explicativo** em vez de falhar em silêncio. E2E: clique rolou e destacou a linha certa; toast conferido com busca ativa |
| Fase 2 · Sidebar: Top 5 quedas 24h | Bloco 2 lista as 5 maiores quedas percentuais nas últimas 24h (comparando as 2 leituras mais recentes de cada item dentro da janela), com ▼% e preço; clicar rola/destaca na tabela | ↩ Revertida | **Implementado (16/07/2026):** terceiro embed aliased `anterior:historico_precos` (`preco > 0` + order desc + `limit(2)` — as 2 leituras COM PREÇO mais recentes), no padrão validado de `ultima`/`minimo`, sem baixar o histórico inteiro; queda = última leitura ≤24h vs. a anterior (mesma semântica do alerta `queda_preco`), ranking client-side top 5. E2E com item de teste (R$ 100 há 26h → R$ 79,90 há 1h): exibiu **▼ 20,1%** — matemática exata |
| Fase 2 · Sidebar: mini-gráfico de tendência geral | Bloco 3 mostra um sparkline de 7 dias da tendência da carteira; tooltip com o valor por dia | ↩ Revertida | **Implementado (16/07/2026):** **métrica escolhida = índice base 100 da carteira monitorada** (variante da candidata (a)): último preço de cada item por dia BRT com carry-forward; cada item entra valendo 100 no 1º dia com leitura — composição estável mesmo com dias sem coleta. Dados: leituras dos últimos 7 dias em busca paginada de 1000 (`preco > 0`), 1×/sessão. Componente `TendenciaGeral` em SVG puro (linha de referência "base 100" tracejada, hover com tooltip `dd/mm · índice · n itens`); como preço caindo é BOM, a linha fica **verde ≤100 e vermelha >100**. E2E: tooltip real "14/07 · índice 99.4 (12 itens)"; nos 1000px a linha apareceu vermelha (preços acima da base — sinal honesto) |

---

## Fase 3 — Separar em abas/rotas

Foco: quando o Dashboard acumular coisa demais para uma página, redistribuir os
blocos (já construídos nas Fases 1–2) em **4 rotas** no `BrowserRouter` do `App.jsx`,
com entradas no `NavDrawer`:

```
◈ Overview   — KPIs (hero + chips) + HUD + alertas + gráfico geral
▤ Watchlist  — a tabela atual, com espaço total para filtros/ordenação
~ Histórico  — gráficos por produto, comparativo entre lojas
⚙ Coletas    — status do scraper, logs, agendamento
```

> ↩ **Fase 3 implementada e REVERTIDA em 16/07/2026** por decisão do usuário
> ("Volte para o Modelo da Fase 1") — as 4 rotas, os módulos compartilhados
> (`hooks/useMonitor.js`, `utils/monitor.js`, `HudColeta`/`SidebarContexto`/
> `SiteFooter`), o endpoint `/api/coleta-status` (Flask × Vercel) e as
> mudanças em `App.jsx`/`NavDrawer.jsx`/`CLAUDE.md` foram removidos;
> `Dashboard.jsx` voltou como página única. Antes da reversão havia sido
> validada por E2E real (4 rotas, deep-links `?cat`/`?item`, comparativo com
> 2 séries, 15 runs reais do GitHub, modais intactos). Os RESULTS abaixo
> ficam como registro de COMO foi feito, caso queira reaplicar no futuro.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| Fase 3 · Rota **Overview** (`/`) | Página de abertura só com HUD, KPI hero + chips, alertas ativos, top quedas e o gráfico de tendência; qualquer clique em item/alerta leva à Watchlist já filtrada/destacada | ↩ Revertida | **Implementado (16/07/2026):** `Overview.jsx` = HUD + KPI hero/chips (Fase 1) + os 4 blocos de contexto (Fase 2) em **grade** responsiva (`SidebarContexto layout="grade"`); clique em qualquer item navega para `/watchlist?item=<id>`; botão "▤ Abrir watchlist →" no cabeçalho. E2E: screenshot 1440px conferido |
| Fase 3 · Rota **Watchlist** (`/watchlist`) | A tabela atual em página própria, com a toolbar de filtros da Fase 1 em largura total; aceita query-params de filtro (ex.: `?cat=GPU&loja=kabum`) para os links vindos do Overview | ↩ Revertida | **Implementado (16/07/2026):** `Watchlist.jsx` (ex-Dashboard, transformado por script com marcadores + checagens de sobra) — tabela/toolbar/modais/coleta intactos; filtros inicializam de `?cat/?loja/?busca/?dia` (validados contra as listas) e `?item` rola/destaca a linha ao carregar. E2E real: `?cat=GPU` → FILTROS (1), chip GPU, "3 de 27"; `?item=<id real>` → 1 linha destacada com o nome exato; modais Histórico/Opções/Meta e confirm do COLETAR (27 itens) conferidos após a transformação |
| Fase 3 · Rota **Histórico** (`/historico`) | Página com seletor de produto → gráfico grande (o `GraficoHistorico` atual em versão página, não modal) e **comparativo entre lojas** (sobrepor séries de 2+ itens no mesmo plot) | ↩ Revertida | **Implementado (16/07/2026)** com a recomendação registrada: **comparação MANUAL, sem mudança de banco** — busca + lista com checkboxes (até 4 itens, cor por série), novo `GraficoComparativo` (SVG puro) sobrepõe as séries em R$ absoluto com legenda removível, crosshair no tempo com tooltip por série e mini-stats (atual/★ menor/nº leituras/loja); histórico completo paginado em 1000 com **cache por item na sessão**; eixo Y clampado em R$ 0 (séries de escalas muito diferentes empurravam o mínimo para negativo). E2E real: 2 séries (53 × 371 leituras) sobrepostas, 2 chips de legenda, 2 stats |
| Fase 3 · Rota **Coletas** (`/coletas`) | Página admin-friendly com: agendamento (cron diário 12:00 UTC/09:00 BRT — leitura), lista das últimas execuções do workflow (status ✓/✗, duração, escopo, link para o log no GitHub) e o botão de disparo | ↩ Revertida | **Implementado (16/07/2026):** HUD + card Agendamento (09:00 BRT, próxima execução, nota de que o cron é arquivo versionado — fora da UI, como planejado) + card Disparo manual (semântica Sprint 9: normal → `user_id`, admin → completa; ConfirmModal com contagem) + Últimas execuções via **novo endpoint `/api/coleta-status`** em paridade Flask (`app.py`) × Vercel (`api/coleta-status.js`), GET read-only, `GITHUB_TOKEN` só no servidor, 15 runs com ✓/✗/●, evento agendada/manual, branch, duração e link "log ↗". E2E real: endpoint respondeu `ok · 15 runs` (mais recente #110 schedule success) e a tela listou os 15 |

---

## Backlog — ideias complementares (da 1ª versão deste documento)

Continuam válidas e compatíveis com as 3 fases; entram se/quando o usuário quiser:

| Ideia | Resumo | Encaixe natural |
|-------|--------|-----------------|
| Linha compacta expansível | Linha fechada só com nome/loja/preço/status/⋯; meta, ★ menor, timestamp e ações aparecem ao expandir | Watchlist (Fase 3) ou direto na tabela atual |
| Grupos por categoria + pausados recolhidos | Seções colapsáveis por categoria; itens OFF num grupo "Pausados (N)" colapsado | Watchlist |
| Paginação de render | Fatiar só a renderização (25/50/100) — **nunca** o array filtrado, que alimenta o COLETAR FILTRADOS | Watchlist |
| Visão em cards + mobile | Toggle tabela ↔ grade de cards; em <700px cards viram o único modo (fim do scroll horizontal) | Watchlist |
| Δ% na linha + barra menor—atual—meta | Sinal visual por item (reusa o embed `anterior` da Fase 2); micro-barra substitui as linhas de texto `meta:`/`★ menor:` | Watchlist |
| Sparkline por item (sob demanda) | Mini-gráfico 30d ao expandir a linha, com cache por `item_id`; clique abre o histórico completo | Watchlist / Histórico |
| Fixar produto no topo (⭐) | Opção no menu ⋯; fixados vêm antes em qualquer ordenação (`localStorage`) | Watchlist |
| Presets de filtro | Salvar conjuntos de filtros nomeados em `localStorage` ("GPUs Kabum") | Toolbar da Fase 1 |

---

## Notas técnicas transversais

- **Teto de 1000 linhas do PostgREST (Sprints 8/10):** dado novo por item só via
  **embed aliased com `limit` próprio** (padrão `ultima`/`minimo`) ou **fetch sob
  demanda paginado**. Fase 2 (embed `anterior`, tendência 7d) é a mais exposta.
- **`escopoColeta()` depende de `dadosFiltrados`:** o COLETAR FILTRADOS (Sprint 14)
  envia os `item_ids` monitorados do recorte visível. Toolbar nova (Fase 1), grid
  (Fase 2) e a rota Watchlist (Fase 3) **não podem** alterar o array filtrado — só a
  forma de renderizá-lo/posicioná-lo. Teste de regressão nº 1 de todas as fases.
- **Novo endpoint = paridade dupla:** `/api/coleta-status` (Fase 3) nasce nas DUAS
  implementações (Flask `app.py` + Vercel `api/coleta-status.js`), com `GITHUB_TOKEN`
  só no servidor — mesma regra de segurança dos endpoints atuais (nunca `VITE_`).
- **Pichau no semáforo (Fase 1):** a loja só coleta local (decisão registrada) —
  o HUD deve mostrar estado próprio ("manual"/◐), não vermelho permanente, para o
  semáforo não virar ruído.
- **Persistência local:** chaves `fps_*` em `localStorage` (precedente do
  `useAutoLogout`: `fps_ultima_atividade`) para visão, grupos, presets.
- **Tema e componentes:** manter o visual atual (mono/verde/âmbar, CSS local via
  `const css`); reaproveitar `OpcoesModal`, `ConfirmModal`, `GraficoHistorico` e o
  padrão de flash/scroll (`destaque`). **Sem lib nova** — SVG puro como na Sprint 10.
- **Rotas novas (Fase 3):** registrar no `BrowserRouter` do `App.jsx` e no
  `NavDrawer`; conferir que o catch-all do Flask e o rewrite do Vercel continuam
  servindo o SPA nos deep-links (`/watchlist` etc.), como já fazem para `/conta`.
- **Fluxo de trabalho:** nenhum commit automático — **commits só quando o usuário
  mandar** (vale para todo o trabalho deste plano).

## Skills Futuras

- **dashboard-ui-review** — dado um screenshot ou build local, auditar a tela contra
  o diagnóstico deste documento (peso dos KPIs, fileiras de toolbar, posição dos
  alertas) e apontar regressões de hierarquia.
- **coleta-scope-regression** — checklist automatizado do invariante "COLETAR
  FILTRADOS = recorte inteiro visível" após qualquer mudança de renderização/rota da
  lista (toolbar nova, grid, Watchlist).
- **endpoint-parity** — ao criar/alterar endpoints server-side (ex.:
  `/api/coleta-status`), gerar e rodar a checagem de paridade Flask × Vercel
  (payloads e códigos de erro idênticos), como feito nas Sprints 9/11.
