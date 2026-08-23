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
 */
import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
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

const NOME_TABELA = {
  itens: "Itens", historico_precos: "Histórico de preços", alertas: "Alertas",
  usuarios: "Usuários", produtos: "Produtos (categorias)", lojas: "Lojas",
};

const css = `
.admin-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap { width:min(960px,100%); display:flex; flex-direction:column; gap:2rem; }
.breadcrumb { display:flex; align-items:center; gap:.6rem; font-size:var(--fs-sm); letter-spacing:.15em; color:var(--text-dim); text-transform:uppercase; }
.breadcrumb a { color:var(--text-dim); text-decoration:none; transition:color .15s; }
.breadcrumb a:hover { color:var(--green); }
.page-title { font-family:var(--display); font-size:clamp(2.5rem,7vw,4rem); letter-spacing:.08em; color:var(--green); text-shadow:0 0 24px var(--green-dim); line-height:1; }
.page-subtitle { font-size:var(--fs-base); color:var(--text-dim); letter-spacing:.1em; margin-top:.4rem; }

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
.disco-row .dr-nome { width:150px; flex-shrink:0; font-size:var(--fs-sm); color:var(--text); }
.disco-row .dr-track { flex:1; height:10px; background:var(--bg3); border:1px solid var(--border2); }
.disco-row .dr-fill { height:100%; background:var(--green-dim); min-width:2px; }
.disco-row .dr-tamanho { width:70px; flex-shrink:0; text-align:right; font-size:var(--fs-sm); color:var(--text-dim); font-variant-numeric:tabular-nums; }

@media (max-width:640px) {
  .admin-main { padding:1.25rem 1rem; }
  .form-body { padding:1.25rem; }
  .disco-row .dr-nome { width:100px; }
}
`;

export default function Admin({ podeVerBanco, perfilLoading }) {
  const [stats, setStats]         = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const data = await buscarEstatisticas();
    // A RPC antiga (pré-sprint32c) responde OK mas sem tamanho.tabelas/
    // banco_completo_bytes — trata como indisponível em vez de quebrar o
    // render, igual ao caso de a RPC não existir.
    const completo = data && Array.isArray(data?.tamanho?.tabelas) && typeof data?.tamanho?.banco_completo_bytes === "number";
    setStats(completo ? data : null);
    setErro(completo ? null : "Não foi possível carregar as métricas (rode as migrações sprint32_admin_estatisticas.sql, sprint32b_ver_banco.sql e sprint32c_admin_disco.sql no SQL Editor do Supabase, ou sua conta ainda não tem acesso ao banco liberado).");
    setCarregando(false);
  }, []);

  useEffect(() => { if (podeVerBanco) carregar(); }, [podeVerBanco, carregar]);

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
          <nav className="breadcrumb">
            <Link to="/">Dashboard</Link>
            <span>›</span><span>Admin</span>
          </nav>

          <div>
            <div className="page-title">ADMIN</div>
            <div className="page-subtitle">Métricas operacionais do banco — acesso liberado individualmente pelo dono da conta</div>
          </div>

          {carregando ? (
            <div className="form-card" data-label="CARREGANDO"><div className="adm-empty">Carregando métricas…</div></div>
          ) : erro ? (
            <div className="form-card" data-label="INDISPONÍVEL"><div className="adm-empty">{erro}</div></div>
          ) : (
            <>
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

              <div className="form-card" data-label="TAMANHO POR TABELA (PROTOCOL FPS)">
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
                <div className="adm-hint">
                  Última leitura geral: {col.ultima_geral ? dataHoraBRT(col.ultima_geral, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "nunca"}.
                  Proxy observável a partir de historico_precos — não reflete o histórico de execuções do GitHub Actions (sucesso/falha do workflow), que exigiria integração separada com a API do GitHub.
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
