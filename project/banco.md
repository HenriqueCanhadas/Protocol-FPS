# PROTOCOL FPS — Documentação do Banco de Dados (Supabase)

> Gerado na **Sprint 6 (05/07/2026)** por introspecção do banco real (OpenAPI do
> PostgREST + sondas read-only) e da migração versionada
> [`migrations/sprint5_multiusuario.sql`](migrations/sprint5_multiusuario.sql).
>
> O banco é um **PostgreSQL gerenciado pelo Supabase**. Não há servidor próprio de
> API: o acesso é feito via **PostgREST** (`{SUPABASE_URL}/rest/v1/...`) e
> **GoTrue** (`/auth/v1/...`), controlado por chaves + RLS.

---

## 1. Quem acessa o banco, e com qual chave

| Cliente | Chave | RLS | Uso |
|---|---|---|---|
| Coletor (`main.py`, CI diário) | `SUPABASE_SERVICE_KEY` | **ignora** | Lê `itens` monitorados, grava `historico_precos` e `alertas`, chama `verificar_alertas()` |
| Frontend (SPA React) | `SUPABASE_ANON_KEY` + sessão do usuário | **aplica** | CRUD de `itens`, leitura de `historico_precos`/`alertas`/`usuarios`, sempre filtrado por dono |
| Endpoints server-side (`/api/remover`, `/api/usuarios` — Flask dev / Vercel prod) | `SUPABASE_SERVICE_KEY` | **ignora** | Operações que o RLS bloqueia de propósito (DELETE, admin API), com autorização própria por token de sessão |

**Regra de ouro:** a `SERVICE_KEY` nunca chega ao browser. O frontend só conhece a
`ANON_KEY`; tudo que precisa de privilégio passa pelos endpoints server-side, que
validam o `access_token` da sessão antes de agir.

---

## 2. Diagrama de relacionamentos (tabelas ativas)

```
auth.users (Supabase Auth)
     │ 1:1 (trigger trg_criar_perfil)
     ▼
┌──────────┐
│ usuarios │ id (uuid, PK = auth.users.id) · nivel 1=normal 2=admin
└────┬─────┘
     │ 1:N (itens.user_id → usuarios.id)
     ▼
┌──────────┐   N:1   ┌────────┐
│  itens   │────────▶│ lojas  │  (itens.loja_id → lojas.id)
│          │   N:1   ├────────┤
│          │────────▶│produtos│  (itens.produto_id → produtos.id)
└────┬─────┘         └────────┘
     │ 1:N (historico_precos.item_id → itens.id)
     ▼
┌──────────────────┐
│ historico_precos │  uma linha por leitura de preço
└────┬─────────────┘
     │ 1:N (alertas.historico_id → historico_precos.id)
     ▼            (alertas.item_id → itens.id)
┌──────────┐
│ alertas  │  uma linha por alerta disparado
└──────────┘
```

**Não há `ON DELETE CASCADE`** entre `itens` → `historico_precos` → `alertas`
(exceto `usuarios.id → auth.users.id`, que cascateia). Por isso o endpoint
`/api/remover` apaga manualmente na ordem: `alertas` → `historico_precos` → `itens`.

---

## 3. Tabelas ativas

### 3.1 `usuarios` — perfis e papéis (Sprint 5)

Espelho leve de `auth.users`, criado pela migração `sprint5_multiusuario.sql`.

| Coluna | Tipo | Null | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | não | — | **PK**; FK → `auth.users.id` `ON DELETE CASCADE` |
| `email` | `text` | sim | — | cópia do email do auth (preenchida pelo trigger); **destino dos alertas por email** do dono (Sprint 9) |
| `nome` | `text` | sim | — | nome de exibição (opcional; UI usa email como fallback) |
| `nivel` | `integer` | não | `1` | **papel**: `1` = normal · `2` = admin |
| `notificar_telegram` | `boolean` | não | `false` | Sprint 9: recebe alertas no Telegram (bot/chat pessoal); toggle por usuário na página **Usuários** (Sprint 11, `/api/usuarios` `acao=telegram`) |
| `criado_em` | `timestamptz` | não | `now()` | — |

- Preenchida automaticamente pelo trigger `trg_criar_perfil` a cada signup.
- Promoção a admin: manual (`update usuarios set nivel = 2 ...`) ou pela página
  **Usuários** (endpoint `/api/usuarios`, Sprint 7; página unificada na Sprint 11).
- Admin atual: `pedrosacanhadas@gmail.com` (decisão registrada em 05/07/2026).
- **Exclusão de usuário (Sprint 11):** `/api/usuarios` `acao=excluir` faz a cascata
  manual `alertas → historico_precos → itens` e então remove a conta em
  `auth.users` — só esta última cascateia para `usuarios`. Auto-exclusão → 400.

### 3.2 `lojas` — lojas suportadas

| Coluna | Tipo | Null | Default |
|---|---|---|---|
| `id` | `uuid` | não | `gen_random_uuid()` **PK** |
| `nome` | `text` | não | — |
| `url_base` | `text` | não | — |
| `ativo` | `boolean` | não | `true` |
| `criado_em` | `timestamptz` | não | `now()` |

Linhas atuais (o `nome` minúsculo e sem espaços deve casar com o dict `SCRAPERS`
do `main.py`):

| nome | url_base | slug do scraper |
|---|---|---|
| Kabum | https://www.kabum.com.br | `kabum` |
| Pichau | https://www.pichau.com.br | `pichau` |
| Terabyteshop | https://www.terabyteshop.com.br | `terabyteshop` |
| Tuyo | https://tuyo.com.br | `tuyo` |
| Playstation | https://store.playstation.com | `playstation` |
| Logitec | https://www.logitechstore.com.br | `logitec` |
| Tangle Teezer | https://www.tangleteezer.com.br | `tangleteezer` |
| Amazon | https://www.amazon.com.br | `amazon` |
| Shopee | https://shopee.com.br | `shopee` |
| Aliexpress | https://pt.aliexpress.com | `aliexpress` |
| Mocadopop | https://www.mocadopop.com.br | `mocadopop` |

### 3.3 `produtos` — categorias de hardware

| Coluna | Tipo | Null | Default |
|---|---|---|---|
| `id` | `uuid` | não | `gen_random_uuid()` **PK** |
| `nome` | `text` | não | — |
| `categoria` | `text` | não | — |
| `criado_em` | `timestamptz` | não | `now()` |

Linhas atuais — a coluna `categoria` é a sigla usada nos filtros do Dashboard, no
form de cadastro e na coleta segmentada (`CATEGORIA` do `main.py`):

| categoria | nome |
|---|---|
| `CPU` | Processador |
| `GPU` | Placa de Vídeo |
| `MOBO` | Placa Mãe |
| `PSU` | Fonte |
| `RAM` | Memória RAM |
| `STORAGE` | Armazenamento (HD/SSD/NVMe — categoria única, inserida na Sprint 3) |

### 3.4 `itens` — produtos monitorados (tabela central)

| Coluna | Tipo | Null | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | não | `gen_random_uuid()` | **PK** |
| `loja_id` | `uuid` | não | — | FK → `lojas.id` |
| `produto_id` | `uuid` | não | — | FK → `produtos.id` (categoria) |
| `url` | `text` | não | — | URL da página do produto na loja |
| `nome_na_loja` | `text` | não | — | nome exibido (definido pelo usuário no cadastro) |
| `preco_meta` | `numeric` | sim | — | alvo do alerta `abaixo_meta` (null = sem meta) |
| `monitorando` | `boolean` | não | `true` | `false` pausa a coleta (badge OFF na UI) |
| `criado_em` | `timestamptz` | não | `now()` | — |
| `user_id` | `uuid` | não | `auth.uid()` | **dono** (Sprint 5); FK → `usuarios.id`; índice `idx_itens_user_id` |

- Escrita: frontend (INSERT no cadastro; UPDATE de meta/monitorando e, desde a
  Sprint 12, de `nome_na_loja` e `produto_id` pelos modais "Alterar nome"/"Alterar
  categoria" — RLS exige ser dono ou admin); DELETE apenas via `/api/remover`
  (SERVICE_KEY, sem política de DELETE).
- Leitura: frontend (RLS filtra por dono/admin) e coletor (SERVICE_KEY, vê tudo).
- **Unicidade** (Sprint 8): `unique (url, user_id)` — constraint `itens_url_user_key`.
  Substituiu a `itens_url_key` original (URL única **global**, resquício
  pré-multiusuário descoberto na migração dos dados legados): usuários diferentes
  podem monitorar a mesma URL; o mesmo usuário, não.

### 3.5 `historico_precos` — leituras de preço

| Coluna | Tipo | Null | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | não | `gen_random_uuid()` | **PK** |
| `item_id` | `uuid` | não | — | FK → `itens.id` |
| `preco` | `numeric` | **sim** (Sprint 41) | — | preço coletado; `null` quando não há preço confirmado |
| `disponivel` | `boolean` | não | `true` | `false` = esgotado no momento da leitura |
| `encontrado` | `boolean` | não | `true` (Sprint 41) | `false` = o scraper NÃO confirmou nada sobre o produto (erro, timeout, challenge/bloqueio ou seletor ausente); distinto de `disponivel=false` (esgotamento confirmado) |
| `coletado_em` | `timestamptz` | não | `now()` | **UTC** (o front converte para America/Sao_Paulo via `utils/datas.js`) |

- Escrita: **somente o coletor** (não há política de INSERT — a SERVICE_KEY ignora RLS).
  Até a Sprint 41, quando o scraper não obtinha preço (esgotado ou bloqueado),
  **nenhuma linha era gravada** — nem um esgotamento real chegava a aparecer na
  Dashboard. Desde a Sprint 41 (`project/migrations/sprint41_status_localizacao.sql`,
  todo:204) toda leitura vira uma linha, com `encontrado` distinguindo esgotado
  confirmado (`encontrado=true, disponivel=false, preco=null`) de não localizado
  (`encontrado=false`).
- Leitura: frontend (RLS: visível se o item pai é do usuário, ou admin).
- Remoção pontual (registro específico do histórico): `/api/remover` com `tipo=historico`.

### 3.6 `alertas` — alertas disparados

| Coluna | Tipo | Null | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | não | `gen_random_uuid()` | **PK** |
| `item_id` | `uuid` | não | — | FK → `itens.id` |
| `historico_id` | `uuid` | não | — | FK → `historico_precos.id` (leitura que disparou) |
| `tipo` | `text` | não | — | `abaixo_meta` \| `queda_preco` |
| `preco_gatilho` | `numeric` | não | — | preço que disparou o alerta |
| `preco_anterior` | `numeric` | sim | — | preço da leitura anterior (null em `abaixo_meta`) |
| `notificado_email` | `boolean` | não | `false` | resultado do envio do email |
| `notificado_telegram` | `boolean` | não | `false` | resultado do envio do Telegram |
| `criado_em` | `timestamptz` | não | `now()` | — |

- Escrita: somente o coletor (`main.py` insere após disparar Email + Telegram).
- Leitura: frontend ("Alertas recentes" do Dashboard; RLS por dono/admin).

---

## 4. View

### `ultimo_preco`

View de conveniência que junta cada item à sua **última leitura** de preço:

| Coluna | Origem |
|---|---|
| `item_id`, `nome_na_loja`, `url`, `preco_meta`, `monitorando` | `itens` |
| `loja` | `lojas.nome` |
| `categoria`, `produto` | `produtos.categoria`, `produtos.nome` |
| `preco`, `disponivel`, `coletado_em` | última linha de `historico_precos` do item |

> **Nota:** o Dashboard atual **não** usa esta view — ele calcula o último preço no
> cliente (busca `historico_precos` ordenado e pega a 1ª linha por item). A view
> permanece disponível como alternativa de otimização futura.

---

## 5. Funções e triggers

### 5.1 RPC `verificar_alertas(p_item_id uuid, p_preco_atual numeric)`

Chamada pelo coletor após salvar cada leitura. **Comportamento confirmado por sonda
em 05/07/2026** (função **read-only** — não grava nada; contagem de `alertas`
idêntica antes/depois das chamadas):

| Situação | Retorno |
|---|---|
| Item inexistente | `[]` |
| Preço sem queda e acima da meta | `[]` |
| `p_preco_atual` **menor** que a última leitura (qualquer queda, até 1%) | linha `{tipo: "queda_preco", preco_gatilho, preco_anterior}` |
| `p_preco_atual` **abaixo do `preco_meta`** do item | linha `{tipo: "abaixo_meta", preco_gatilho, preco_anterior: null}` |
| Abaixo da meta **e** em queda | **as duas linhas** (o coletor notifica e grava cada uma) |

Quem age sobre o retorno é o `main.py`: para cada linha ele dispara Email +
Telegram e insere em `alertas` com os flags `notificado_*`. A função não faz
deduplicação — a cadência de 1 coleta diária evita repetição na prática.

> O corpo da função vive no Supabase (não está versionado neste repo). Ao alterá-la,
> registre o novo SQL em `project/migrations/`.

### 5.2 RPC `is_admin()` (Sprint 5)

`SECURITY DEFINER`; retorna `true` se `auth.uid()` tem `usuarios.nivel >= 2`.
Usada dentro das políticas de RLS (evita recursão na própria tabela `usuarios`).
Fonte: `migrations/sprint5_multiusuario.sql`.

### 5.3 Trigger `trg_criar_perfil` → `criar_perfil_usuario()` (Sprint 5)

`AFTER INSERT ON auth.users`; cria a linha correspondente em `usuarios`
(`nivel = 1`) a cada signup. `SECURITY DEFINER`, idempotente
(`ON CONFLICT (id) DO NOTHING`). Fonte: `migrations/sprint5_multiusuario.sql`.

---

## 6. RLS — Row Level Security (Sprint 5)

RLS **habilitado** em `usuarios`, `itens`, `historico_precos` e `alertas`.
Sem sessão (anon puro), **todas retornam 0 linhas**. Políticas (todas `to authenticated`):

| Tabela | Política | Comando | Regra |
|---|---|---|---|
| `usuarios` | `usuarios_select` | SELECT | `id = auth.uid() OR is_admin()` |
| `itens` | `itens_select` | SELECT | `user_id = auth.uid() OR is_admin()` |
| `itens` | `itens_insert` | INSERT | `user_id = auth.uid() OR is_admin()` |
| `itens` | `itens_update` | UPDATE | dono ou admin (USING e WITH CHECK) |
| `historico_precos` | `historico_select` | SELECT | item pai é do usuário, ou admin |
| `alertas` | `alertas_select` | SELECT | item pai é do usuário, ou admin |

**Ausências deliberadas** (a operação passa só pela SERVICE_KEY server-side):
- `DELETE` em qualquer tabela → apenas `/api/remover` (que valida dono/admin via token);
- `INSERT` em `historico_precos`/`alertas` → apenas o coletor;
- `UPDATE`/`INSERT` em `usuarios` → apenas trigger, migração e `/api/usuarios`.

`lojas` e `produtos` são **dados de referência compartilhados** — mantêm as
políticas de leitura para autenticados que já existiam antes da Sprint 5.

---

## 7. Fluxos de dados (resumo)

```
COLETA (diária 12:00 UTC ou manual):
  main.py ──SERVICE_KEY──▶ SELECT itens (escopo: tudo | ITEM_ID | CATEGORIA/LOJA)
     └─▶ scraper Playwright ─▶ INSERT historico_precos
            └─▶ RPC verificar_alertas(item, preco)
                   └─▶ para cada alerta: Email + Telegram + INSERT alertas

FRONTEND (sessão autenticada, RLS ativo):
  Dashboard ─▶ SELECT itens (+lojas/produtos/usuarios) + historico_precos + alertas
  NovoProduto ─▶ INSERT itens (user_id = usuário logado)
  Ações ─▶ UPDATE itens (meta/monitorando/nome/categoria) · POST /api/remover · POST /api/trigger-coleta

SERVER-SIDE (SERVICE_KEY + autorização por token de sessão):
  /api/remover  ─▶ valida dono/admin ─▶ DELETE alertas → historico_precos → itens
  /api/usuarios ─▶ exige admin ─▶ GoTrue admin API + PostgREST:
                    criar · trocar_senha · listar (perfis + auth.users + nº itens)
                    telegram (notificar_telegram) · excluir (cascata + conta)
```

---

## 8. Estruturas legadas

Tabelas de fases antigas do projeto, fora do fluxo atual. **Situação em 08/07/2026:**

| Tabela | Situação |
|---|---|
| `Menores Preços Kabum` | **dropada pelo usuário** (08/07/2026), após a migração da Sprint 8 |
| `Monitoramento Kabum` | idem |
| `produtos_kabum` / `historico_precos_kabum` | idem — o drop também **desativou o coletor legado** que ainda gravava nelas |
| `produtos_funko` / `historico_precos_funko` | **mantidas e intactas** (9 / 675 linhas — restrição do todo:104; nenhum código deste repo as toca) |

> Os dados Kabum legados vivem agora em `itens`/`historico_precos` (categoria
> `DIVERSOS`, dono pedrosacanhadas) — migrados pela `sprint8_diversos_migracao.sql`.
> A migração referenciava as tabelas dropadas, então ela **não é re-executável**;
> permanece versionada como registro histórico.

---

## 9. Migrações

- Convenção desde a Sprint 5: alterações de schema são versionadas em
  **`project/migrations/*.sql`** e aplicadas **manualmente no SQL Editor** do
  Supabase (a SERVICE_KEY só executa DML via PostgREST — DDL não passa por ela).
- Scripts devem ser **idempotentes** (`if not exists`, `on conflict`, `drop ... if exists`).
- Histórico:

| Arquivo | Sprint | Conteúdo |
|---|---|---|
| `sprint5_multiusuario.sql` | S5 (05/07/2026) | `usuarios`, trigger de perfil, `itens.user_id` + backfill, `is_admin()`, políticas RLS |
| `sprint8_diversos_migracao.sql` | S8 (07/07/2026) | categoria `DIVERSOS`, troca `itens_url_key` → `unique (url, user_id)`, migração dos dados legados Kabum (itens + histórico) p/ pedrosacanhadas |
| `sprint9_alertas_por_usuario.sql` | S9 (07/07/2026) | `usuarios.notificar_telegram` (flag do bot pessoal; `true` só p/ pedrosacanhadas) — email do alerta passa a ir ao dono do item |

O que **não** está versionado (criado antes da convenção): `lojas`, `produtos`,
`itens` (colunas originais), `historico_precos`, `alertas`, a view `ultimo_preco`
e a RPC `verificar_alertas` — documentados nas seções acima a partir do banco real.
