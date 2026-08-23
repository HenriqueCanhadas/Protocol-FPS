---
name: frontend-design-system
description: Design system do front-end do PROTOCOL FPS — tema "terminal CRT" dark-only (cores, fontes, tokens em theme.css), padrões de formatação pt-BR (preço, data/hora America/Sao_Paulo), componentes reutilizáveis existentes (AppHeader, NavDrawer, ConfirmModal, Toast), convenções de layout/breakpoints, ícones (glifos Unicode, sem lib), estados de loading/vazio/erro, e tom de voz dos textos em português (botões imperativos maiúsculos, confirmações diretas). Use sempre que for criar ou estilizar qualquer tela/componente em frontend-flask/frontend/, formatar preço ou data, ou escrever texto visível ao usuário.
---

# Front-end — Design System (PROTOCOL FPS)

Referência de estilo para `frontend-flask/frontend/src/`. **Não existe Tailwind, CSS
Modules, styled-components ou biblioteca de componentes** (`shadcn/ui` etc.) neste
projeto — não introduza nenhum desses sem alinhar antes com o usuário, é uma mudança
de arquitetura, não um detalhe de estilo.

## Quando usar

- Criar uma página, modal, ou componente novo.
- Escolher cor, fonte, espaçamento, ou breakpoint para algo na UI.
- Formatar preço, data/hora, ou qualquer texto visível ao usuário.
- Adicionar um estado de loading/vazio/erro.
- Decidir o texto de um botão, toast ou diálogo de confirmação.

## 1. Abordagem de estilo

CSS puro, sem framework. Tokens globais e primitivos compartilhados vivem em
`src/styles/theme.css` (header, drawer, botões, forms, toast, loading, login, modal de
confirmação). Cada página define seu próprio CSS local como template string no topo do
arquivo (`const css = \`...\``) renderizado via `<style>{css}</style>` — é o padrão
usado em `Dashboard.jsx`, `NovoProduto.jsx`, `Usuarios.jsx`, `Conta.jsx`. Siga esse
mesmo padrão para telas novas: tokens genéricos vão para `theme.css`, estilo específico
da página fica local no próprio arquivo.

## 2. Tema — "terminal CRT" dark-only

Não existe modo claro. O tema é intencionalmente retrô/hacker: fundo quase preto,
verde fosforescente, scanlines sutis (`body::before` em `theme.css`), `.glow` com
`text-shadow` para destaque. Ao criar algo novo, mantenha essa estética — não introduza
cores fora da paleta abaixo nem um visual "clean/SaaS" genérico.

### Tokens (`src/styles/theme.css`, `:root`)

```css
--bg:#060908; --bg2:#0d1410; --bg3:#131c15; --bg4:#182019;
--green:#39ff14; --green-dim:#1d8a09; --green-glow:rgba(57,255,20,.15); --green-soft:rgba(57,255,20,.08);
--amber:#ffb800; --red:#ff4444; --blue:#4da6ff;
--text:#d8f0d0; --text-dim:#7a9a72; --text-muted:#4a6644;
--border:#1e2e1a; --border2:#253322;
--mono:'JetBrains Mono','Courier New',monospace;
--display:'Bebas Neue','Impact',sans-serif;
--fs-xs:.75rem; --fs-sm:.85rem; --fs-base:.95rem; --fs-md:1.05rem; --fs-lg:1.15rem;
```
`html { font-size: 15px }` é a base do `rem`. Sempre use as variáveis CSS (`var(--x)`),
nunca hex/rgb literal — se precisar de uma cor nova, adicione um token em `theme.css`
em vez de espalhar valores soltos pelas páginas.

### Semântica das cores — não trocar

| Uso | Token | Onde aparece |
|---|---|---|
| Sucesso / positivo / marca | `var(--green)` | `.status-badge.ok`, `.btn-primary`, `.filter-btn.active`, `.sort-btn.active` |
| Atenção / destaque secundário | `var(--amber)` | `.status-badge.alert`, `.price-menor` (menor preço), `.action-btn.toggle-on` |
| Perigo / negativo / destrutivo | `var(--red)` | `.status-badge.off`, `.btn-danger`, `.field-error`, `.login-error` |
| Neutro / texto secundário | `var(--text-dim)` / `var(--text-muted)` | hints, legendas |
| Bordas padrão | `var(--border)` / `var(--border2)` | cards, tabelas, inputs |

Classes utilitárias globais para texto inline: `.amber`, `.red`, `.green`, `.dim` —
use em `<span className="green">R$ ...</span>` em vez de estilo inline.

## 3. Tipografia

Duas fontes via Google Fonts (`index.html`): **JetBrains Mono** (`--mono`, corpo/UI,
pesos 300/400/500/700) e **Bebas Neue** (`--display`, headings/logo/números de
destaque como preços e stat cards). Regra: texto corrido e controles → `--mono`;
títulos, valores de preço em destaque e números grandes → `--display`. Botões e labels
são consistentemente `text-transform: uppercase` com `letter-spacing` largo
(`.1em`–`.35em`) — siga esse padrão em elementos novos do mesmo tipo. Peso de fonte
raramente é setado à mão; só sobrescreva quando o padrão (herdado da fonte) não for
suficiente.

## 4. Formatação pt-BR — sempre usar os helpers existentes

**Preço**: não use `Intl.NumberFormat` nem escreva a formatação na mão de novo — use
o padrão já estabelecido (helper `fmtBRL`, ver `Dashboard.jsx`):
```js
`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
```

**Data/hora**: sempre pelos helpers centralizados em `src/utils/datas.js`
(`dataBRT`, `horaBRT`, `dataHoraBRT`, `diaBRT`, `inicioDoDiaBRT`) — todos forçam
`timeZone: "America/Sao_Paulo"`. Nunca formate data direto com `toLocaleString` numa
página nova sem passar por esses helpers; não adicione `date-fns`/`dayjs`, o projeto
não usa lib de data.

`<html lang="pt-BR">` — todo texto visível ao usuário é português do Brasil.

## 5. Componentes reutilizáveis existentes (`src/components/`)

Antes de criar um componente novo, veja se um destes já serve:
- `AppHeader.jsx` — barra superior + relógio ao vivo.
- `NavDrawer.jsx` — menu lateral deslizante (prop `isAdmin` para itens admin-only).
- `ConfirmModal.jsx` — modal de confirmação. Props: `confirm={titulo, corpo, icone,
  isDanger}`, `onCancel`, `onOk`. `isDanger` alterna entre `.btn-danger` e
  `.btn-primary` no botão de confirmar.
- `Toast.jsx` — notificação toast. Prop `toast={visible, tipo, msg}`; `tipo` é
  `"error"` ou `"ok"`.
- `LoginScreen.jsx` — tela de login.

**Não existe abstração de `<Button variant/size>`** — botões são
`<button className="btn-primary|btn-secondary|btn-danger">` direto no ponto de uso.
Siga esse padrão em vez de criar um componente `Button`.

## 6. Layout e breakpoints

Sem grid/spacing utilities de framework — cada página define seus próprios
`@media (max-width: ...)`. Breakpoints já em uso: `640px` (telas de formulário —
`Conta.jsx`, `NovoProduto.jsx`, `Usuarios.jsx`) e `700px`/`480px` (`Dashboard.jsx`,
`theme.css`). Reuse esses valores em vez de inventar um breakpoint novo.

Padrão de grid de cards de estatística:
```css
.stats-bar { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1px; }
```

Cards/linhas usam `border` + fundo `var(--bg2)`/`var(--bg3)` para hierarquia — não
`box-shadow` (não combina com a estética CRT plana). Modais seguem o par
`.confirm-overlay`/`.confirm-box` (overlay full-screen) já definido em `theme.css`.

## 7. Ícones

**Sem biblioteca de ícones** (nada de lucide-react/heroicons/react-icons). Ícones são
glifos Unicode usados como texto: `⚡ ＋ ◈ ◉ ✕ ★ ⚠`. Para um gráfico específico
(histograma de preço no modal de histórico) há um `<svg>` inline em `Dashboard.jsx` —
esse é o único caso de SVG customizado; siga o mesmo caminho (inline, sem lib) se
precisar de outro gráfico.

## 8. Estados de loading / vazio / erro

**Loading**: `<div className="loading"><div className="spinner" /></div>`, texto
opcional tipo `"CARREGANDO DADOS..."` (maiúsculo). Para loading mais simples, texto
puro como `"Carregando usuários…"` também é aceito.

**Vazio**: sempre `"Nenhum ..."` + contexto, ex.: `"Nenhum item monitorado..."`,
`"Nenhum resultado para \"...\"."`, `"Nenhum alerta disparado hoje."`,
`"Nenhum produto adicionado."`. Quando fizer sentido, inclua um CTA inline (link de
ação) na própria mensagem de vazio, como no Dashboard.

**Erro**: classe `.field-error` (vermelho) para erros de validação de campo, ex.:
`"Informe um nome não vazio"`. Toasts de erro usam o prefixo `"ERRO: ..."`.

## 9. Tom de voz dos textos (português)

- Botões e labels: **imperativo, verbo primeiro, maiúsculo via CSS** — `"Coletar
  agora"`, `"Adicionar à Fila"`, `"Remover selecionados"`, `"ENCERRAR SESSÃO"`.
- Confirmações destrutivas: diretas, com a consequência explícita —
  `"Remover permanentemente: <b>{nome}</b>... Esta ação não pode ser desfeita."`,
  `"Remover todos os itens da fila?"`.
- Sucesso: prefixo `✓` — `"✓ Meta definida em R$..."`.
- Aviso: prefixo `⚠`, geralmente em âmbar.
- Sem gírias nem tom informal-descontraído; é terso e direto, não formal-corporativo.

## 10. Lint/format

Não há ESLint nem Prettier configurados no projeto — não assuma regras de lint que
não existem; siga apenas a formatação já presente no arquivo que estiver editando.
