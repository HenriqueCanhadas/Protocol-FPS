---
name: scraper-nova-loja
description: Metodologia de teste/validação de scrapers do PROTOCOL FPS, extraída dos 3 casos já validados na prática — Kabum, Terabyteshop e principalmente Pichau (a única com bloqueio de IP de datacenter confirmado e uma limitação aceita por decisão registrada). Explica como o ambiente de execução funciona (local vs. GitHub Actions — Chromium headless, flags de CI, timeouts adaptativos, detecção de challenge/Cloudflare em base.py), como cada uma dessas 3 lojas foi de fato testada e "estabilizada" em CI (3 runs reais comparados 1-a-1 contra a verdade local), e dá um checklist replicável para validar qualquer scraper novo (Tuyo, Playstation, Logitec, Tangleteezer, Amazon, ou outra) do mesmo jeito, incluindo quando aceitar que uma loja só funciona local (padrão Pichau) em vez de insistir indefinidamente em contornar bot-protection a partir de um IP de datacenter. Use sempre que for criar, testar ou depurar um scraper — especialmente antes de assumir que algo "funciona" só porque rodou bem localmente uma vez.
---

# Metodologia de teste de scrapers (PROTOCOL FPS)

Este projeto já validou 3 scrapers de ponta a ponta (Kabum, Terabyteshop, Pichau) com uma
metodologia específica, registrada em `project/sprint_v1.md` (Sprint 1, 01/07/2026). Esta
skill existe para que qualquer scraper novo passe pelo **mesmo processo de validação**,
em vez de ser dado como "pronto" só porque um teste manual local funcionou uma vez.

## Quando usar

- Escrever um scraper novo para uma loja (Tuyo, Playstation, Logitec, Tangleteezer,
  Amazon, ou qualquer outra que entrar depois).
- Investigar por que um scraper que funciona local está falhando/inconsistente no CI
  (GitHub Actions).
- Decidir se uma loja precisa do mesmo tratamento de retry/challenge que a Pichau, ou
  se pode aceitar a limitação "só funciona local" como decisão definitiva.
- Antes de marcar qualquer sprint/tarefa de scraper como concluída — "rodei uma vez
  localmente e o preço veio certo" **não é validação suficiente** neste projeto.

## 1. Como o ambiente de execução funciona

Há **dois ambientes fisicamente diferentes** rodando o mesmo código, e as lojas reagem
de forma diferente a cada um:

| | Local (sua máquina) | CI (GitHub Actions) |
|---|---|---|
| SO/runner | Windows/Mac/Linux do dev | `ubuntu-latest` hospedado pela GitHub |
| IP de saída | Residencial/ISP normal | **IP de datacenter** (Azure/GitHub) — é isto que várias lojas de e-commerce tratam como sinal de bot |
| Detecção de CI | `IS_CI = bool(os.environ.get("GITHUB_ACTIONS"))` (`scrapers/base.py`) | Setado automaticamente pelo runner **e** redeclarado explícito no workflow (`GITHUB_ACTIONS: "true"` em `.github/workflows/coletar.yml`) — redundante de propósito, para garantir detecção mesmo se um dia o runner mudar |
| Timeouts | `TIMEOUT_GOTO=30s` / `TIMEOUT_NETWORK=15s` / `TIMEOUT_SELETOR=8s` | Dobrados: `45s` / `25s` / `12s` — CI é mais lento e mais provável de esbarrar em challenge |
| Flags do Chromium | Básicas (`_BROWSER_ARGS`) | Básicas + `_CI_EXTRA_ARGS` (`--disable-dev-shm-usage`, `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-gpu`, `--disable-software-rasterizer`, `--single-process`) — necessárias porque o container Linux do runner não tem GPU e tem `/dev/shm` pequeno |
| Diagnóstico | Só quando a extração falha (`_debug_page(forcado=True)`) | **Sempre** loga título da página + 300 chars do body (`if IS_CI: self._debug_page(...)`) — é assim que se descobre se o CI recebeu a página real ou uma challenge |

Todo esse comportamento vive em `scrapers/base.py` (`ScraperBase.coletar`) e é
**compartilhado por todas as lojas** — uma loja nova não precisa reimplementar nada
disso, só os dois métodos abstratos (`_aguardar_preco`/`extrair_dados`, ver skill
`backend-conventions`).

**Disparo isolado de uma loja no CI**: `workflow_dispatch` aceita o input `loja` (ver
`.github/workflows/coletar.yml` e `main.py:_selecionar_itens`, modo segmentado) — é
assim que se testa uma loja nova sem disparar a coleta completa. Ex.: `loja=tuyo`.

## 2. Detecção de challenge/bot-block (`ScraperBase._detectar_challenge`)

Compartilhada por todos os scrapers. Compara título/URL/corpo da página contra listas
de sinais conhecidos:

- **Títulos**: "just a moment", "attention required", "access denied", "security
  check", "403 forbidden", "blocked", "bot check", e os específicos da Pichau
  ("manutenção", "manutencao", "pru pru" — ver caso 3 abaixo).
- **Corpo**: `cf-browser-verification`, `cf_captcha_kind`, `__cf_chl`, `cloudflare`,
  `cdn-cgi/challenge`, `captcha`, `recaptcha`, `ray id`, `enable javascript`.
- **URL**: `/cdn-cgi/`, `/challenge`, `/captcha`.

Se uma loja nova for bloqueada, o primeiro passo é sempre olhar o log de
`_debug_page` (sempre ativo no CI) e ver se `eh_challenge` bateu com algum desses
sinais — **antes** de mexer em seletores, porque um bloqueio não é um bug de
extração.

## 3. Os 3 casos já validados — o que cada um ensina

### Kabum — o caso "fácil" (referência de estrutura)
JSON-LD completo com `offers.availability` + `offers.price` numa passagem só
(`_extrair_jsonld_completo`). Estável em CI sem nenhum tratamento especial de
retry — **é o scraper-molde** para qualquer loja que tenha JSON-LD limpo. Validado
3/3 runs em CI = local (Sprint 1: R$ 2.499,99 nos 3 runs).

### Terabyteshop — o caso "preço via JS" (sleep adaptativo)
Preço injetado por JavaScript depois do DOM pronto, não SSR. Padrão a copiar quando
uma loja nova também renderiza preço via JS: `page.wait_for_load_state("networkidle")`
+ **sleep adaptativo maior no CI** (`_SLEEP_POS_NETWORK = 5.0 if IS_CI else 2.5`) +
detecção de challenge **antes** de tentar extrair (não confundir "página bloqueada"
com "preço não encontrado"). Validado 3/3 runs em CI = local (Sprint 1: R$ 7.799,99).

### Pichau — o caso crítico (bloqueio de IP de datacenter, LEIA COM ATENÇÃO)
**A única das 3 que não roda de forma confiável no CI, por decisão registrada em
01/07/2026** (`project/sprint_v1.md`, Sprint 1; também documentado em `CLAUDE.md` e
no `README.md` como "Limitação conhecida"). O que aconteceu, na ordem:

1. Testes locais passavam sempre.
2. No CI, a Pichau começou a devolver uma **página falsa de manutenção**
   ("Site em Manutenção - Pru Pru") para o IP de datacenter do runner — não é uma
   página de erro genérica, é uma resposta deliberada anti-bot.
3. Confirmado **3/3 runs** que o bloqueio era sistemático (não intermitente) antes
   de decidir que era uma limitação real, não um bug transitório.
4. **Decisão tomada**: não fazer fallback HTTP (sempre dá 403 em datacenter de
   qualquer forma) nem insistir em técnicas mais agressivas de bypass — em vez
   disso, **detectar o bloqueio honestamente e logar como tal**.
5. Implementação (`scrapers/pichau.py`): `coletar()` é **sobrescrito** (não usa o
   `coletar()` genérico de `ScraperBase`) para adicionar um loop de retry:
   `_MAX_TENTATIVAS = 3 if IS_CI else 1`, com espera crescente entre tentativas
   (`10s, 20s...` — "dá tempo do rate-limit/bloqueio expirar"). Se todas as
   tentativas derem challenge, retorna
   `DadosProduto(nome="Challenge/Bloqueio Pichau", preco=None, disponivel=False, ...)`
   — **nunca** um preço "esgotado" falso, porque isso poluiria `historico_precos`
   com um dado errado (falso-positivo de esgotamento) em vez de simplesmente não
   gravar nada (`main.py` já trata `preco is None` como "não salva histórico e
   passa pro próximo item" — ver skill `backend-conventions`).
6. `CATEGORIA=GPU`/`loja=kabum` (Sprints 4/29) confirmaram no mundo real: rodadas de
   coleta segmentada seguem mostrando Pichau bloqueada no CI enquanto Kabum/Terabyte
   coletam normalmente — a limitação é estável e conhecida, não motivo de alarme.

**A lição a replicar em qualquer loja nova que apresente o mesmo padrão** (bloqueio
sistemático e repetível de IP de datacenter, confirmado por múltiplos runs): não é
"a extração está com bug" — é um limite físico do ambiente (CI roda de datacenter).
Aplicar o mesmo padrão do item 5 acima (retry com backoff + challenge honesta) e
**documentar a decisão** nos mesmos 3 lugares que a Pichau está documentada:
`README.md` ("Limitação conhecida"), `CLAUDE.md` ("Known limitation") e no relatório
de sprint correspondente — não deixar como conhecimento tácito só no código.

## 4. Metodologia de validação (replicar para qualquer loja nova)

Esta é a sequência real usada para "estabilizar" Kabum e Terabyteshop e para
confirmar/documentar o limite da Pichau — não pule etapas:

1. **Inspecionar a página real antes de escrever qualquer código.** Abrir a URL de
   teste num navegador de verdade (ex.: `mcp__claude-in-chrome__javascript_tool`) e
   checar, nesta ordem: `script[type='application/ld+json']` (tem `Product` ou
   `ProductGroup`? tem `offers.price`/`offers.availability`?), meta tags
   (`og:price:amount`, `og:title`, `product:availability`), seletores CSS de preço
   e o texto/classe exata do indicador de esgotado (ex.: o botão "ESGOTADO" da
   Tuyo, confirmado ao vivo antes de escrever `scrapers/tuyo.py`). Não adivinhe a
   estrutura por semelhança com outra loja.
2. **Escrever a subclasse `ScraperBase`** seguindo a ordem fixa JSON-LD → meta tags
   → CSS → JS (skill `backend-conventions`), decidindo disponibilidade **antes** do
   preço.
3. **Testar local com `headless=False`** contra a(s) URL(s) de teste reais — se
   houver uma variante esgotada e uma disponível (como os 2 casos usados para
   validar a Tuyo), testar as duas, não só o caminho feliz.
4. **Testar local com `headless=True`** também — confirma que o resultado não
   depende de uma janela visível (é o que roda de verdade no CI).
5. **Rodar no CI de verdade** via `workflow_dispatch` com `loja=<slug>` numa branch
   de teste (`GITHUB_BRANCH` no `.env`, ver `CLAUDE.md`), **3 vezes seguidas**.
6. **Comparar cada run contra a verdade local** (mesmo preço, mesma disponibilidade,
   mesmo nome). Só chamar de "estabilizada em CI" com **3/3 runs batendo** — é a
   mesma barra usada para Kabum/Terabyte em 01/07/2026, não um número arbitrário.
7. **Se algum run falhar/bloquear**, olhar o log de `_debug_page` (título + body
   snippet, sempre presente no CI) antes de mexer em código — descubra se é
   challenge (ver seção 2) ou bug de extração real. Só depois de confirmar
   bloqueio sistemático (múltiplos runs, não um flake isolado) é que se aplica o
   padrão de retry da Pichau.
8. **Registrar o resultado** no relatório de sprint correspondente (`project/
   sprint_v<N>.md`) com os números reais (ex.: "3/3 runs CI = local, R$ X,XX") —
   nunca "testado" sem o número. Se a loja precisar do tratamento tipo Pichau,
   registrar a decisão também em `README.md`/`CLAUDE.md`, como já é feito para ela.

## 5. Checklist rápido para uma loja nova

- [ ] Página real inspecionada no navegador (JSON-LD/meta/CSS/indicador de esgotado)
- [ ] Subclasse `ScraperBase` escrita (JSON-LD → meta → CSS → JS; disponível antes do preço)
- [ ] Testado local `headless=False` e `headless=True`, disponível E esgotado se houver os dois
- [ ] Registrada em `SCRAPERS` (`main.py`)
- [ ] Rodada 3× no CI via `workflow_dispatch loja=<slug>` numa branch de teste
- [ ] 3/3 runs batendo contra a verdade local, ou bloqueio confirmado (não 1 run isolado)
- [ ] Se bloqueada sistematicamente: retry+challenge honesta (padrão Pichau) + decisão documentada em README/CLAUDE.md/sprint report
- [ ] Resultado (números reais dos runs) registrado no relatório de sprint
