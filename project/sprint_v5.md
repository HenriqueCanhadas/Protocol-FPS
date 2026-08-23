# PROTOCOL FPS — Planejamento de Sprints — V5

> Relatório gerado a partir da seção **V5** do arquivo `todo` (raiz do repositório).
> Data de geração: **23/08/2026** (Sprints 34 e 35 implementadas e validadas no
> mesmo dia).
>
> A V5 é a sequência atual, aberta logo após o fechamento da V4
> (`project/sprint_v4.md`, Sprints 23–33). Tem **3 itens**. Dois são correções
> pontuais sobre trabalho já entregue na V4 (Sprint 29 — 5 lojas novas), **ambos
> concluídos**: um bug de **filtro de loja** no Dashboard (`todo:225`, Sprint 34) e
> um bug de **extração de preço** no scraper da Logitec (`todo:227`, Sprint 35). O
> terceiro (`todo:229`) é uma **decisão em aberto** — o próprio item do `todo` diz
> "ainda irei pensar" — e por isso não tem escopo definido nesta sprint; per a
> skill `autonomous-execution`, uma decisão marcada como em aberto no próprio plano
> é um dos poucos pontos que exigem parar e perguntar ao usuário antes de
> implementar, então esta sprint fica registrada como **aguardando definição** em
> vez de ter um escopo inventado.
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
| 34 | Filtro de loja não encontra item já cadastrado na Tangle Teezer | 23/08/2026 | 1 | 1 |
| 35 | Scraper da Logitec captura o preço original em vez do preço com desconto | 23/08/2026 | 1 | 1 |
| 36 *(aguardando definição do usuário)* | Revisão do painel "▦ Visão geral" (KPIs da sidebar) | a definir | a definir | 1 |

**Sprints 34 e 35 concluídas** (23/08/2026, ambas validadas com dados reais — a
34 também ao vivo no navegador). A numeração continua de onde a Sprint 33 (V4)
parou. A Sprint 36 não tem escopo fechado — depende do usuário detalhar o que quer
mudar na "Visão geral" antes de qualquer código ser escrito.

---

## Sprint 34 — Filtro de loja não encontra item da Tangle Teezer (23/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S34 · Corrigir o filtro de loja para retornar itens cadastrados na Tangle Teezer, ex. "The Ultimate Detangler" (todo:225) | Com o filtro de loja = Tangle Teezer aplicado no Dashboard, o item "The Ultimate Detangler" (já cadastrado, registrado na Sprint 29 como prova de conceito da loja) aparece na lista filtrada e no select de "produto da loja"; o mesmo vale para qualquer outro item real dessa loja | ✅ Done | **Causa raiz encontrada:** `lojas.nome` da Tangle Teezer é `"Tangle Teezer"` — **com espaço**, único caso entre as 8 lojas (as demais são uma palavra só: Kabum, Pichau, Terabyteshop, Tuyo, Playstation, Logitec, Amazon). `useDashboardFilters.js` filtrava loja com `x.loja.toLowerCase().includes(filtroLoja)`, comparando direto contra a `key` de `LOJAS_FILTER` (sem espaço, ex. `"tangleteezer"`); `"tangle teezer"` (com espaço) nunca contém `"tangleteezer"` (sem espaço) como substring, então o filtro de loja **e** o filtro "produto da loja" (`produtosDaLoja`, mesma comparação) excluíam 100% dos itens da Tangle Teezer, mesmo com o item corretamente cadastrado no banco (slug certo em `itens`/`lojas`, nada errado no dado). **Corrigido:** nova função `slugLoja()` em `useDashboardFilters.js` — mesma normalização (minúsculas, sem espaços) já usada no back-end por `_slug_loja()` (`main.py:184`) — aplicada nos dois pontos de comparação (`dadosFiltrados` e `produtosDaLoja`); a busca livre por texto (`termoBusca`, linha separada) não foi alterada, pois ali o espaço é esperado (usuário pode digitar "tangle teezer" normalmente). `npm run build` — 111 módulos, sem erros. **Validado ao vivo no navegador** (Chrome, extensão conectada, `npm run dev` local com a sessão real logada por você): antes do fix, o filtro "Tangle Teezer" ficava sem confirmação possível; depois do fix, selecionar "Tangle Teezer" no filtro de loja mostrou exatamente **1 resultado — "The Ultimate Detangler" (R$ 128,00)** — e o select "Produto" ao lado passou a listar os produtos da loja também. Testado em seguida o filtro "Logitec" (sem regressão — mostrou "Logitech G PRO X2 SUPERSTRIKE" normalmente) para confirmar que a normalização nova não quebrou as outras 7 lojas. Zero erros novos no console (só o warning pré-existente de múltiplas instâncias do GoTrueClient) |

---

## Sprint 35 — Scraper da Logitec pega o preço original, não o com desconto (23/08/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S35 · Ajustar `scrapers/logitec.py` para extrair o preço com desconto (R$ 1.019,92) em vez do preço de referência (R$ 1.199,90) (todo:227) | `LogitecScraper(headless=True).coletar(url)` retorna `preco` igual ao valor efetivamente pago (o preço com desconto exibido na página), não o preço "de tabela"/original | ✅ Done — **validado com dados reais** | **Causa raiz confirmada por inspeção ao vivo da página real** (`https://www.logitechstore.com.br/mouse-logitech-g-pro-x2-superstrike/...`, mesmo link de teste da Sprint 29): o R$ 1.019,92 é o desconto "à vista no Pix" (15%), marcado no HTML como `<div class="in_cash-price-box" data-discount="15" itemprop="offers" ...>` com seu próprio `<meta itemprop="price" content="1019.915">` e `<span class="price">R$ 1.019,92</span>`. A Sprint 29 (V4) já tinha visto esse elemento durante a inspeção original mas classificou deliberadamente como "promocional, não usar" — decisão que este item do `todo` (V5) pede para reverter: o usuário quer monitorado o preço que ele efetivamente paga. **Implementado:** novo seletor `SELETOR_PRECO_PIX = ".in_cash-price-box .price"` e método `_extrair_preco_pix()` em `scrapers/logitec.py`, chamado **primeiro** na cadeia de `extrair_dados()` — antes do JSON-LD/meta/CSS já existentes, que continuam como fallback para produtos sem desconto Pix (a maioria dos outros — o `.in_cash-price-box` é uma promoção, não universal). Docstring do módulo atualizada explicando a mudança de decisão entre as duas sprints. **Validado com dado real:** `LogitecScraper(headless=True).coletar(url)` → `DadosProduto(nome='Mouse Gamer Sem Fio Logitech G PRO X2 SUPERSTRIKE LIGHTSPEED', preco=1019.92, disponivel=True, ...)` — batendo exatamente com o valor reportado pelo usuário. `py_compile` OK |

**Nota:** a leitura já existente no banco para este item (`historico_precos`) continua com o valor antigo (R$ 1.199,90) até a próxima coleta rodar com o scraper corrigido — nenhuma leitura histórica foi reescrita, coerente com o resto do projeto (o coletor só grava, nunca corrige retroativamente).

---

## Sprint 36 — Revisão do "▦ Visão geral" (aguardando definição do usuário)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S36 · Ajustar o painel "▦ Visão geral" (KPIs — Itens monitorados / Abaixo da meta / Menor preço hoje / Última coleta) para mostrar só o que o usuário realmente considera útil (todo:229) | — (sem critério de aceite definido; o próprio item do `todo` diz "ainda irei pensar") | ⬜ Todo | **Sem escopo definido.** O item do `todo` é explicitamente uma nota do usuário para si mesmo ("ainda irei pensar"), não um pedido fechado. Antes de iniciar esta sprint é preciso perguntar ao usuário quais dos 4 KPIs atuais (`KpiRibbon`/`.kpi-panel`, sidebar) ele quer manter, remover ou substituir — não inventar um novo conjunto de métricas sem essa definição |

---

## Resumo por status

| Status | Qtde | Linhas do `todo` |
|--------|------|-------------------|
| ✅ Done | 2 | 225, 227 |
| ⬜ Todo | 1 | 229 |
| 🟡 Pending | 0 | — |

## Skills Futuras

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|------------------|----------|------------|
| `scraper-nova-loja` | já existe (criada na V4) | Usada na Sprint 35 — inspeção da página real (HTML do `.in_cash-price-box`) antes de trocar o seletor, em vez de ajustar o preço "no escuro" | Já feita |
| `backend-conventions` | já existe | Referência usada na Sprint 35 (contrato `ScraperBase`, `_limpar_preco`) | Já feita |
| `filtro-loja-diagnostico` | sugerida na Sprint 34 (resolvida sem precisar virar skill — causa raiz era pontual: um único nome de loja com espaço) | Documentar, se recorrer de novo, como depurar descasamento de slug de loja entre `lojas`/`itens` e os filtros do front (`Dashboard.constants.js`/`useDashboardFilters`) — a normalização correta (minúsculas, sem espaços) já existia no back-end (`_slug_loja` em `main.py`) e só não tinha sido replicada no front | Baixa (1 ocorrência, já corrigida) |
