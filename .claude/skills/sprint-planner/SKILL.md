---
name: sprint-planner
description: Lê o arquivo `todo` (raiz do repo PROTOCOL FPS), dividido em seções de versão (-----------------V<N>------------------), classifica cada item por status (OK- concluído, Pending- iniciado, - a fazer), agrupa em sprints por dias e (re)gera o relatório `project/sprint_v<N>.md` da versão correspondente com a tabela SPRINT | TEST | STATUS | RESULTS e a seção "Skills Futuras". Use quando o usuário pedir para criar/atualizar sprints, planner, roadmap, ou regenerar o relatório de sprints a partir do todo.
---

# Sprint Planner — PROTOCOL FPS

Gera e mantém sincronizados os relatórios de planejamento em `project/sprint_v<N>.md`
a partir do arquivo `todo` na raiz do repositório. O `todo` é dividido em seções de
versão marcadas por `-----------------V<N>------------------`; cada seção gera o seu
próprio relatório (`sprint_v1.md`, `sprint_v2.md`, …). Relatórios de versões já
concluídas (ex.: V1) são **históricos congelados** — só regenere o da versão ativa.
Todo o texto do relatório é em **português** (padrão bilíngue do projeto — ver `CLAUDE.md`).

## Quando usar

- "crie/atualize a sprint", "gere o planner", "regenerar sprint_v<N>.md"
- Depois de editar o `todo` (marcar item como `OK-`, `Pending-` ou adicionar novo `-`)
- Para produzir o relatório `SPRINT | TEST | STATUS | RESULTS` + "Skills Futuras"

## Convenção de status no `todo`

Cada linha não vazia do `todo` é uma tarefa, identificada pelo prefixo:

| Prefixo no `todo` | Significado | Status no relatório |
|-------------------|-------------|---------------------|
| `OK-...`      | Concluído                      | ✅ **Done** |
| `Pending-...` | Iniciado, mas não finalizado   | 🟡 **Pending** |
| `-...`        | A fazer / não iniciado         | ⬜ **Todo** |

Texto entre parênteses no item costuma indicar detalhe/observação de progresso —
use para preencher a coluna **RESULTS**.

## Passo a passo

1. **Ler o `todo`** (raiz do repo) com a tool Read. Identificar as seções de versão
   (`-----------------V<N>------------------`) e trabalhar na seção pedida (por padrão,
   a última = versão ativa). Preservar o número da linha de cada item — a referência
   `todo:<linha>` vai na coluna SPRINT para rastreabilidade.
2. **Classificar** cada linha não vazia pelo prefixo (`OK-`, `Pending-`, `-`).
   Ignorar linhas em branco e blocos que sejam só descrição de meta-tarefa (ex.: o próprio
   pedido de "ajustar planner e skills").
3. **Agrupar em sprints** por tema/afinidade técnica, não pela ordem do arquivo. Regras:
   - Todos os `OK-` vão para **Sprint 0 — Baseline concluído** (histórico).
   - Agrupar os `Pending-` e `-` por área: **Infra/CI**, **Frontend**, **Dados/UI**,
     **Coleta segmentada**, **Multiusuário**, **Documentação**.
   - Priorizar Infra/CI e correções de fuso antes de novas features.
   - Estimar **dias** por sprint (1–2 dias tarefas simples; 3 médias; 4–5 se mexe no banco).
   - Datar a partir do dia seguinte à geração (usar a data atual do contexto), pulando
     fins de semana quando fizer sentido.
4. **Preencher a tabela** `SPRINT | TEST | STATUS | RESULTS` por tarefa:
   - **SPRINT**: `S<n> · <descrição curta> (todo:<linha>)`
   - **TEST**: critério de aceite objetivo / como validar (o que provar que ficou pronto)
   - **STATUS**: ✅ Done / 🟡 Pending / ⬜ Todo
   - **RESULTS**: estado atual (para Done/Pending) ou resultado esperado (para Todo)
5. **Escrever o arquivo** `project/sprint_v<N>.md` da versão trabalhada (criar a pasta
   `project/` se não existir). A numeração das sprints é **contínua entre versões**
   (a V1 terminou na Sprint 7, então a V2 começa na Sprint 8). Ordem de seções:
   1. Cabeçalho + legenda + explicação das colunas
   2. **Visão geral do cronograma** (tabela Sprint | Tema | Período | Dias | Itens)
   3. Uma seção por sprint, cada uma com sua tabela `SPRINT | TEST | STATUS | RESULTS`
   4. **Resumo por status** (contagem Done/Pending/Todo com as linhas do `todo`)
   5. **Skills Futuras (para futura alteração)** — ver abaixo
6. **Skills Futuras**: ao final, listar skills sugeridas derivadas dos sprints, em tabela
   `Skill | Origem (Sprint) | Objetivo | Prioridade`. Marcar `sprint-planner` como já feita.
   Cada skill deve nascer de uma necessidade real de um sprint (ex.: CI → `ci-diagnostics`,
   banco multiusuário → `db-multiusuario`).
7. **Confirmar** ao usuário: caminho do arquivo gerado, nº de itens por status e a lista de
   sprints. Não commitar a menos que o usuário peça.

## Formato exato das colunas (obrigatório)

O cabeçalho da tabela de cada sprint deve ser **exatamente**:

```
| SPRINT | TEST | STATUS | RESULTS |
|--------|------|--------|---------|
```

## Regras de qualidade

- **Idempotente**: rodar de novo sobre um `todo` inalterado deve produzir o mesmo relatório.
- **Rastreável**: toda tarefa referencia `todo:<linha>`.
- **Não inventar tarefas**: só o que está no `todo`. Não remover histórico dos `OK-`.
- **Português** em todo o conteúdo do relatório.
- Se um item `Pending-` já tiver progresso parcial descrito em código/CI, reflita isso em
  RESULTS (ex.: workaround já aplicado no workflow) em vez de tratá-lo como não iniciado.

## Manutenção do ciclo

Quando uma tarefa for concluída: o usuário atualiza o prefixo no `todo`
(`-` → `Pending-` → `OK-`) e roda esta skill de novo para regenerar o
`project/sprint_v<N>.md` da versão ativa. Quando uma versão fechar e uma nova seção
`V<N+1>` surgir no `todo`, congele o relatório antigo e crie o da nova versão.
