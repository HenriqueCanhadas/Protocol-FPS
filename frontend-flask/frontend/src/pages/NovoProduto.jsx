/**
 * pages/NovoProduto.jsx — PROTOCOL FPS
 * Formulário para adicionar produtos ao monitoramento.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSupabase } from "@/services/supabase";
import ConfirmModal from "@/components/ConfirmModal";

const css = `
.np-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap { width:min(800px,100%); display:flex; flex-direction:column; gap:2rem; }
.breadcrumb { display:flex; align-items:center; gap:.6rem; font-size:var(--fs-sm); letter-spacing:.15em; color:var(--text-dim); text-transform:uppercase; }
.breadcrumb a { color:var(--text-dim); text-decoration:none; transition:color .15s; }
.breadcrumb a:hover { color:var(--green); }
.page-title { font-family:var(--display); font-size:clamp(2.5rem,7vw,4rem); letter-spacing:.08em; color:var(--green); text-shadow:0 0 24px var(--green-dim); line-height:1; }
.page-subtitle { font-size:var(--fs-base); color:var(--text-dim); letter-spacing:.1em; margin-top:.4rem; }

.form-card { background:var(--bg2); border:1px solid var(--border2); border-top:2px solid var(--green-dim); position:relative; }
.form-card::before { content:attr(data-label); position:absolute; top:-1px; left:1.75rem; background:var(--bg2); color:var(--green-dim); font-size:var(--fs-xs); letter-spacing:.3em; padding:0 .6rem; transform:translateY(-50%); text-transform:uppercase; }
.form-body { padding:2rem; display:flex; flex-direction:column; gap:1.75rem; }
.fields-grid { display:grid; gap:1.5rem; }
.fields-grid.cols-2 { grid-template-columns:1fr 1fr; }
.field-group { display:flex; flex-direction:column; }

.url-wrap { position:relative; }
.btn-fetch-url { position:absolute; right:0; top:0; bottom:0; background:var(--bg3); border:none; border-left:1px solid var(--border2); color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-xs); letter-spacing:.15em; padding:0 1.1rem; cursor:pointer; text-transform:uppercase; transition:color .2s,background .2s; white-space:nowrap; }
.btn-fetch-url:hover { background:var(--green-glow); color:var(--green); }
.url-preview { margin-top:.6rem; background:var(--bg3); border:1px solid var(--border2); padding:.8rem 1rem; font-size:var(--fs-sm); color:var(--text-dim); display:flex; align-items:center; gap:.75rem; }
.url-preview.invalid { border-color:var(--red); color:var(--red); }
.loja-tag { color:var(--green); font-size:var(--fs-xs); letter-spacing:.15em; text-transform:uppercase; white-space:nowrap; border:1px solid var(--green-dim); padding:.2rem .55rem; }
.preview-text { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:var(--fs-xs); }

.loja-chips,.cat-chips { display:flex; gap:.6rem; flex-wrap:wrap; }
.loja-chip,.cat-chip { background:var(--bg3); border:1px solid var(--border2); color:var(--text-dim); font-family:var(--mono); font-size:var(--fs-sm); letter-spacing:.12em; text-transform:uppercase; padding:.55rem 1rem; cursor:pointer; transition:all .15s; user-select:none; }
.loja-chip:hover,.cat-chip:hover { border-color:var(--green-dim); color:var(--text); }
.loja-chip.selected { border-color:var(--green); color:var(--green); background:var(--green-soft); }
.cat-chip.selected  { border-color:var(--amber); color:var(--amber); background:rgba(255,184,0,.08); }
.form-divider { height:1px; background:var(--border2); margin:.25rem 0; }

.toggle-row { display:flex; align-items:center; gap:1rem; padding:.9rem 1.1rem; background:var(--bg3); border:1px solid var(--border2); cursor:pointer; transition:border-color .15s; }
.toggle-row:hover { border-color:var(--green-dim); }
.toggle-switch { width:38px; height:20px; background:var(--border2); border-radius:10px; position:relative; flex-shrink:0; transition:background .2s; }
.toggle-switch::after { content:''; position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:var(--text-muted); transition:transform .2s,background .2s; }
.toggle-switch.on { background:var(--green-dim); }
.toggle-switch.on::after { transform:translateX(18px); background:var(--green); }
.toggle-label { font-size:var(--fs-base); color:var(--text); }
.toggle-sublabel { font-size:var(--fs-xs); color:var(--text-muted); margin-left:auto; letter-spacing:.1em; }

.preco-meta-fields { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; overflow:hidden; max-height:0; opacity:0; transition:max-height .35s ease,opacity .25s ease,margin .25s; }
.preco-meta-fields.visible { max-height:220px; opacity:1; margin-top:.25rem; }

.form-actions { display:flex; gap:.9rem; justify-content:flex-end; padding:1.4rem 2rem; border-top:1px solid var(--border2); background:var(--bg3); }

.item-row { display:grid; grid-template-columns:1fr auto auto auto; gap:1.1rem; align-items:center; padding:.9rem 1.1rem; background:var(--bg2); border:1px solid var(--border2); border-left:3px solid var(--green-dim); font-size:var(--fs-base); margin-bottom:.6rem; }
.item-nome { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.item-cat  { font-size:var(--fs-xs); color:var(--text-dim); letter-spacing:.1em; text-transform:uppercase; margin-top:.15rem; }
.item-loja { font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); }
.item-meta { font-size:var(--fs-sm); color:var(--amber); }
.btn-remove-item { background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:.25rem .5rem; transition:color .15s; }
.btn-remove-item:hover { color:var(--red); }
.empty-itens { padding:2.5rem; text-align:center; color:var(--text-dim); font-size:var(--fs-base); letter-spacing:.12em; border:1px dashed var(--border2); line-height:1.8; }
.np-progress-bar { height:3px; background:var(--border2); position:relative; overflow:hidden; }
.np-progress-fill { position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg,var(--green-dim),var(--green)); transition:width .4s ease; }

@media (max-width:640px) {
  .np-main { padding:1.25rem 1rem; }
  .form-body { padding:1.25rem; }
  .form-actions { padding:1.1rem 1.25rem; flex-direction:column; }
  .fields-grid.cols-2 { grid-template-columns:1fr; }
  .preco-meta-fields.visible { grid-template-columns:1fr; }
  .item-row { grid-template-columns:1fr auto; }
}
`;

const LOJAS_DETECTADAS = {
  "kabum.com.br":       "kabum",
  "terabyteshop.com.br": "terabyteshop",
  "pichau.com.br":      "pichau",
};
const CATEGORIAS = ["GPU", "CPU", "RAM", "PSU", "MOBO", "SSD", "COOLER"];
const LOJAS_LABEL = { kabum: "KaBuM", terabyteshop: "Terabyte", pichau: "Pichau" };

function detectarLoja(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    for (const [dom, slug] of Object.entries(LOJAS_DETECTADAS)) {
      if (host.includes(dom)) return slug;
    }
  } catch {}
  return null;
}

export default function NovoProduto({ showToast }) {
  const [lojasDB,   setLojasDB]   = useState({});
  const [produtosDB,setProdutosDB] = useState({});
  const [fila,      setFila]       = useState([]);
  const [confirm,   setConfirm]    = useState(null);
  const [salvando,  setSalvando]   = useState(false);
  const [progresso, setProgresso]  = useState(0);

  // Form state
  const [url,       setUrl]       = useState("");
  const [nome,      setNome]      = useState("");
  const [categoria, setCategoria] = useState("");
  const [loja,      setLoja]      = useState("");
  const [precoMeta, setPrecoMeta] = useState("");
  const [pctQueda,  setPctQueda]  = useState("");
  const [metaAtivo, setMetaAtivo] = useState(false);
  const [monitorando,setMonitorando] = useState(true);
  const [urlPreview, setUrlPreview] = useState(null); // { slug, valid }
  const [erros,     setErros]     = useState({});

  useEffect(() => {
    getSupabase().then(async (sb) => {
      const { data: lojas } = await sb.from("lojas").select("id, nome");
      const { data: prods } = await sb.from("produtos").select("id, categoria");
      const lMap = {}; (lojas || []).forEach((l) => { lMap[l.nome.toLowerCase().replace(/\s/g, "")] = l.id; });
      const pMap = {}; (prods  || []).forEach((p) => { pMap[p.categoria] = p.id; });
      setLojasDB(lMap);
      setProdutosDB(pMap);
    });
  }, []);

  const detectar = () => {
    const slug = detectarLoja(url);
    if (!url) { setErros((e) => ({ ...e, url: true })); return; }
    if (!slug) { setUrlPreview({ valid: false }); return; }
    setLoja(slug);
    setUrlPreview({ valid: true, slug });
    setErros((e) => ({ ...e, url: false, loja: false }));
  };

  const limpar = () => {
    setUrl(""); setNome(""); setCategoria(""); setLoja("");
    setPrecoMeta(""); setPctQueda(""); setMetaAtivo(false);
    setUrlPreview(null); setErros({});
  };

  const adicionar = () => {
    const e = {};
    if (!url || !detectarLoja(url)) e.url = true;
    if (!nome)      e.nome = true;
    if (!categoria) e.categoria = true;
    if (!loja)      e.loja = true;
    if (metaAtivo && precoMeta && (isNaN(precoMeta) || Number(precoMeta) <= 0)) e.precoMeta = true;
    if (Object.keys(e).length) { setErros(e); return; }

    setFila((f) => [...f, {
      id_temp: Date.now(), url, nome_na_loja: nome, categoria, loja_slug: loja,
      preco_meta: metaAtivo && precoMeta ? Number(precoMeta) : null,
      pct_queda: metaAtivo && pctQueda ? Number(pctQueda) : null,
      monitorando,
    }]);
    showToast(`"${nome}" adicionado à fila`);
    limpar();
  };

  const salvar = async () => {
    setSalvando(true);
    let salvos = 0;
    const errosSalvar = [];
    for (let i = 0; i < fila.length; i++) {
      setProgresso(((i + 1) / fila.length) * 100);
      const item   = fila[i];
      const lojaId = lojasDB[item.loja_slug];
      const prodId = produtosDB[item.categoria];
      if (!lojaId) { errosSalvar.push(`Loja "${item.loja_slug}" não encontrada`); continue; }
      if (!prodId) { errosSalvar.push(`Categoria "${item.categoria}" não encontrada`); continue; }
      const sb = await getSupabase();
      const { error } = await sb.from("itens").insert({
        url: item.url, nome_na_loja: item.nome_na_loja,
        loja_id: lojaId, produto_id: prodId,
        preco_meta: item.preco_meta, monitorando: item.monitorando,
      });
      if (error) errosSalvar.push(`${item.nome_na_loja}: ${error.message}`);
      else salvos++;
    }
    setTimeout(() => {
      setSalvando(false); setProgresso(0);
      if (!errosSalvar.length) {
        setFila([]);
        showToast(`✓ ${salvos} produto(s) salvos!`, "ok");
      } else {
        showToast(`ERRO: ${errosSalvar[0].substring(0, 70)}`, "error");
      }
    }, 600);
  };

  const confirmar = (titulo, corpo, cb) => setConfirm({ titulo, corpo, icone: "⚡", isDanger: false, cb });

  return (
    <>
      <style>{css}</style>
      <ConfirmModal confirm={confirm} onCancel={() => setConfirm(null)} onOk={() => { confirm?.cb(); setConfirm(null); }} />

      <main className="np-main">
        <div className="page-wrap">
          <nav className="breadcrumb">
            <Link to="/">Dashboard</Link>
            <span>›</span><span>Novo Produto</span>
          </nav>

          <div>
            <div className="page-title">NOVO<br />PRODUTO</div>
            <div className="page-subtitle">Adicione URLs para monitorar — KaBuM, Terabyte ou Pichau</div>
          </div>

          {/* FORM */}
          <div className="form-card" data-label="DADOS DO PRODUTO">
            <div className="form-body">
              {/* URL */}
              <div className="field-group">
                <div className="field-label">URL do produto <span className="red">*</span></div>
                <div className="url-wrap">
                  <input
                    className="field-input" type="url" placeholder="https://www.kabum.com.br/produto/..."
                    style={{ paddingRight: "7.5rem" }} value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onPaste={() => setTimeout(detectar, 50)}
                  />
                  <button className="btn-fetch-url" onClick={detectar}>DETECTAR</button>
                </div>
                <div className="field-hint">Cole a URL completa de uma página de produto</div>
                {urlPreview && (
                  <div className={`url-preview${urlPreview.valid ? "" : " invalid"}`}>
                    {urlPreview.valid
                      ? <><span className="loja-tag">{LOJAS_LABEL[urlPreview.slug]}</span><span className="preview-text">{url}</span><span className="green">✓</span></>
                      : "✗ Loja não suportada. Use: KaBuM, Terabyte ou Pichau"}
                  </div>
                )}
                {erros.url && <div className="field-error">URL inválida ou loja não suportada</div>}
              </div>

              {/* Nome */}
              <div className="field-group">
                <div className="field-label">Nome do produto <span className="red">*</span></div>
                <input className="field-input" type="text" placeholder="RTX 4070 SUPER Galax 1-Click OC 12GB" value={nome} onChange={(e) => setNome(e.target.value)} />
                {erros.nome && <div className="field-error">Informe o nome do produto</div>}
              </div>

              {/* Categoria + Loja */}
              <div className="fields-grid cols-2">
                <div className="field-group">
                  <div className="field-label">Categoria <span className="red">*</span></div>
                  <div className="cat-chips">
                    {CATEGORIAS.map((c) => (
                      <div key={c} className={`cat-chip${categoria === c ? " selected" : ""}`}
                        onClick={() => { setCategoria(c); setErros((e) => ({ ...e, categoria: false })); }}>
                        {c === "PSU" ? "Fonte" : c === "MOBO" ? "Placa Mãe" : c}
                      </div>
                    ))}
                  </div>
                  {erros.categoria && <div className="field-error">Selecione uma categoria</div>}
                </div>
                <div className="field-group">
                  <div className="field-label">Loja <span className="red">*</span></div>
                  <div className="loja-chips">
                    {Object.entries(LOJAS_LABEL).map(([slug, label]) => (
                      <div key={slug} className={`loja-chip${loja === slug ? " selected" : ""}`}
                        onClick={() => { setLoja(slug); setErros((e) => ({ ...e, loja: false })); }}>
                        {label}
                      </div>
                    ))}
                  </div>
                  {erros.loja && <div className="field-error">Selecione a loja</div>}
                </div>
              </div>

              <div className="form-divider" />

              {/* Toggle meta */}
              <div>
                <div className="toggle-row" onClick={() => setMetaAtivo((v) => !v)}>
                  <div className={`toggle-switch${metaAtivo ? " on" : ""}`} />
                  <div className="toggle-label">Definir preço-meta para alertas</div>
                  <div className="toggle-sublabel">opcional</div>
                </div>
                <div className={`preco-meta-fields${metaAtivo ? " visible" : ""}`}>
                  <div className="field-group" style={{ marginTop: ".9rem" }}>
                    <div className="field-label">Preço-meta (R$)</div>
                    <input className="field-input" type="number" placeholder="2999.99" min="0" step="0.01" value={precoMeta} onChange={(e) => setPrecoMeta(e.target.value)} />
                    <div className="field-hint">Alerta quando cair abaixo desse valor</div>
                    {erros.precoMeta && <div className="field-error">Valor inválido</div>}
                  </div>
                  <div className="field-group" style={{ marginTop: ".9rem" }}>
                    <div className="field-label">% de queda para alertar</div>
                    <input className="field-input" type="number" placeholder="5" min="1" max="99" step="1" value={pctQueda} onChange={(e) => setPctQueda(e.target.value)} />
                    <div className="field-hint">Alerta ao cair X% do último preço</div>
                  </div>
                </div>
              </div>

              {/* Toggle monitor */}
              <div>
                <div className="toggle-row" onClick={() => setMonitorando((v) => !v)}>
                  <div className={`toggle-switch${monitorando ? " on" : ""}`} />
                  <div className="toggle-label">Iniciar monitoramento imediatamente</div>
                </div>
              </div>
            </div>

            {salvando && (
              <div className="np-progress-bar">
                <div className="np-progress-fill" style={{ width: `${progresso}%` }} />
              </div>
            )}

            <div className="form-actions">
              <button className="btn-secondary" onClick={limpar}>LIMPAR</button>
              <button className="btn-primary"   onClick={adicionar}>ADICIONAR À FILA</button>
            </div>
          </div>

          {/* FILA */}
          <div className="form-card" data-label="FILA DE ENVIO">
            <div className="form-body" style={{ gap: "1.1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "var(--fs-sm)", letterSpacing: ".2em", color: "var(--text-dim)" }}>
                  <span className="green">{fila.length}</span> ITEM(NS) NA FILA
                </div>
                <button className="btn-secondary" style={{ fontSize: "var(--fs-xs)", padding: ".4rem .8rem" }}
                  onClick={() => fila.length && confirmar("LIMPAR FILA", "Remover todos os itens da fila?", () => setFila([]))}>
                  LIMPAR FILA
                </button>
              </div>

              {fila.length === 0 ? (
                <div className="empty-itens">Nenhum produto adicionado.<br />Preencha o formulário acima e clique em "Adicionar à Fila".</div>
              ) : (
                fila.map((item) => (
                  <div key={item.id_temp} className="item-row">
                    <div>
                      <div className="item-nome">{item.nome_na_loja}</div>
                      <div className="item-cat">{item.categoria} · {item.url.substring(0, 45)}…</div>
                    </div>
                    <div className="item-loja">{LOJAS_LABEL[item.loja_slug] || item.loja_slug}</div>
                    <div className="item-meta">{item.preco_meta ? `Meta: R$ ${Number(item.preco_meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sem meta"}</div>
                    <button className="btn-remove-item" onClick={() => setFila((f) => f.filter((i) => i.id_temp !== item.id_temp))}>✕</button>
                  </div>
                ))
              )}
            </div>
            <div className="form-actions">
              <button className="btn-primary" disabled={fila.length === 0 || salvando}
                onClick={() => confirmar("SALVAR PRODUTOS", `Confirma o envio de <strong>${fila.length} produto(s)</strong> para o banco de dados?`, salvar)}>
                {salvando ? "SALVANDO..." : "SALVAR NO BANCO DE DADOS"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
