---
name: autonomous-execution
description: Regras para executar um plano de sprints já aprovado (ex. project/sprint_v<N>.md) sem parar para pedir autorização a cada passo. Define o que realmente exige parar e perguntar (destrutivo, decisão marcada como "em aberto" no próprio plano, ambiguidade genuína) vs. o que já está implicitamente aprovado por já constar no plano/todo. Use sempre que o usuário pedir para "continuar", "seguir para a próxima sprint", "fazer todas as atualizações" ou equivalente, depois de já ter aprovado um plano.
---

# Execução autônoma de planos aprovados

O usuário pediu explicitamente (18/08/2026): *"pode fazer todas as atualizações não
precisa me pedir autorização a não ser que seja algo crítico ou muito específico"*.
Esta skill formaliza esse comportamento para qualquer plano de sprints aprovado
neste projeto (`project/sprint_v<N>.md`) ou equivalente.

## Regra central

Depois que um plano foi aprovado (o usuário viu e concordou com o `sprint_v<N>.md`
ou o `todo`), **execute sprint a sprint / tarefa a tarefa sem perguntar "posso
seguir?" entre uma e outra**. Uma decisão que já está escrita no plano — mesmo que
seja uma mudança de UX, uma reestruturação de arquivos, ou substituir um padrão
antigo por um novo — **não é "crítica" só por ser uma mudança visível**; ela já foi
decidida no momento em que o plano foi aprovado. Pedir confirmação de novo nesse
ponto é redundante e atrasa o trabalho.

## O que NÃO exige parar para perguntar

- Adotar um modelo de UX/arquitetura que o próprio plano já descreve (ex.: trocar
  botões por linha por uma barra de ações sobre seleção global).
- Consolidar/renomear/reorganizar código quando o plano já pede isso.
- Corrigir uma inconsistência pequena e de baixo risco encontrada no caminho (ex.:
  uma cor fora da paleta, código morto) — só relatar o que foi feito e por quê.
- Escolher a ordem/tamanho dos passos dentro de uma sprint para chegar ao resultado
  descrito no plano.
- Testar e validar (build, `npm run dev`, screenshot) — isso é parte do trabalho,
  não uma ação que precisa de aprovação prévia.

## O que EXIGE parar e perguntar (ou pelo menos avisar antes de agir)

- **Ações destrutivas ou difíceis de reverter** — regra geral de segurança do
  projeto, não específica desta skill: `git push --force`, apagar dados em
  produção, `rm -rf`, etc. Commits/push continuam proibidos sem ordem explícita
  ([[sem-commit-sem-ordem]]).
- **Decisões que o próprio plano marcou como "em aberto"** — ex.: `sprint_v3.md`
  Sprint 21 flagra explicitamente "decisão a validar com o usuário" sobre o que
  substitui o log de scraping mockado do protótipo. Se o plano diz "decidir com o
  usuário", pare e pergunte ali, mesmo que o resto da sprint continue sem pausa.
- **Ambiguidade genuína que o plano não previu** — quando duas leituras razoáveis
  do pedido levam a resultados bem diferentes e não há um valor padrão óbvio.
- **Mudança de escopo** — algo que não está no plano aprovado e que merece virar
  um novo item do `todo` antes de ser feito, não uma decisão unilateral no meio da
  implementação.

## Como comunicar durante a execução

Não silenciar entre sprints. Ao final de cada sprint/tarefa, dar uma atualização
breve: o que mudou, como foi testado (build/`npm run dev`/screenshot/console sem
erros), e qual é o próximo passo — sem transformar isso em um pedido de permissão
("Posso continuar?"). Terminar com "seguindo para a Sprint N" em vez de perguntar.

## Relação com outras memórias/skills

- [[execucao-autonoma-sprints]] (memória) — registra a origem/motivo desta regra.
- [[sem-commit-sem-ordem]] (memória) — a autonomia desta skill **não** se estende a
  commits/push; isso continua exigindo ordem explícita em toda mensagem.
- `sprint-planner` (skill) — gera/atualiza os relatórios que esta skill executa.
