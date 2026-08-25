/**
 * pages/Admin.jsx — PROTOCOL FPS
 * Métricas operacionais do banco — gate por usuarios.ver_banco, NÃO por
 * isAdmin (Sprint 32b, pedido do usuário: por padrão só o dono da conta
 * enxerga esta página; só ele pode liberar outra pessoa, pela tela
 * Usuários).
 *
 * Sprint 32 (todo:218): contagens de linhas (itens/leituras/alertas/
 * usuários), tamanho das tabelas principais e saúde da coleta (última
 * leitura geral e por loja, com contagem nas últimas 24h). Tudo vem de
 * uma única RPC — admin_estatisticas() — que roda no banco com
 * SECURITY DEFINER e checa pode_ver_banco() internamente (migrations
 * sprint32_admin_estatisticas.sql + sprint32b_ver_banco.sql +
 * sprint32c_admin_disco.sql); "saúde da coleta" aqui é um proxy
 * observável a partir de historico_precos, não uma leitura do histórico
 * de execuções do GitHub Actions (isso exigiria uma integração nova com
 * a API do GitHub, fora do escopo desta sprint).
 *
 * Sprint 32c (pedido do usuário): medidor de cota de disco (banco inteiro
 * — pg_database_size, não só as 6 tabelas do app — vs. a cota do plano
 * Supabase) e barra proporcional por tabela em vez de tabela de texto.
 *
 * Sprint 38 (todo:233): detalhamento por item — dono, loja, categoria e
 * quantidade de leituras (historico_precos) de cada item cadastrado, um
 * nível abaixo das contagens agregadas da Sprint 32 (migration
 * sprint38_admin_detalhe_usuarios.sql, mesma RPC admin_estatisticas()).
 *
 * Sprint 46 (V5, todo:247): layout em 2 blocos, mesmo espírito
 * conteúdo+sidebar do Dashboard (.dash-grid, Sprint 21) — decidido com o
 * usuário: bloco principal (largo) = "Detalhe por usuário e item" (a tabela
 * densa, com busca/filtro/ordenação); bloco lateral (estreito, fixo ao
 * rolar) = os 4 painéis de métrica agregada (Visão geral/Espaço em disco/
 * Tamanho por tabela/Saúde da coleta), mesmo papel que a sidebar do
 * Dashboard (cards de resumo) tem em relação à tabela de preços.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { dataHoraBRT } from "@/utils/datas";
import { formatBytes } from "@/utils/format";
import { buscarEstatisticas } from "@/services/admin.service";

// Cota do plano Supabase — NÃO é uma informação que o Postgres saiba
// sozinho (não existe função de SQL para "tamanho máximo do meu plano"),
// então fica hardcoded aqui. Atualizar se o plano mudar (Free = 500 MB;
// Pro inclui 8 GB). 1 MB = 1024×1024 bytes (mesma base que pg_size_pretty).
const ADMIN_QUOTA_BYTES = 500 * 1024 * 1024;
const ADMIN_QUOTA_LABEL = "500 MB (plano Free)";

// Limiares de severidade do medidor — mesma semântica de cor já usada no
// resto do app (verde=ok, âmbar=atenção, vermelho=crítico).
function severidadeUso(pct) {
  if (pct >= 90) return "crit";
  if (pct >= 70) return "warn";
  return "ok";
}

// Nomes curtos de propósito (Sprint 56): a coluna dr-nome é estreita na
// sidebar (admin-sidebar .disco-row .dr-nome), "Histórico de preços" e
// "Produtos (categorias)" quebravam em várias linhas e desalinhavam a barra
// e o tamanho ao lado.
const NOME_TABELA = {
  itens: "Itens", historico_precos: "Histórico", alertas: "Alertas",
  usuarios: "Usuários", produtos: "Categorias", lojas: "Lojas",
};

const css = `
.admin-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap { width:min(1800px,100%); display:flex; flex-direction:column; gap:2rem; }

/* grid conteúdo (detalhe) + sidebar (métricas agregadas) — Sprint 46, mesmo
   corte de 1100px/2rem de gap já usado no .dash-grid do Dashboard (Sprint 21) */
.admin-grid { display:grid; grid-template-columns:minmax(0,1fr) 360px; gap:2rem; align-items:start; }
.admin-content { display:flex; flex-direction:column; gap:2rem; min-width:0; }
.admin-sidebar { display:flex; flex-direction:column; gap:1.25rem; position:sticky; top:1.75rem; }
@media (max-width:1100px) {
  /* minmax(0,1fr), não só 1fr: sem o mínimo travado em 0 a track ainda
     cresce para caber o min-content dos descendentes (ex.: a tabela de
     detalhe) e "estoura" a viewport — mesmo efeito do min-width:0 do flex,
     só que para grid. Achado só ao testar de fato em 412px (Galaxy A30). */
  .admin-grid { grid-template-columns:minmax(0,1fr); }
  .admin-sidebar { position:static; }
}
/* painéis de métrica ficam mais estreitos na sidebar — reduz a densidade
   pensada originalmente para os 1800px do .page-wrap inteiro */
.admin-sidebar .disco-row .dr-nome { width:96px; }
/* Sprint 57: "grid-template-columns:1fr 1fr" forçava 2 colunas mesmo com só
   ~136px por célula — "Itens monitorados"/"Leituras de preço" (com o
   letter-spacing:.2em do .stat-label) não cabiam numa linha e quebravam no
   meio da palavra, torto. Removida a força de 2 colunas: o
   "repeat(auto-fit,minmax(160px,1fr))" do .stat-grid base já resolve isso
   sozinho — a ~290px de largura útil da sidebar, 160px mínimo por célula não
   cabe em 2 colunas, então o auto-fit já colapsa pra 1 coluna sem CSS extra. */

/* Sem barra de rolagem na página (Sprint 54, mesma estrutura do .dash-grid
   do Dashboard, Sprint 21/V4): acima de 1100px (mesmo corte do grid) a
   tabela de detalhe e a sidebar rolam por dentro de si mesmas — o resto
   (header, título, footer) fica sempre visível. O componente trava a altura
   de #app via JS (useEffect), não CSS — mesmo mecanismo do Dashboard. */
@media (min-width:1101px) {
  .admin-main { min-height:0; overflow:hidden; }
  .admin-grid { flex:1; min-height:0; align-items:stretch; }
  /* padding-top (Sprint 58, ajustado na 59): o rótulo de cada card
     (.form-card::before) fica meio pra fora da borda
     (transform:translateY(-50%)); nos cards do meio essa metade "flutua"
     livre no gap de 1.25rem entre os cards, mas o PRIMEIRO card não tem gap
     acima — sem esse respiro o overflow-y:auto da sidebar cortava a metade
     de cima do rótulo bem na borda de cima ("VISÃO GERAL" aparecia cortado
     ao meio). O MESMO padding-top é dado ao .admin-content (que não
     precisava da folga em si — sua única card não chegava a ser cortada),
     só para as duas colunas começarem exatamente na mesma altura — sem isso
     a tabela de detalhe ficava ~13px mais alta que os cards da sidebar
     (reportado pelo usuário como desalinhamento entre as duas colunas). */
  .admin-content { min-height:0; overflow:hidden; padding-top:.9rem; }
  /* só há 1 card no conteúdo (Detalhe por usuário e item) — ele estica pra
     ocupar a coluna inteira; filtros/contagem/dica ficam fixos, só a
     tabela (.adm-scroll) rola verticalmente por dentro */
  .admin-content .form-card { flex:1; display:flex; flex-direction:column; min-height:0; }
  .admin-content .adm-scroll { flex:1; min-height:0; overflow-y:auto; }
  /* cabeçalho fixo na rolagem interna da tabela de detalhe (Sprint 62,
     todo:280) — mesmo padrão do thead do Dashboard (ProductTable); só faz
     sentido aqui dentro (só neste breakpoint a tabela rola por dentro de si
     mesma) e só em .admin-content — a "Saúde da Coleta" da sidebar rola como
     bloco único junto dos outros painéis, não tem rolagem própria */
  .admin-content .adm-table thead { position:sticky; top:0; z-index:2; background:var(--bg2); }
  .admin-sidebar { min-height:0; overflow-y:auto; padding-top:.9rem; padding-right:.4rem; }
}

.form-card { background:var(--bg2); border:1px solid var(--border2); border-top:2px solid var(--green-dim); position:relative; }
.form-card::before { content:attr(data-label); position:absolute; top:-1px; left:1.75rem; background:var(--bg2); color:var(--green-dim); font-size:var(--fs-xs); letter-spacing:.3em; padding:0 .6rem; transform:translateY(-50%); text-transform:uppercase; }
.form-body { padding:1.75rem; }

.stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1.25rem; }
.stat-cell { display:flex; flex-direction:column; gap:.3rem; }
.stat-label { font-size:var(--fs-xs); letter-spacing:.2em; text-transform:uppercase; color:var(--text-dim); }
.stat-value { font-family:var(--display); font-size:1.9rem; color:var(--text); line-height:1.15; }
.stat-value.amber { color:var(--amber); }
.stat-sub { font-size:var(--fs-xs); color:var(--text-muted); }

.adm-table { width:100%; border-collapse:collapse; font-family:var(--mono); font-size:var(--fs-sm); }
.adm-table th { text-align:left; padding:.7rem .9rem; color:var(--text-dim); font-size:var(--fs-xs); letter-spacing:.2em; text-transform:uppercase; border-bottom:1px solid var(--border2); white-space:nowrap; }
.adm-table td { padding:.7rem .9rem; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; }
.adm-table tr:last-child td { border-bottom:none; }
.adm-table tr.total-row td { color:var(--green); border-top:1px solid var(--border2); }
.adm-empty { padding:1.5rem; color:var(--text-dim); font-size:var(--fs-sm); letter-spacing:.08em; }
.adm-hint { font-size:var(--fs-xs); color:var(--text-muted); padding:0 1.75rem 1.5rem; letter-spacing:.03em; line-height:1.6; }
.adm-table td.status-ativo   { color:var(--green); }
.adm-table td.status-pausado { color:var(--text-dim); }
.adm-scroll { overflow-x:auto; }
.adm-filtros { display:flex; gap:.9rem; flex-wrap:wrap; padding:1.5rem 1.75rem 0; }
.adm-filtros .field-input { width:auto; flex:1 1 220px; }
.adm-filtros .field-select { width:auto; flex:0 0 200px; }
.adm-table th.sortable { cursor:pointer; user-select:none; }
.adm-table th.sortable:hover { color:var(--green); }
.adm-table th .sort-arrow { color:var(--green); margin-left:.3rem; }
.adm-filtros-count { font-size:var(--fs-xs); color:var(--text-muted); padding:.9rem 1.75rem 0; letter-spacing:.05em; }

/* Medidor de cota — o fill carrega a severidade (verde/âmbar/vermelho); o
   track é um tom apagado da mesma superfície (bg3), não um cinza genérico. */
.quota-readout { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:.6rem; flex-wrap:wrap; gap:.4rem .9rem; }
.quota-readout .qr-used { font-family:var(--display); font-size:1.6rem; color:var(--text); }
.quota-readout .qr-used .qr-pct { font-family:var(--mono); font-size:var(--fs-base); color:var(--text-dim); margin-left:.5rem; }
.quota-readout .qr-free { font-size:var(--fs-sm); color:var(--text-dim); font-variant-numeric:tabular-nums; }
.quota-track { height:18px; background:var(--bg3); border:1px solid var(--border2); overflow:hidden; }
.quota-fill { height:100%; min-width:2px; transition:width .3s ease; }
.quota-fill.ok   { background:var(--green); }
.quota-fill.warn { background:var(--amber); }
.quota-fill.crit { background:var(--red); }
.quota-scale { display:flex; justify-content:space-between; font-size:var(--fs-xs); color:var(--text-muted); margin-top:.35rem; }

/* Barra proporcional por tabela — magnitude, não severidade: um hue só
   (verde apagado), mais escuro = maior, sem conotação de "problema". */
.disco-tabelas { display:flex; flex-direction:column; gap:.6rem; padding:1.5rem 1.75rem; }
.disco-row { display:flex; align-items:center; gap:.9rem; }
.disco-row .dr-nome { width:150px; flex-shrink:0; font-size:var(--fs-sm); color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.disco-row .dr-track { flex:1; height:10px; background:var(--bg3); border:1px solid var(--border2); }
.disco-row .dr-fill { height:100%; background:var(--green-dim); min-width:2px; }
.disco-row .dr-tamanho { width:70px; flex-shrink:0; text-align:right; font-size:var(--fs-sm); color:var(--text-dim); font-variant-numeric:tabular-nums; }

@media (max-width:640px) {
  .admin-main { padding:1.25rem 1rem; }
  .form-body { padding:1.25rem; }
  .disco-row .dr-nome { width:100px; }
  .adm-filtros { flex-direction:column; }
  .adm-filtros .field-input, .adm-filtros .field-select { flex:1 1 auto; width:100%; }
}
`;

export default function Admin({ podeVerBanco, perfilLoading }) {
  const [stats, setStats]         = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState(null);

  // Sprint 43 (V5, todo:241): busca + filtro por loja + ordenação por
  // qualquer coluna na tabela "Detalhe por usuário e item" — client-side,
  // mesmo padrão do useDashboardFilters (a lista já vem inteira da RPC).
  const [detBusca, setDetBusca]   = useState("");
  const [detLoja, setDetLoja]     = useState("");
  const [detOrdem, setDetOrdem]   = useState({ campo: "usuario", asc: true });

  const detLojas = useMemo(
    () => [...new Set((stats?.itens_detalhe || []).map((it) => it.loja))].sort(),
    [stats]
  );

  const detFiltrado = useMemo(() => {
    let lista = stats?.itens_detalhe || [];
    if (detLoja) lista = lista.filter((it) => it.loja === detLoja);
    const termo = detBusca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((it) =>
        [it.usuario, it.item, it.loja, it.categoria].some((v) => (v || "").toLowerCase().includes(termo))
      );
    }
    const { campo, asc } = detOrdem;
    const dir = asc ? 1 : -1;
    return [...lista].sort((a, b) => {
      const va = a[campo], vb = b[campo];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      if (typeof va === "boolean" && typeof vb === "boolean") return (Number(va) - Number(vb)) * dir;
      return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
  }, [stats, detLoja, detBusca, detOrdem]);

  const alternarOrdem = (campo) =>
    setDetOrdem((o) => (o.campo === campo ? { campo, asc: !o.asc } : { campo, asc: true }));

  const thOrdenavel = (campo, label) => (
    <th className="sortable" onClick={() => alternarOrdem(campo)}>
      {label}{detOrdem.campo === campo && <span className="sort-arrow">{detOrdem.asc ? "▲" : "▼"}</span>}
    </th>
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    const data = await buscarEstatisticas();
    // A RPC antiga (pré-sprint32c) responde OK mas sem tamanho.tabelas/
    // banco_completo_bytes — trata como indisponível em vez de quebrar o
    // render, igual ao caso de a RPC não existir.
    const completo = data && Array.isArray(data?.tamanho?.tabelas) && typeof data?.tamanho?.banco_completo_bytes === "number" && Array.isArray(data?.itens_detalhe);
    setStats(completo ? data : null);
    setErro(completo ? null : "Não foi possível carregar as métricas (rode as migrações sprint32_admin_estatisticas.sql, sprint32b_ver_banco.sql, sprint32c_admin_disco.sql e sprint38_admin_detalhe_usuarios.sql no SQL Editor do Supabase, ou sua conta ainda não tem acesso ao banco liberado).");
    setCarregando(false);
  }, []);

  useEffect(() => { if (podeVerBanco) carregar(); }, [podeVerBanco, carregar]);

  // Sem barra de rolagem na página (Sprint 54) — mesmo mecanismo do
  // Dashboard (index.jsx, Sprint 21): a página passa a ocupar exatamente a
  // viewport, com a tabela de detalhe e a sidebar rolando por dentro de si
  // mesmas. Só entra em telas largas (>1100px, mesmo corte do .admin-grid);
  // no layout empilhado de tela estreita volta a rolar normalmente, como no
  // celular. Mexe só no DOM (inline style de #app + body), nunca no
  // App.jsx — desfeito ao sair do Admin, então as outras páginas não são
  // afetadas.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1101px)");
    const appEl = document.getElementById("app");
    const travar = () => {
      if (!appEl) return;
      if (mq.matches) {
        appEl.style.height = "100vh";
        appEl.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      } else {
        appEl.style.height = "";
        appEl.style.overflow = "";
        document.body.style.overflow = "";
      }
    };
    travar();
    mq.addEventListener("change", travar);
    return () => {
      mq.removeEventListener("change", travar);
      if (appEl) { appEl.style.height = ""; appEl.style.overflow = ""; }
      document.body.style.overflow = "";
    };
  }, []);

  // Mesmo padrão de guarda do /usuarios: espera o perfil carregar antes de
  // expulsar, para não barrar quem tem acesso num deep-link direto.
  if (!podeVerBanco) {
    if (perfilLoading) {
      return (
        <main className="admin-main">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div className="spinner" />
          </div>
        </main>
      );
    }
    return <Navigate to="/" replace />;
  }

  const c = stats?.contagens;
  const t = stats?.tamanho;
  const col = stats?.coleta;
  const maiorTabela = t ? Math.max(...t.tabelas.map((x) => x.bytes), 1) : 1;

  return (
    <>
      <style>{css}</style>
      <main className="admin-main">
        <div className="page-wrap">
          {carregando ? (
            <div className="form-card" data-label="CARREGANDO"><div className="adm-empty">Carregando métricas…</div></div>
          ) : erro ? (
            <div className="form-card" data-label="INDISPONÍVEL"><div className="adm-empty">{erro}</div></div>
          ) : (
            <div className="admin-grid">
              <div className="admin-content">
                <div className="form-card" data-label="DETALHE POR USUÁRIO E ITEM">
                  <div className="adm-filtros">
                    <input
                      className="field-input" type="text" placeholder="Buscar por usuário, item, loja ou categoria..."
                      value={detBusca} onChange={(e) => setDetBusca(e.target.value)}
                    />
                    <select className="field-select" value={detLoja} onChange={(e) => setDetLoja(e.target.value)}>
                      <option value="">Todas as lojas</option>
                      {detLojas.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="adm-filtros-count">
                    {detFiltrado.length} de {stats.itens_detalhe.length} item(ns) — clique numa coluna para ordenar
                  </div>
                  <div className="adm-scroll">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          {thOrdenavel("usuario", "Usuário")}
                          {thOrdenavel("item", "Item")}
                          {thOrdenavel("loja", "Loja")}
                          {thOrdenavel("categoria", "Categoria")}
                          {thOrdenavel("leituras", "Leituras")}
                          {thOrdenavel("monitorando", "Status")}
                        </tr>
                      </thead>
                      <tbody>
                        {!detFiltrado.length ? (
                          <tr><td colSpan={6}>{stats.itens_detalhe.length ? "Nenhum item bate com o filtro." : "Nenhum item cadastrado ainda."}</td></tr>
                        ) : detFiltrado.map((it, idx) => (
                          <tr key={`${it.usuario}-${it.item}-${idx}`}>
                            <td>{it.usuario}</td>
                            <td>{it.item}</td>
                            <td>{it.loja}</td>
                            <td>{it.categoria}</td>
                            <td>{it.leituras}</td>
                            <td className={it.monitorando ? "status-ativo" : "status-pausado"}>
                              {it.monitorando ? "Ativo" : "Pausado"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="adm-hint">
                    Um item por linha — "Leituras" é a contagem de registros em historico_precos
                    para aquele item especificamente (quantas vezes ele já foi coletado), não o
                    total agregado da tabela mostrado em "Tamanho por tabela" ao lado.
                  </div>
                </div>
              </div>

              <div className="admin-sidebar">
                <div className="form-card" data-label="VISÃO GERAL">
                  <div className="form-body">
                    <div className="stat-grid">
                      <div className="stat-cell">
                        <div className="stat-label">Itens monitorados</div>
                        <div className="stat-value">{c.itens_monitorando}</div>
                        <div className="stat-sub">de {c.itens_total} cadastrados ({c.itens_pausados} pausados)</div>
                      </div>
                      <div className="stat-cell">
                        <div className="stat-label">Leituras de preço</div>
                        <div className="stat-value">{c.leituras_total}</div>
                        <div className="stat-sub">total em historico_precos</div>
                      </div>
                      <div className="stat-cell">
                        <div className="stat-label">Alertas hoje</div>
                        <div className="stat-value amber">{c.alertas_hoje}</div>
                        <div className="stat-sub">{c.alertas_total} disparados no total</div>
                      </div>
                      <div className="stat-cell">
                        <div className="stat-label">Usuários</div>
                        <div className="stat-value">{c.usuarios_total}</div>
                        <div className="stat-sub">contas cadastradas</div>
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const usadoBytes = t.banco_completo_bytes;
                  const pct = Math.min(100, (usadoBytes / ADMIN_QUOTA_BYTES) * 100);
                  const sev = severidadeUso(pct);
                  const disponivel = Math.max(0, ADMIN_QUOTA_BYTES - usadoBytes);
                  return (
                    <div className="form-card" data-label="ESPAÇO EM DISCO">
                      <div className="form-body">
                        <div className="quota-readout">
                          <div className="qr-used">
                            {t.banco_completo}
                            <span className="qr-pct">{pct.toFixed(1)}% da cota</span>
                          </div>
                          <div className="qr-free">{formatBytes(disponivel)} disponíveis de {ADMIN_QUOTA_LABEL}</div>
                        </div>
                        <div className="quota-track">
                          <div className={`quota-fill ${sev}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="quota-scale"><span>0</span><span>{ADMIN_QUOTA_LABEL}</span></div>
                      </div>
                      <div className="adm-hint">
                        pg_database_size do banco inteiro (inclui auth/storage/índices geridos
                        pelo Supabase, não só as tabelas do app abaixo) contra a cota do plano —
                        a cota em si não vem do banco, foi informada manualmente e precisa ser
                        atualizada aqui se o plano mudar.
                      </div>
                    </div>
                  );
                })()}

                <div className="form-card" data-label="TAMANHO POR TABELA">
                  <div className="disco-tabelas">
                    {t.tabelas.map((tb) => (
                      <div className="disco-row" key={tb.tabela}>
                        <span className="dr-nome">{NOME_TABELA[tb.tabela] || tb.tabela}</span>
                        <div className="dr-track">
                          <div className="dr-fill" style={{ width: `${(tb.bytes / maiorTabela) * 100}%` }} />
                        </div>
                        <span className="dr-tamanho">{tb.pretty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="adm-hint">pg_total_relation_size — inclui índices e TOAST de cada tabela; barra proporcional à maior tabela da lista.</div>
                </div>

                <div className="form-card" data-label="SAÚDE DA COLETA">
                  <div className="adm-scroll">
                    <table className="adm-table">
                      <thead><tr><th>Loja</th><th>Última coleta</th><th>Leituras (24h)</th></tr></thead>
                      <tbody>
                        {!col.por_loja.length ? (
                          <tr><td colSpan={3}>Nenhuma leitura registrada ainda.</td></tr>
                        ) : col.por_loja.map((l) => (
                          <tr key={l.loja}>
                            <td>{l.loja}</td>
                            <td>{l.ultima_coleta ? dataHoraBRT(l.ultima_coleta, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "nunca"}</td>
                            <td>{l.leituras_24h}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="adm-hint">
                    Última leitura geral: {col.ultima_geral ? dataHoraBRT(col.ultima_geral, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "nunca"}.
                    Proxy observável a partir de historico_precos — não reflete o histórico de execuções do GitHub Actions (sucesso/falha do workflow), que exigiria integração separada com a API do GitHub.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
