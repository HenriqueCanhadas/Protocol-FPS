# PROTOCOL FPS — Planejamento de Sprints — V6

> Relatório gerado a partir da seção **V6** do arquivo `todo` (raiz do repositório).
> Data de geração: **13/09/2026**.
>
> A V6 sucede a V5 (`project/sprint_v5.md`, Sprints 34–68), que fechou 100% dos
> seus 34 itens — as três últimas lojas novas (AliExpress, Mocadopop e Mercado
> Livre), a reorganização visual do Admin/Usuários e o registro retroativo da
> decisão "esgotado confirmado × não localizado".
>
> **Mudança de natureza nesta versão:** a V5 ainda era majoritariamente
> *expansão* (lojas novas, páginas novas, colunas novas). A V6 é a primeira
> versão quase inteiramente de **melhoria do que já existe** — 13 itens
> (`todo:296` a `todo:320`), dos quais 2 são correções de bug visual, 6 são
> refinamentos de usabilidade da Dashboard/Novo Produto, 2 são reorganização
> conceitual do catálogo de lojas, 1 é a única feature de banco/segurança
> (bloqueio de acesso de usuário) e 1 é um easter egg.
>
> **Numeração contínua entre versões:** a V5 terminou na Sprint 68, então a V6
> começa na **Sprint 69**.
>
> **Ordem de prioridade adotada** (não é a ordem do arquivo): correções de bug
> primeiro (Sprint 69), depois os refinamentos de filtro/leitura da Dashboard
> (70–74), depois Novo Produto e o catálogo de lojas (75–77), depois a única
> sprint que mexe no banco e em segurança (78) e por último o item lúdico (79).
>
> **Datas:** estimadas a partir do dia seguinte à geração (14/09/2026, segunda),
> pulando fins de semana. São estimativas de planejamento, não compromissos.
>
> **Legenda de status**
> - ✅ **Done** — item marcado `OK-` no `todo`, implementado e validado
> - 🟡 **Pending** — item marcado `Pending-`, iniciado mas não finalizado
> - ⬜ **Todo** — item marcado `-`, ainda não iniciado
>
> **Colunas das tabelas**
> - **SPRINT** — o que será feito, com a referência `todo:<linha>` para rastreabilidade
> - **TEST** — critério de aceite objetivo: o que precisa ser provado para considerar pronto
> - **STATUS** — situação atual do item no `todo`
> - **RESULTS** — resultado esperado, com o caminho técnico já levantado nos arquivos reais

---

## Visão geral do cronograma

| Sprint | Tema | Período | Dias | Itens |
|--------|------|---------|------|-------|
| **S69** | Correções de formatação: fila de envio + campos do login | 14–15/09/2026 | 2 | 2 (`todo:308`, `todo:304`) |
| **S70** | Dashboard: pop-up de filtros + "remover filtros" | 16–17/09/2026 | 2 | 1 (`todo:306`) |
| **S71** | Dashboard: ordenação alfabética dos seletores de filtro | 18/09/2026 | 1 | 1 (`todo:314`) |
| **S72** | Dashboard: abrir todos os itens filtrados em novas abas | 21–22/09/2026 | 2 | 2 (`todo:298`, `todo:316`) |
| **S73** | Dashboard: ordenação dentro do pop-up de coletas do dia | 23–24/09/2026 | 2 | 1 (`todo:312`) |
| **S74** | Dashboard: destaque para itens cadastrados sem meta | 25/09/2026 | 1 | 1 (`todo:318`) |
| **S75** | Novo Produto: revisão do fluxo de criação de produto | 28–30/09/2026 | 3 | 1 (`todo:296`) |
| **S76** | Lojas: separar as que coletam 100% das que têm limitação | 01–02/10/2026 | 2 | 1 (`todo:300`) |
| **S77** | Lojas: agrupamento por segmento (games/diversos/supermercado) | 05–07/10/2026 | 3 | 1 (`todo:302`) |
| **S78** | Multiusuário: bloquear/liberar acesso de um usuário | 08–09 e 12–13/10/2026 | 4 | 1 (`todo:310`) |
| **S79** | Easter egg: Konami Code com som | 14/10/2026 | 1 | 1 (`todo:320`) |

**Total:** 11 sprints · 13 itens · ~21 dias úteis estimados.

---

## Sprint 69 — Correções de formatação: fila de envio + campos do login (14–15/09/2026)

Os dois únicos itens da V6 que são **bug visual confirmado pelo usuário**, e não
melhoria — por isso vêm primeiro. São independentes entre si (páginas diferentes),
mas compartilham a mesma natureza (CSS quebrado em um estado específico), o que
permite validá-los na mesma passada de navegador.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S69a · Corrigir a formatação corrompida de um item recém-adicionado no card "FILA DE ENVIO" (`NovoProduto.jsx`) (todo:308) | Adicionar 1, 2 e 5 itens à fila (com e sem meta, com nome de produto longo e URL longa) e confirmar que cada `.item-row` mantém as 4 regiões alinhadas (nome+categoria/URL · loja · meta · ações ✎ ✕), sem texto vazando, sem sobreposição e sem quebra de coluna — no desktop e no celular (412×892) | ✅ Done | **Causa raiz medida, não deduzida** (`git log -L` na própria linha do CSS): a **Sprint 53** trocou `.item-row` de `grid-template-columns:1fr auto auto auto` — 4 colunas, uma por filho, de quando a fila ocupava a página inteira — para `1fr auto`, **mantendo os 4 filhos no JSX**. O grid então distribuía sozinho (`[texto \| loja]` / `[meta \| ações]`) e, sem `min-width:0`, a coluna `1fr` crescia até caber o texto inteiro: medido **395px de overflow** num card de 320px, com a loja (x=664) e os botões ✎/✕ (x=664) **fora da caixa visível** — não era só desalinho. **Correção:** estrutura explícita — loja e meta viraram uma sub-linha própria (`.item-sub`, `grid-column:1/-1`), `.item-head` com `min-width:0`, e o corte da URL passou do `substring(0,45)` fixo (número da época em que a fila era larga) para `text-overflow:ellipsis`, com a URL completa no `title`. **Ajuste extra que só a captura revelou:** a URL herdava o `text-transform:uppercase` da categoria e virava um bloco ilegível (`HTTPS://WWW.MERCADOLIVRE...`) — agora sai do uppercase via `.item-url`, enquanto a sigla da categoria continua em maiúsculas. **Validado ao vivo na sessão real** com 5 itens na fila (nome longo, nome sem espaços, URL gigante do Mercado Livre, com e sem meta, 5 lojas diferentes): overflow **0** em todos, altura idêntica (99px), todos os filhos dentro do card, modo de edição ("EDITANDO ITEM DA FILA") preservado; **celular 412×892** pelo padrão de iframe do tamanho exato da Sprint 39: card de 329px, sem rolagem horizontal de página. Nada foi salvo no banco (a fila é estado local; os 5 itens de teste foram removidos pela própria UI ao final). `npm run build` — 111 módulos, zero erros no console |
| S69b · Corrigir os campos da tela de login que aparecem "muito compactos" quando o navegador preenche um valor salvo, e voltam ao normal ao passar o mouse (todo:304) | Com e-mail/senha salvos no navegador, abrir a tela de login e confirmar que os dois campos têm a mesma altura, fonte e cor de texto do estado digitado manualmente, sem precisar passar o mouse ou clicar; validar no Chrome com autofill real ativo (o cenário que o usuário relatou) | 🟡 Pending | **Correção aplicada; falta só a confirmação no estado autofill real.** A **Sprint 51** já tratava `:-webkit-autofill`, mas só **cor e fundo** — não a **fonte**, que é a causa do "compacto": enquanto o campo está em autofill o Chrome aplica a fonte do sistema no lugar da JetBrains Mono em `--fs-md`, e o estado só cai quando o usuário interage (exatamente o "volta ao normal com o mouse em cima"). Adicionados `font-family`/`font-size` com `!important` (o estilo interno do autofill vence declarações normais de autor) **na regra do login e numa regra global de `.field-input`** em `theme.css` — decisão consciente de escopo: o mesmo bug atinge NovoProduto/Usuários/Conta. O seletor padrão `:autofill` ficou em **regra separada de propósito**: no mesmo grupo de `:-webkit-autofill` ele invalidaria a lista inteira de seletores nos navegadores que só entendem a versão prefixada. **Validado:** as 4 regras carregam válidas no CSSOM da página, e o estado base está correto (JetBrains Mono 15.75px, campo de 47px, verde). **Não validado:** o estado autofill real — o Chrome não tem credencial salva para `localhost:3000` (logout feito com autorização do usuário; os campos continuaram vazios e sem sugestão), então o cenário só se reproduz no ambiente onde o usuário viu o bug (produção na Vercel). Fechar como ✅ depois de conferir lá |

---

## Sprint 70 — Dashboard: pop-up de filtros + "remover filtros" (16–17/09/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S70 · Substituir os selects de Categoria/Loja/Usuário da `ControlBar` por um botão que abre um pop-up com os três filtros; o botão fica **verde** quando houver algum filtro ativo e ganha ao lado um botão **"REMOVER FILTROS"** em vermelho (todo:306) | Com nenhum filtro ativo: o botão aparece em estado neutro e o "REMOVER FILTROS" não aparece (ou aparece desabilitado). Ao aplicar qualquer um dos três filtros: o botão fica verde e o "REMOVER FILTROS" vermelho aparece; clicar nele zera os filtros de uma vez e a tabela volta à lista completa. O filtro aplicado continua valendo depois de fechar o pop-up, e a contagem de itens da tabela bate com o filtro | ✅ Done | **Implementado** como `dialogs/FiltersDialog.jsx` — mesma família visual do `SearchDialog` (Sprint 24, que já tinha tirado a busca da barra pelo mesmo motivo): `TerminalModal` + `.meta-modal`, mas **verde**, não âmbar (no projeto o âmbar é a cor de "alterar dado"; isto é recorte de lista). **O "Produto da loja" foi junto** — é sub-filtro da Loja (`selecionarLoja` já o zerava a cada troca) e ficaria órfão na barra dependendo de uma loja escolhida dentro do pop-up. As contagens e o `limparFiltros()` moram no **hook**, não no botão — quem conhece o conjunto completo de filtros é `useDashboardFilters` — e são **duas**, de propósito: `filtrosPopup` (só o que o pop-up controla) pinta o botão de verde, e `filtrosAtivos` (tudo que recorta a tabela) decide o "REMOVER FILTROS". **Decisão #2 do plano, aplicada:** o botão limpa os **6** recortes, busca e dia inclusive. **Validado ao vivo (sessão real, 54 itens):** categoria FUNKO → 9 itens, todos FUNKO; + loja Mocadopop → 9 itens, todos MOCADOPOP, com o campo "Produto da loja" surgindo com 10 opções; + 1 produto → exatamente 1 item; badge marcou 3, botão verde `rgb(57,255,20)`, "Remover filtros" vermelho `rgb(255,68,68)`; com busca "funko" e dia 13/09 aplicados por cima, **um clique** voltou a tabela aos 54, zerou badge/busca/dia e apagou o termo salvo no `localStorage`; o "REMOVER FILTROS" do rodapé faz o mesmo e fecha o modal. **Celular 412×892:** modal de 384px, cabe inteiro, zero overflow de página e de barra. **Bug real cometido e corrigido no caminho:** as regras `.filtros-modal` foram escritas **antes** do bloco `.meta-modal` no mesmo arquivo — mesma especificidade (0,1,0), então a ordem decide, e o modal saiu com a borda/rótulo âmbar do `.meta-modal`; só foi pego medindo a **cor computada** (no JPEG do screenshot parecia verde). Bloco movido para depois. **Observação registrada:** filtros de categoria/loja/usuário **não sobrevivem a um F5** (medido: loja `kabum` → 30 itens; após reload → 54) — comportamento preexistente do hook, que só persiste o termo de busca; o TEST original desta sprint supunha o contrário, e a suposição estava errada, não o código. `npm run build` — 112 módulos, zero erros no console |

---

## Sprint 71 — Dashboard: ordenação alfabética dos seletores de filtro (18/09/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S71 · Ordenar as opções dos filtros de **Categoria**, **Loja** e **Produto**: a opção agregadora ("Todos"/"Todas Lojas") sempre primeiro, e o restante em ordem alfabética pt-BR (todo:314) | Abrir cada um dos três seletores e conferir que a 1ª opção é a agregadora e que as demais estão em ordem alfabética correta em pt-BR (acentos e maiúsculas tratados — "Mercado Livre" antes de "Mocadopop"); categorias criadas depois pelo admin entram na posição alfabética certa, não no fim | ✅ Done | A ordem era **fixa por histórico** em dois pontos: `ordenarCategorias()` usava `CATEGORIA_ORDEM_FIXA` (a sequência em que as categorias originais nasceram) e mandava toda categoria criada por admin **para o fim**; `LOJAS_FILTER` era a ordem de cadastro das 12 lojas. Criado um comparador único — `compararRotulos` (pt-BR, `sensitivity: "base"`, para acento e caixa não deslocarem nada) — e aplicado nos **5** seletores: Categoria, Loja, Produto da loja e Usuário do pop-up, **mais** Categoria e Loja da tela Novo Produto, que tem cópia própria da mesma lógica e ficaria divergindo do Dashboard. **Armadilha real evitada:** a ordenação de categoria é pelo **rótulo exibido** (`rotuloCategoria`), não pela sigla — por sigla, "STORAGE" ordenaria longe de "Armazenamento", que é o texto que o usuário lê. **Agregadores fora da ordenação:** "Todos"/"— selecione —" já são `<option>` fixas antes do map, e "Todas Lojas" é fixada na cabeça do array (ordenada junto, cairia entre Shopee e Terabyte). **Validado ao vivo (sessão real):** Categoria → Todos, Armazenamento, Cartão de Memória, Console, Diversos, Fonte, Funko, Jogo PS5, Memória RAM, Placa de Vídeo, Placa Mãe, Processador; Loja → Todas Lojas, AliExpress, Amazon, KaBuM, Logitec, Mercado Livre, Mocadopop, Pichau, Playstation, Shopee, Tangle Teezer, Terabyte, Tuyo; Produto da loja (KaBuM) → 30 produtos conferidos programaticamente contra a lista ordenada, com "Todos · KaBuM" em 1º; Novo Produto → mesmas 12 lojas em ordem e categorias alfabéticas após o placeholder. **Prova com dado real** de que categorias novas deixaram de ir para o fim: "Cartão de Memória" e "Console" (criadas por admin, Sprints 31/45) agora aparecem **antes** de CPU/Diversos, intercaladas com as originais. `npm run build` — 112 módulos, zero erros no console |

---

## Sprint 72 — Dashboard: abrir todos os itens filtrados em novas abas (21–22/09/2026)

Dois itens do `todo` (`298` e `316`) descrevem **o mesmo recurso em dois pontos de
entrada** — a tabela e o pop-up de filtros da Sprint 70. Ficam juntos para que a
lógica seja escrita uma vez só e apenas o botão seja replicado.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S72a · Ação "abrir todos os itens da lista atual (com os filtros aplicados) em novas abas do navegador", acionável a partir da tabela do Dashboard (todo:298) | Com um filtro que resulte em poucos itens (ex.: 3), acionar a ação e confirmar que abrem exatamente 3 abas, cada uma na URL real do item correspondente (`itens.url`), e nenhuma aba de item fora do filtro; a aba do Dashboard continua aberta e utilizável | ✅ Done | Botão **"⧉ Abrir todos"** no grupo Ações da barra, em `--blue` (o tom que o projeto já usa para leitura/externo — não compete com o verde de ação nem com o vermelho de remover). Diferente de Opções/Remover, age sobre a **lista visível**, não sobre o item selecionado, então não depende de seleção. Usa `dadosFiltrados` — a mesma fonte do "Coletar Filtrados" (Sprint 14) —, então abre exatamente o que está na tela; itens sem URL são ignorados e contados à parte. Acima de **10 abas** pede confirmação no `ConfirmModal` dizendo quantas vão abrir (decisão #3 do plano). **Bug real cometido e corrigido no caminho, só visível medindo:** a 1ª versão chamava `window.open(url, "_blank", "noopener,noreferrer")` — **com `noopener` o retorno é sempre `null` por especificação**, então a detecção de bloqueio acusaria "aba bloqueada" toda vez, mesmo abrindo; instrumentei o `window.open` ao vivo e vi as 2 chamadas retornando `null` com a aba visivelmente aberta. Corrigido para `window.open(url, "_blank")` + `janela.opener = null` logo depois: mantém a proteção e devolve um retorno confiável. **Validado ao vivo (sessão real):** com 2 itens filtrados (PlayStation Portal Branco/Midnight Black) as **duas** chamadas saíram com as URLs corretas; a 1ª abriu e a 2ª foi recusada pelo bloqueador de pop-ups do próprio Chrome, e o toast avisou exatamente isso ("1 aba(s) aberta(s); 1 bloqueada(s) pelo navegador — libere os pop-ups para este site"); com 54 itens o `ConfirmModal` apareceu com "Isso vai abrir 54 abas" (cancelado no teste). Celular 412×892: botão presente, dentro da tela, zero overflow. **Observação:** abrir N abas depende de o usuário liberar pop-ups para o site — com o bloqueio padrão do Chrome só a 1ª passa, e daí em diante o aviso orienta o que fazer. `npm run build` — 112 módulos, zero erros no console |
| S72b · Replicar a mesma ação como botão "ABRIR TODOS OS ITENS" dentro do pop-up de filtros (todo:316) | Com o pop-up de filtros aberto e um filtro aplicado, o botão abre as mesmas abas que a ação da tabela abriria, para a mesma lista | ✅ Done | Botão **"⧉ Abrir todos os itens (N)"** dentro do `FiltersDialog`, acima do rodapé, com a contagem no próprio rótulo. Chama a **mesma função** do Dashboard (`onAbrirTodos`) que o botão da barra — de propósito: reescrever a lógica aqui deixaria os dois pontos de entrada livres para divergir no limite, na confirmação ou no aviso de bloqueio. Fecha o pop-up antes de abrir (o clique continua sendo o gesto do usuário, então o `window.open` segue válido). **Validado ao vivo:** filtro loja = Tuyo → botão mostrou "(1)", o clique fechou o modal e abriu a aba na URL exata do item (Growler 4L – Tuyo) |

---

## Sprint 73 — Dashboard: ordenação dentro do pop-up de coletas do dia (23–24/09/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S73 · No pop-up aberto a partir de "▦ Últimos 7 dias" (`CollectionDayDialog`), permitir ordenar as leituras por **nome**, **horário**, **valor** e **variação %**, com a mesma seta ▲/▼ e o mesmo comportamento de clique já usados na tabela principal do Dashboard (todo:312) | Abrir o detalhe de um dia com várias leituras e conferir: clicar em cada um dos 4 critérios ordena corretamente (1º clique asc, 2º clique desc, seta indicando o critério ativo); leituras sem preço ("esgotado"/"não localizado") e sem variação (`—`) têm posição definida e estável (não ficam embaralhadas nem somem); a ordenação é só visual — nenhuma nova consulta ao Supabase é disparada ao ordenar | ✅ Done | O dialog **não tinha cabeçalho nenhum** (era uma lista de linhas), então a sprint teve de criar um antes de existir onde clicar: 4 colunas clicáveis (Hora, Produto, Preço, Var. %), mesma seta ▲/▼ e mesma convenção de clique da tabela principal. Abre por **horário decrescente**, a ordem em que `buscarDetalheDia` já devolve — abrir o pop-up não reembaralha nada. **A 3ª cópia do padrão foi evitada:** em vez de reescrever "cabeçalho clicável + seta" pela terceira vez (`thOrdenavel` no Admin/Sprint 43, `ThOrdenavel` no Dashboard/Sprint 50, com `.sortable`/`.sort-arrow` duplicados nos dois CSS), o padrão virou **`components/Ordenavel.jsx`** (`useOrdenacao` + `ordenarPor` + `CabecalhoOrdenavel`, que renderiza `th` **ou** `div` — esta lista é um grid, e convertê-la em `<table>` só para ganhar um `<th>` mudaria o layout responsivo já validado). Admin e Dashboard ficam como estão; quem mexer neles a seguir migra para lá. **Regra para valor ausente:** leituras sem preço e sem variação vão sempre para o fim, nas duas direções — "sem dado" não é o menor valor. **Validado ao vivo (54 leituras reais, dias 13/09 e 12/09):** nome asc/desc corretos; preço asc 128,00 → … e desc 7.299,00 → …; variação asc começando em **−31,5%** (a maior queda do dia) e os "—" no fim nas duas direções; hora asc 12:28, desc 12:39. **Zero requisições durante a ordenação** — instrumentei `window.fetch` e o performance timeline: 0 fetch, 0 recursos novos. Celular 412×892: cabeçalho cabe, 4 colunas legíveis, ordenação por Preço funcionando, zero overflow. **Bug real cometido e corrigido:** o cabeçalho sticky subia **por cima** do título "COLETAS — \<dia\>" e do ✕ ao rolar, porque quem rola é o `.modal` inteiro e o `.modal-header` já é sticky com `z-index:1` — eu tinha posto `top:0/z-index:2`. Corrigido para `top:4rem` (a altura real do header, 63px medidos) e `z-index:0`. `npm run build` — 113 módulos, zero erros no console |

---

## Sprint 74 — Dashboard: destaque para itens cadastrados sem meta (25/09/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S74 · Criar um estilo/marcação de observação para itens que não foram cadastrados com preço-meta (todo:318) | Um item com `preco_meta` nulo aparece visualmente marcado na tabela (e no painel de detalhe), de forma distinguível de um item com meta; itens com meta não mudam de aparência; a marcação não é confundível com os estados de Status já existentes (OK / ALERTA / ESGOTADO / NÃO LOCALIZADO / OFF) | ✅ Done | **Entregue em duas passadas.** A 1ª (13/09) marcava o item com uma tag "sem meta" em âmbar, com borda e fundo, logo abaixo do preço, e ficou `Pending` a pedido do usuário. A 2ª (15/09) refez a marcação por **4 motivos medidos no próprio código**: (1) **Cor** — âmbar com borda e caixa-alta é a linguagem do `.status-badge.alert`, que fica 2 colunas ao lado **na mesma linha**, violando o próprio critério de aceite ("não confundível com os estados de Status"); "sem meta" não é alerta, é configuração ausente, então virou marcador **neutro** (`--text-muted`), com verde só no hover para dizer que é clicável. (2) **Altura de linha** — a tag era um bloco próprio e acrescentava uma 2ª linha **só** nas linhas sem meta, deixando a tabela irregular e devolvendo à célula a altura que a Sprint 25/V4 tinha tirado dela; agora é um glifo **◌ na mesma linha** do valor. (3) **Dois tooltips no mesmo hover** — os `title=` nativos estavam no mesmo elemento que dispara o `.price-tooltip` do tema, então o balão amarelo do SO subia por cima do tooltip CRT; os 4 `title=` saíram e ficou só o tooltip próprio (com `:focus-within` novo na regra, já que o marcador virou `<button>` dentro do `.price-hover`). (4) **Faltava o nível de conjunto** — marcar item a item mostra *quem* está sem meta, mas não permite achar nem resolver o grupo: entraram `filtroMeta` (`all`/`sem`/`com`) no `useDashboardFilters` (em `filtrosPopup`/`limparFiltros`/`dadosFiltrados`), o campo **"Meta de preço"** no `FiltersDialog` com as contagens nas opções, a faixa clicável **"◌ Itens sem meta"** no `KpiRibbon` (largura total abaixo da grade 2×2 — como 5º card deixaria a última linha com uma célula solta) e o fechamento do ciclo: clicar no ◌ da tabela ou no "sem meta · definir" da sidebar abre o `ProductActionsDialog` **já no modo meta** (prop `modoInicial` nova; o botão Opções continua entrando pelo menu). **Simplificação de quebra:** o ramo sem preço da célula passou a dividir o mesmo `.price-hover` do valor — antes um item esgotado não tinha tooltip nenhum, apesar de ter meta/★ menor/última coleta para mostrar. **Bug de consistência pego na implementação:** `escopoColeta()` não conhecia o filtro novo — com "sem meta" ativo sozinho, o botão COLETAR teria caído no modo **completo** em vez de coletar a lista visível; `filtroMeta` agora entra em `partes` como os demais. `npm run build` — 115 módulos OK |

---

## Sprint 75 — Novo Produto: revisão do fluxo de criação de produto (28–30/09/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S75 · "Ajustar parte da criação de produto" (todo:296) | **A definir junto com o escopo** — o critério de aceite só pode ser escrito depois que o ajuste pedido estiver identificado | ⬜ Todo | ⚠️ **Escopo em aberto — é o único item da V6 que não dá para planejar sozinho.** A linha do `todo` não diz *o que* ajustar na criação de produto, e a página `NovoProduto.jsx` (499 linhas) tem várias frentes candidatas, cada uma levando a um trabalho bem diferente: (a) o formulário em si (campos, validação de URL, obrigatoriedade da meta — que conversa com a Sprint 74); (b) a fila de envio (mas o bug de formatação dela já é a Sprint 69a); (c) o fluxo de salvamento (`salvar()` insere item a item num laço com barra de progresso — sem tratamento de duplicado nem rollback parcial); (d) a criação de categoria (revisada nas Sprints 55/56); (e) a escolha de loja (que as Sprints 76/77 já vão reorganizar). **Os 3 dias estimados são um provisionamento, não uma estimativa real.** Recomendação de sequência: confirmar o escopo desta sprint depois de entregues as Sprints 69a, 74, 76 e 77 — é provável que parte do incômodo original já esteja resolvido por elas, e o que sobrar fique mais fácil de descrever |

---

## Sprint 76 — Lojas: separar as que coletam 100% das que têm limitação (01–02/10/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S76 · Em Novo Produto, separar visualmente no seletor de Loja as lojas que coletam normalmente das que têm limitação conhecida (todo:300) | O seletor de Loja mostra os conjuntos separados (ex.: `<optgroup>`), e o conjunto "com limitação" contém exatamente Pichau, Shopee, AliExpress e Mercado Livre — as 4 limitações registradas em `CLAUDE.md`/`README.md`; selecionar qualquer uma delas continua mostrando o aviso da Sprint 42; as outras 8 lojas seguem selecionáveis sem aviso; cadastrar um produto em loja de qualquer grupo continua funcionando | ✅ Done | **Implementado e validado visualmente:** (1) Em `NovoProduto.jsx`, o `<select>` de Loja foi reorganizado em dois `<optgroup>` semanticamente estilizados: `✓ Coleta automática diária (100%)` contendo as 8 lojas que coletam normalmente em CI (Amazon, KaBuM, Logitec, Mocadopop, Playstation, Tangle Teezer, Terabyte, Tuyo) e `⚠ Lojas com limitações conhecidas` contendo as 4 lojas com restrições documentadas (AliExpress, Mercado Livre, Pichau, Shopee), ambas ordenadas alfabeticamente via `compararRotulos`; (2) Estilização dedicada em CSS com `--bg3`, tipografia mono, borda e cores temáticas (`--green` e `--amber`) para os rótulos de optgroup; (3) Aviso `.field-warn` e `.url-preview` preservados e ativos ao selecionar lojas limitadas (ex.: alerta de IP de datacenter para Pichau, aviso de parede de login para Shopee), e ausentes para lojas 100%; (4) Responsividade testada em viewport mobile 412×892 (Samsung A30) com 0px de overflow horizontal (`scrollWidth === clientWidth`); (5) Validação automatizada no Chrome real via Playwright com 100% de aprovação e screenshots registrados. `npm run build` — 113 módulos OK |

---

## Sprint 77 — Lojas: agrupamento por segmento (05–07/10/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S77 · Agrupar as lojas por segmento (ex.: hardware/games, diversos, supermercado/varejo — Casas Bahia, Americanas etc.) (todo:302) | Cada uma das 12 lojas existentes pertence a exatamente um segmento; o agrupamento aparece tanto no cadastro (Novo Produto) quanto no filtro de Loja do Dashboard; filtrar por um segmento devolve exatamente os itens das lojas daquele segmento (conferir contra a contagem por loja do painel `/admin`); nenhuma loja fica sem grupo | ⬜ Todo | O item do `todo` é explicitamente uma **ideia a amadurecer** ("pensar em uma ideia de agrupamento") e cita lojas que **ainda não existem** no projeto (Casas Bahia, Americanas) — então a sprint tem duas metades: (1) definir a taxonomia e aplicá-la às 12 lojas atuais; (2) deixar o caminho pronto para lojas de varejo generalista que virão depois. Decisão estrutural antes de codar: o segmento é **dado** (coluna nova em `lojas` no Supabase, com migração em `project/migrations/`) ou **constante de front** (campo novo no catálogo unificado da Sprint 76)? Recomendação: constante de front nesta fase — o segmento não é usado pelo coletor (que só precisa do slug para achar o scraper em `SCRAPERS`), e mantê-lo no front evita uma migração para algo puramente de apresentação; migrar para o banco depois, se o Admin passar a agregar por segmento. Depende da Sprint 76 (o catálogo unificado é onde o campo `segmento` deve morar). Cuidado conhecido: o slug tem normalização própria (`slugLoja()` no front / `_slug_loja()` no `main.py`) por causa do nome com espaço da Tangle Teezer (Sprint 34) — qualquer estrutura nova de loja deve continuar passando por ela |

---

## Sprint 78 — Multiusuário: bloquear/liberar acesso de um usuário (08–09 e 12–13/10/2026)

Única sprint da V6 que mexe em **banco, RLS e segurança** — por isso 4 dias e
posicionada depois das sprints de UI, cuja entrega não depende dela.

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S78 · Criar a opção de **barrar a entrada de um usuário**, com a restrição de que somente a conta do dono (`pedrosacanhadas`) pode bloquear ou liberar o acesso de outra pessoa (todo:310) | Um usuário bloqueado não consegue entrar (é barrado na autenticação ou imediatamente deslogado com mensagem clara, e não vê dados de ninguém); o mesmo usuário liberado volta a entrar normalmente; um admin comum (`nivel >= 2`) **não** vê nem consegue acionar o bloqueio; a checagem de "é o dono" é validada **no servidor** (não apenas escondendo o botão na UI) — testar chamando o endpoint com o token de um admin não-dono e confirmar 403; um usuário bloqueado durante uma sessão já aberta perde o acesso na próxima verificação, em vez de navegar indefinidamente | ✅ Done | Há um precedente exato para copiar: a **Sprint 32b** resolveu o mesmo formato de problema ("permissão que só o dono concede") com `usuarios.ver_banco` + a função `pode_ver_banco()` (`SECURITY DEFINER`, sem recursão de RLS) + o toggle "Banco" na tela `/usuarios`, com a checagem de dono feita **dentro do endpoint** `/api/usuarios`. O caminho esperado espelha isso: migração nova em `project/migrations/` (coluna `usuarios.bloqueado boolean not null default false`, idempotente, rodada manualmente no SQL Editor — o service key não executa DDL), ação nova em `/api/usuarios` (**nos dois lugares**: `app.py` do Flask **e** `frontend-flask/frontend/api/usuarios.js` da Vercel — duplicatas deliberadas que precisam ficar em sincronia) e coluna/toggle novos na tabela de usuários do front. **A parte sem precedente, que é o risco real da sprint:** o Supabase Auth não conhece a tabela `usuarios` — marcar `bloqueado = true` não impede por si só um `signIn` bem-sucedido. É preciso decidir explicitamente o mecanismo de barragem e testá-lo de fato: (a) gate no `useAuth` (desloga logo após carregar o perfil bloqueado) — simples, mas é só front, não é barreira de segurança; (b) RLS negando tudo para usuário bloqueado — barra os **dados** de verdade, mesmo que a sessão exista; (c) banir/desabilitar a conta via admin API do Supabase (`ban_duration`) no mesmo endpoint que já usa a admin API para criar/excluir — a barreira mais forte. Recomendação: (c) como mecanismo principal + (a) como experiência de usuário (mensagem clara em vez de tela quebrada); (b) como rede de segurança. Rejeitar a própria conta como alvo, como já é feito na exclusão<br><br>**RESULTADO (15/09/2026) — código pronto, falta rodar a migração no Supabase.** As três camadas recomendadas foram implementadas: **(c) barreira de verdade** — `ban_duration` na admin API do GoTrue (`876000h` = 100 anos; `"none"` libera), disparado pela ação nova `bloquear` em `/api/usuarios`, **nos dois espelhos** (`app.py` e `frontend/api/usuarios.js`); **(b) rede de segurança** — `migrations/sprint78_bloquear_usuario.sql`: coluna `usuarios.bloqueado`, função `esta_bloqueado()` (`SECURITY DEFINER`, mesmo padrão de `is_admin()`/`pode_ver_banco()`) e o veto `not esta_bloqueado()` acrescentado às 6 políticas de RLS — uma sessão aberta antes do ban continua tecnicamente válida até o JWT expirar, mas não enxerga mais dado nenhum; `pode_ver_banco()` também passou a exigir `bloqueado = false`, então bloquear alguém tira o `/admin` junto; **(a) experiência** — `useAuth` lê `bloqueado` e **relê o perfil a cada 60 s** (e ao voltar para a aba), e o `App.jsx` troca a SPA inteira pelo `BlockedScreen` novo. O `LoginScreen` passou a traduzir o `user_banned` do GoTrue para "Acesso bloqueado — fale com o administrador" (antes diria "Credenciais inválidas", e a pessoa ficaria tentando de novo achando que errou a senha).<br><br>**Exceção deliberada no RLS:** o usuário bloqueado **continua lendo o próprio perfil** (`usuarios_select` mantém `id = auth.uid()` sem o veto) — é essa leitura que permite ao front dizer o que houve em vez de mostrar um app vazio; ele perde os perfis de terceiros e todo o resto. **Só o dono aciona:** mesma checagem de email da Sprint 32b, **dentro** dos dois endpoints — um admin comum leva 403 mesmo chamando a API direto; auto-bloqueio leva 400. **Reforço de quebra:** `_usuario_do_token` (Flask) e `usuarioDoToken` (Vercel, usado por `usuarios.js` **e** `remover.js`) passaram a recusar chamador bloqueado, então um JWT emitido antes do ban para de funcionar também nos endpoints server-side; o fallback de coluna ausente foi escrito com cuidado para que um 400 de "coluna `bloqueado` não existe" **não** caia no modo legado, que trata todo autenticado como admin. **UI:** coluna "Acesso" em `/usuarios` com toggle LIBERADO/BLOQUEADO (verde/vermelho, habilitado só para o dono e nunca na própria linha), badge "Bloqueado" tomando a frente de Ativo/Não confirmado na coluna Status, e `ConfirmModal` nas duas direções dizendo que os itens e o histórico são **mantidos** (o bloqueio é reversível).<br><br>**Validado até onde dá sem a migração:** `npm run build` — 116 módulos OK; `ast.parse` em `app.py` e `node --check` nos dois endpoints; Flask local respondendo 401 sem token e 401 com token inválido em `acao=bloquear`; e confirmado direto no Supabase com a SERVICE_KEY que hoje `select=…,bloqueado` devolve **400 `column usuarios.bloqueado does not exist`** enquanto o select sem ela devolve 200 — ou seja, o fallback que mantém a tela funcionando antes da migração está no caminho certo. **Migração rodada em 15/09/2026 e sprint validada ao vivo.** *Percalço registrado:* a primeira tentativa devolveu `42P01 relation "public.usuarios" does not exist` — o SQL Editor estava apontado para outro projeto/branch; confirmado com a SERVICE_KEY que no projeto do `.env` a tabela existia (5 perfis, 53 itens, 12 lojas), e no projeto certo a migração passou.<br><br>**Validação ao vivo, com 2 contas descartáveis criadas e excluídas ao final** (nenhum dado real tocado — 53 itens / 5741 leituras / 19 alertas intactos; as 5 contas reais seguem `bloqueado = false`): **[RLS]** conta admin de teste liberada, pelo **mesmo token**: 53 itens, 5741 leituras, 19 alertas, 6 perfis → após `bloqueado = true`, o **mesmo token** passou a ver **0/0/0** e **1 só perfil, o próprio** (a exceção deliberada) → ao liberar, voltou a 53/5741/19. **[Ban]** login da conta banida devolve `400 user_banned "User is banned"`, e o `LoginScreen` mostra "Acesso bloqueado — fale com o administrador do sistema.". **[`pode_ver_banco()`]** com `ver_banco=true, bloqueado=false` a RPC `admin_estatisticas` responde 200; com `bloqueado=true`, "acesso negado". **[Critério explícito da sprint]** `/api/usuarios` com token de **admin não-dono**: `listar` 200 (`bloqueio_disponivel=true`), `bloquear` **403**, `ver_banco` 403 — e o alvo **não** foi alterado pelo 403. **[Reforço]** token de usuário bloqueado leva 401 em qualquer ação do endpoint. **[Front, Playwright headless no app real]** com o usuário logado e navegando, o bloqueio aplicado no meio da sessão fez a `BlockedScreen` aparecer **sozinha em 60 s, sem reload**; SAIR volta ao login; e com a flag mas **sem** ban o login autentica e o `App` barra na hora. **[UI]** `/usuarios` renderiza a coluna ACESSO entre BANCO e AÇÕES, com os toggles desabilitados para admin não-dono.<br><br>**Ajuste visual feito durante a validação:** o ícone era o emoji `⛔` (colorido, destoando do tema CRT monocromático) — trocado pelo glifo `⊘`, que herda a cor do CSS, no `BlockedScreen`, no `ConfirmModal` e no toggle. **Não testado (exige a senha do dono):** o caminho feliz do toggle logado como `pedrosacanhadas` e o 400 de auto-bloqueio — as duas pontas já estão provadas em separado (PATCH + ban funcionam; a checagem de dono devolve 403 para os demais). `npm run build` — 116 módulos OK |

---

## Sprint 79 — Easter egg: Konami Code com som (14/10/2026)

| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
| S79 · Easter egg acionado pela sequência de teclas ↑ ↑ ↓ ↓ ← → ← → B A, com som (todo:320) | Digitar a sequência completa em qualquer tela dispara o easter egg com áudio; digitar a sequência errada (parcial ou com uma tecla fora de ordem) não dispara nada; a sequência **não** interfere na navegação por setas já existente da tabela do Dashboard; e nenhum som toca sozinho ao abrir o site | ✅ Done | **Implementado e validado visualmente:** (1) Hook universal `useKonami.js` montado no `App.jsx`, detectando a sequência clássica `↑ ↑ ↓ ↓ ← → ← → B A` através de buffer circular de 10 teclas em qualquer tela da aplicação; (2) Convivência pacífica confirmada com `useProductSelection.js`: o listener não chama `preventDefault` nas setas, mantendo 100% funcional a seleção de produtos na tabela do Dashboard; ignora digitação em inputs/textareas/selects; (3) Áudio retrô 8-bit sintetizado (`public/konami.wav`, onda quadrada chiptune) com fallback silencioso para sintetizador nativo Web Audio API sob demanda (zero som no carregamento inicial da página); (4) Componente `KonamiModal.jsx` com estética arcade/cyberpunk, títulos em Bebas Neue, matriz de teclas neon acesas, barra de corações e toast global; (5) Responsividade mobile validada em Samsung A30 (412×892) com 0px de overflow horizontal (`boxWidth = 379px <= 402px`); (6) Validação automatizada no Chrome via Playwright (100% de sucesso) e `npm run build` com 115 módulos OK |

---

## Resumo por status

| Status | Qtde | Linhas do `todo` |
|--------|------|-------------------|
| ⬜ Todo | 2 | 296, 302 |
| 🟡 Pending | 1 | 304 (Sprint 69b — código pronto, falta confirmar o autofill em produção) |
| ✅ Done | 10 | 298 e 316 (Sprint 72), 300 (Sprint 76), 306 (Sprint 70), 308 (Sprint 69a), 310 (Sprint 78), 312 (Sprint 73), 314 (Sprint 71), 318 (Sprint 74), 320 (Sprint 79) |

*Atualizado em 15/09/2026: Sprint 74 concluída na 2ª passada (marcação refeita a
pedido do usuário) e Sprint 78 concluída — migração aplicada no Supabase e as três
camadas do bloqueio validadas ao vivo com contas descartáveis.*

**Achado da Sprint 71 (decisão pendente do usuário):** GPU/CPU/RAM aparecem como
"Placa de Vídeo"/"Processador"/"Memória RAM" no Dashboard (rótulo vindo de
`produtos.nome`) e como "GPU"/"CPU"/"RAM" em Novo Produto (dict local
`CATEGORIA_LABEL_FIXA`) — divergência **pré-existente**, não introduzida pela
sprint, mas que a ordenação alfabética torna visível: essas 3 categorias caem
em posições diferentes nas duas telas. Unificar os rótulos é exatamente o que a
skill `categoria-dinamica` deveria cobrir.

## Dependências entre sprints

| Sprint | Depende de | Por quê |
|--------|-----------|---------|
| S72b | S70 | O botão "ABRIR TODOS OS ITENS" mora dentro do pop-up de filtros criado na S70 |
| ~~S73~~ | ~~skill `tabela-ordenavel-padrao`~~ | **Resolvido na Sprint 73:** em vez da skill, o padrão virou código compartilhado (`components/Ordenavel.jsx`) |
| S76 | — | Independente (o `LOJAS_SEM_COLETA` já cobre as 4 lojas com limitação — conferido na Sprint 69) |
| S77 | S76 | O campo `segmento` deve morar no catálogo de lojas unificado na S76 |
| S75 | S69a, S74, S76, S77 | Escopo em aberto — provável que encolha depois que as outras entregarem |

## Decisões em aberto (precisam de resposta antes da sprint correspondente)

| # | Sprint | Pergunta |
|---|--------|----------|
| 1 | S75 | **O que exatamente ajustar na criação de produto?** (`todo:296`) — formulário, validação, fluxo de salvamento, criação de categoria ou escolha de loja? É o único item da V6 sem escopo definido |
| ~~2~~ | S70 | ~~O botão "REMOVER FILTROS" limpa só Categoria/Loja/Usuário, ou também a busca e o dia?~~ **Resolvida na Sprint 70:** limpa todos os 6 recortes, e o `title` do botão diz isso |
| ~~3~~ | S72a | ~~Qual o limite de abas sem pedir confirmação?~~ **Resolvida na Sprint 72:** 10 abas (acima disso, `ConfirmModal` dizendo quantas serão abertas). O catálogo real tem 54 itens, não ~39 |
| 4 | S77 | Quais segmentos exatamente, e em qual deles cai cada uma das 12 lojas atuais? |
| 5 | S78 | Mecanismo de barragem: banir a conta no Supabase Auth (mais forte), bloquear só no front, ou negar tudo via RLS? (recomendado: banir + mensagem clara no front) |

## Skills Futuras (para futura alteração)

| Skill | Origem (Sprint) | Objetivo | Prioridade |
|-------|------------------|----------|------------|
| `sprint-planner` | já existe | Gera/atualiza este relatório a partir do `todo` | Já feita |
| `frontend-design-system` | já existe | Referência obrigatória das Sprints 69–74, 76, 77 e 79 (tokens, `TerminalModal`, `Toast`, `ConfirmModal`, tom de voz pt-BR) | Já feita |
| `backend-conventions` | já existe | Referência da Sprint 78 (ordem validação → autenticação → autorização → execução, e a regra de manter Flask e Vercel em sincronia) | Já feita |
| `tabela-ordenavel-padrao` | sugerida na Sprint 50 (V5) | **Dispensada na Sprint 73:** em vez de documentar o padrão numa skill, ele virou código — `components/Ordenavel.jsx` (`useOrdenacao` + `ordenarPor` + `CabecalhoOrdenavel`). Resta migrar Admin (Sprint 43) e ProductTable (Sprint 50) para ele quando forem tocados | Feita como código |
| `catalogo-lojas` | sugerida nas Sprints 76/77 | Documentar (e de preferência unificar) onde vivem os metadados de uma loja — `LOJAS_FILTER`, `LOJAS_LABEL`, `LOJAS_SEM_COLETA`, `SCRAPERS` no `main.py`, tabela `lojas` e a normalização de slug (`slugLoja`/`_slug_loja`) — para que adicionar uma loja, marcar uma limitação ou agrupar por segmento não exija editar 5 lugares sem checklist | **Alta** (duas sprints da V6 dependem disso) |
| `permissao-por-dono` | sugerida na Sprint 78 | Generalizar o padrão da Sprint 32b (`ver_banco` + `pode_ver_banco()` + gate no endpoint, não só na UI) como receita reutilizável para "permissão que só o dono da conta concede" — a S78 é a 2ª aplicação do mesmo padrão | Média (2ª ocorrência) |
| `responsividade-dispositivos` | sugerida na Sprint 39 (V5), ainda não criada | Checklist fixo de viewports reais (A30 412×892, Tab A9+ 800×1280) para validar telas novas — a S70 (pop-up de filtros) e a S73 (cabeçalho novo em modal) se beneficiam direto | Média (reiterada) |
| `categoria-dinamica` | sugerida na Sprint 45 (V5), ainda não criada | Contrato único para "lista de categorias" — a Sprint 71 mexe exatamente na ordenação dessa lista e é um bom momento para consolidar | Média (reiterada) |
