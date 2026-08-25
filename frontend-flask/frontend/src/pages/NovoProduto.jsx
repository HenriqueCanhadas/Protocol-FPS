/**
 * pages/NovoProduto.jsx — PROTOCOL FPS
 * Formulário para adicionar produtos ao monitoramento.
 */
import { useState, useEffect } from "react";
import { getSupabase } from "@/services/supabase";
import ConfirmModal from "@/components/ConfirmModal";

const css = `
.np-main { flex:1; padding:2rem 1.5rem; display:flex; justify-content:center; }
.page-wrap { width:min(1800px,100%); display:flex; flex-direction:column; gap:2rem; }

/* esquerda (formulário + criar categoria) + direita (fila de envio) — mesmo
   corte de 1100px/2rem de gap já usado no .dash-grid do Dashboard (Sprint 21)
   e no .admin-grid do Admin (Sprint 46) */
.np-grid { display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:2rem; align-items:start; }
.np-content { display:flex; flex-direction:column; gap:2rem; min-width:0; }
.np-sidebar { display:flex; flex-direction:column; gap:2rem; position:sticky; top:1.75rem; }

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

.form-select { width:100%; background:var(--bg); border:1px solid var(--border2); color:var(--text); font-family:var(--mono); font-size:var(--fs-md); padding:.8rem 1rem; outline:none; cursor:pointer; transition:border-color .2s,box-shadow .2s; }
.form-select:hover { border-color:var(--green-dim); }
.form-select:focus { border-color:var(--green-dim); box-shadow:0 0 0 1px var(--green-dim), inset 0 0 10px rgba(57,255,20,.03); }
.form-select option { background:var(--bg2); color:var(--text); }
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

/* 2 colunas (não as 4 originais) — a fila agora mora na sidebar estreita
   (380px, Sprint 53), então o item quebra em 2 linhas (info+loja / meta+ações)
   em vez de tentar caber tudo numa linha só */
.item-row { display:grid; grid-template-columns:1fr auto; gap:.5rem 1.1rem; align-items:center; padding:.9rem 1.1rem; background:var(--bg2); border:1px solid var(--border2); border-left:3px solid var(--green-dim); font-size:var(--fs-base); margin-bottom:.6rem; }
.item-row.editing { border-left-color:var(--amber); box-shadow:inset 3px 0 0 var(--amber); }
.item-actions { display:flex; gap:.35rem; }
.item-nome { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.item-cat  { font-size:var(--fs-xs); color:var(--text-dim); letter-spacing:.1em; text-transform:uppercase; margin-top:.15rem; }
.item-loja { font-size:var(--fs-xs); letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); }
.item-meta { font-size:var(--fs-sm); color:var(--amber); }
.btn-remove-item { background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:.25rem .5rem; transition:color .15s; }
.btn-remove-item:hover { color:var(--red); }
.empty-itens { padding:2.5rem; text-align:center; color:var(--text-dim); font-size:var(--fs-base); letter-spacing:.12em; border:1px dashed var(--border2); line-height:1.8; }
.np-progress-bar { height:3px; background:var(--border2); position:relative; overflow:hidden; }
.np-progress-fill { position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg,var(--green-dim),var(--green)); transition:width .4s ease; }

@media (max-width:1100px) {
  .np-grid { grid-template-columns:1fr; }
  .np-sidebar { position:static; }
}

@media (max-width:640px) {
  .np-main { padding:1.25rem 1rem; }
  .form-body { padding:1.25rem; }
  .form-actions { padding:1.1rem 1.25rem; flex-direction:column; }
  .fields-grid.cols-2 { grid-template-columns:1fr; }
  .preco-meta-fields.visible { grid-template-columns:1fr; }
}
`;

const LOJAS_DETECTADAS = {
  "kabum.com.br":        "kabum",
  "terabyteshop.com.br": "terabyteshop",
  "pichau.com.br":       "pichau",
  "tuyo.com.br":            "tuyo",
  "store.playstation.com": "playstation",
  "logitechstore.com.br":  "logitec",
  "tangleteezer.com.br":   "tangleteezer",
  "amazon.com.br":         "amazon",
  "shopee.com.br":         "shopee",
  "aliexpress.com":        "aliexpress",
  "mocadopop.com.br":      "mocadopop",
};
// Ordem fixa das categorias originais (rótulo próprio, ver rotuloCategoria).
// Categorias novas (todo, criadas por admin — ver criarCategoria) entram
// depois destas, ordenadas por nome.
const CATEGORIA_ORDEM_FIXA = ["GPU", "CPU", "RAM", "PSU", "MOBO", "STORAGE", "DIVERSOS"];
const CATEGORIA_LABEL_FIXA = { GPU: "GPU", CPU: "CPU", RAM: "RAM", PSU: "Fonte", MOBO: "Placa Mãe", STORAGE: "Armazenamento", DIVERSOS: "Diversos" };
const LOJAS_LABEL = {
  kabum: "KaBuM", terabyteshop: "Terabyte", pichau: "Pichau",
  tuyo: "Tuyo", playstation: "Playstation", logitec: "Logitec",
  tangleteezer: "Tangle Teezer", amazon: "Amazon", shopee: "Shopee",
  aliexpress: "AliExpress", mocadopop: "Mocadopop",
};
// Sprint 42 (V5, todo:239): lojas com limitação estrutural CONHECIDA e
// documentada (README.md/CLAUDE.md) — o item pode ser cadastrado normalmente,
// mas a coleta de preço não funciona hoje. Aviso só para não surpreender o
// usuário meses depois vendo "não localizado"/"esgotado" sem explicação.
const LOJAS_SEM_COLETA = {
  pichau: "A Pichau bloqueia coletas feitas a partir de IP de datacenter — só funciona quando a coleta roda localmente no seu computador. Na coleta automática diária (GitHub Actions) este item tende a aparecer como \"não localizado\".",
  shopee: "A Shopee exige login para mostrar o preço — o projeto não consegue coletar essa loja em nenhum ambiente hoje (nem local, nem automático). O item pode ser cadastrado, mas o preço nunca vai atualizar sozinho.",
  aliexpress: "O AliExpress redireciona a coleta automática (GitHub Actions) para o site americano (aliexpress.us), que não carrega — só funciona quando a coleta roda localmente no seu computador. Na coleta automática diária este item tende a aparecer como \"não localizado\".",
};

function rotuloCategoria(categoria, nomeDb) {
  return CATEGORIA_LABEL_FIXA[categoria] || nomeDb || categoria;
}

// Slug estável para a coluna `produtos.categoria` (sigla usada nos filtros
// do Dashboard e na coleta segmentada — ver CATEGORIA em main.py).
function slugCategoria(nome) {
  return nome
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toUpperCase().trim()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ordenarCategorias(lista) {
  return [...lista].sort((a, b) => {
    const ia = CATEGORIA_ORDEM_FIXA.indexOf(a.categoria);
    const ib = CATEGORIA_ORDEM_FIXA.indexOf(b.categoria);
    if (ia === -1 && ib === -1) return a.nome.localeCompare(b.nome);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function detectarLoja(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    for (const [dom, slug] of Object.entries(LOJAS_DETECTADAS)) {
      if (host.includes(dom)) return slug;
    }
  } catch {}
  return null;
}

export default function NovoProduto({ showToast, user, isAdmin }) {
  const [lojasDB,   setLojasDB]   = useState({});
  const [produtosDB,setProdutosDB] = useState({});
  const [categorias,setCategorias] = useState([]); // [{ categoria, nome }], ver ordenarCategorias
  const [fila,      setFila]       = useState([]);
  const [editandoId,setEditandoId] = useState(null);
  const [confirm,   setConfirm]    = useState(null);
  const [salvando,  setSalvando]   = useState(false);
  const [progresso, setProgresso]  = useState(0);

  // Criação de categoria nova (todo, admin-only — ver migrations/sprint31_categorias_insert.sql).
  // Sprint 33 (todo:220): saiu de dentro do campo Categoria e virou uma seção
  // própria e sempre visível (para admin), em vez de um link que expandia ali.
  const [novaCategoriaNome,  setNovaCategoriaNome]  = useState("");
  const [salvandoCategoria,  setSalvandoCategoria]  = useState(false);

  // Form state
  const [url,       setUrl]       = useState("");
  const [nome,      setNome]      = useState("");
  const [categoria, setCategoria] = useState("");
  const [loja,      setLoja]      = useState("");
  const [precoMeta, setPrecoMeta] = useState("");
  const [metaAtivo, setMetaAtivo] = useState(false);
  const [monitorando,setMonitorando] = useState(true);
  const [urlPreview, setUrlPreview] = useState(null); // { slug, valid }
  const [erros,     setErros]     = useState({});

  useEffect(() => {
    getSupabase().then(async (sb) => {
      const { data: lojas } = await sb.from("lojas").select("id, nome");
      const { data: prods } = await sb.from("produtos").select("id, categoria, nome");
      const lMap = {}; (lojas || []).forEach((l) => { lMap[l.nome.toLowerCase().replace(/\s/g, "")] = l.id; });
      const pMap = {}; (prods  || []).forEach((p) => { pMap[p.categoria] = p.id; });
      setLojasDB(lMap);
      setProdutosDB(pMap);
      setCategorias(ordenarCategorias(prods || []));
    });
  }, []);

  // Cria uma categoria nova em `produtos` (todo) — restrito a admin pela
  // política produtos_insert_admin (migrations/sprint31_categorias_insert.sql);
  // um usuário comum recebe o erro de RLS do próprio Supabase.
  const criarCategoria = async () => {
    const nomeDigitado = novaCategoriaNome.trim();
    if (!nomeDigitado) return;
    const slug = slugCategoria(nomeDigitado);
    if (!slug) { showToast("Nome inválido para categoria", "error"); return; }
    if (produtosDB[slug]) { showToast(`Categoria "${slug}" já existe`, "error"); return; }

    setSalvandoCategoria(true);
    const sb = await getSupabase();
    const { data, error } = await sb.from("produtos").insert({ categoria: slug, nome: nomeDigitado }).select().single();
    setSalvandoCategoria(false);
    if (error) { showToast(`Erro ao criar categoria: ${error.message}`, "error"); return; }

    setProdutosDB((m) => ({ ...m, [slug]: data.id }));
    setCategorias((c) => ordenarCategorias([...c, { categoria: slug, nome: data.nome }]));
    setCategoria(slug);
    setErros((e) => ({ ...e, categoria: false }));
    setNovaCategoriaNome("");
    showToast(`Categoria "${nomeDigitado}" criada`, "ok");
  };

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
    setPrecoMeta(""); setMetaAtivo(false);
    setUrlPreview(null); setErros({});
    setEditandoId(null);
  };

  // Carrega um item já na fila de volta no formulário para edição (todo:208).
  // "Adicionar à Fila" vira "Salvar Edição" enquanto editandoId estiver setado.
  const editarItem = (item) => {
    setUrl(item.url);
    setNome(item.nome_na_loja);
    setCategoria(item.categoria);
    setLoja(item.loja_slug);
    setPrecoMeta(item.preco_meta != null ? String(item.preco_meta) : "");
    setMetaAtivo(item.preco_meta != null);
    setMonitorando(item.monitorando);
    setUrlPreview({ valid: true, slug: item.loja_slug });
    setErros({});
    setEditandoId(item.id_temp);
  };

  const removerDaFila = (id_temp) => {
    setFila((f) => f.filter((i) => i.id_temp !== id_temp));
    if (id_temp === editandoId) limpar();
  };

  const adicionar = () => {
    const e = {};
    if (!url || !detectarLoja(url)) e.url = true;
    if (!nome)      e.nome = true;
    if (!categoria) e.categoria = true;
    if (!loja)      e.loja = true;
    if (metaAtivo && precoMeta && (isNaN(precoMeta) || Number(precoMeta) <= 0)) e.precoMeta = true;
    if (Object.keys(e).length) { setErros(e); return; }

    const dadosItem = {
      url, nome_na_loja: nome, categoria, loja_slug: loja,
      preco_meta: metaAtivo && precoMeta ? Number(precoMeta) : null,
      monitorando,
    };

    if (editandoId != null) {
      setFila((f) => f.map((i) => (i.id_temp === editandoId ? { ...i, ...dadosItem } : i)));
      showToast(`"${nome}" atualizado na fila`);
    } else {
      setFila((f) => [...f, { id_temp: Date.now(), ...dadosItem }]);
      showToast(`"${nome}" adicionado à fila`);
    }
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
        // Dono do item (RLS multiusuário). O banco tem default auth.uid(),
        // mas gravamos explícito para deixar a intenção clara.
        ...(user?.id ? { user_id: user.id } : {}),
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
          <div className="np-grid">
          <div className="np-content">
          {/* FORM */}
          <div className="form-card" data-label={editandoId != null ? "EDITANDO ITEM DA FILA" : "DADOS DO PRODUTO"}>
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
                  <select className="form-select" value={categoria}
                    onChange={(e) => { setCategoria(e.target.value); setErros((x) => ({ ...x, categoria: false })); }}>
                    <option value="">— selecione a categoria —</option>
                    {categorias.map((c) => (
                      <option key={c.categoria} value={c.categoria}>{rotuloCategoria(c.categoria, c.nome)}</option>
                    ))}
                  </select>
                  {erros.categoria && <div className="field-error">Selecione uma categoria</div>}
                </div>
                <div className="field-group">
                  <div className="field-label">Loja <span className="red">*</span></div>
                  <select className="form-select" value={loja}
                    onChange={(e) => { setLoja(e.target.value); setErros((x) => ({ ...x, loja: false })); }}>
                    <option value="">— selecione a loja —</option>
                    {Object.entries(LOJAS_LABEL).map(([slug, label]) => (
                      <option key={slug} value={slug}>{label}</option>
                    ))}
                  </select>
                  {erros.loja && <div className="field-error">Selecione a loja</div>}
                  {LOJAS_SEM_COLETA[loja] && (
                    <div className="field-warn">⚠ {LOJAS_SEM_COLETA[loja]}</div>
                  )}
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
                {/* Campo "% de queda" removido na Sprint 9 (todo:108): nunca era
                    persistido nem usado — a RPC verificar_alertas dispara
                    queda_preco em QUALQUER queda vs. a última leitura. */}
                <div className={`preco-meta-fields${metaAtivo ? " visible" : ""}`}>
                  <div className="field-group" style={{ marginTop: ".9rem" }}>
                    <div className="field-label">Preço-meta (R$)</div>
                    <input className="field-input" type="number" placeholder="2999.99" min="0" step="0.01" value={precoMeta} onChange={(e) => setPrecoMeta(e.target.value)} />
                    <div className="field-hint">Alerta quando cair abaixo desse valor</div>
                    {erros.precoMeta && <div className="field-error">Valor inválido</div>}
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
              <button className="btn-secondary" onClick={limpar}>{editandoId != null ? "CANCELAR EDIÇÃO" : "LIMPAR"}</button>
              <button className="btn-primary"   onClick={adicionar}>{editandoId != null ? "SALVAR EDIÇÃO" : "ADICIONAR À FILA"}</button>
            </div>
          </div>
          </div>

          <div className="np-sidebar">
          {/* CRIAR CATEGORIA — seção própria, admin-only (Sprint 33, todo:220;
              antes era um link dentro do campo Categoria, Sprint 31); movida
              para a sidebar direita na Sprint 53b (pedido do usuário) */}
          {isAdmin && (
            <div className="form-card" data-label="CRIAR NOVA CATEGORIA">
              <div className="form-body">
                <div className="field-group">
                  <div className="field-label">Nome da categoria</div>
                  <input
                    className="field-input" type="text" placeholder="Nome da nova categoria (ex.: Cooler)"
                    value={novaCategoriaNome}
                    onChange={(e) => setNovaCategoriaNome(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && criarCategoria()}
                  />
                  <button className="btn-primary" style={{ marginTop: ".9rem", width: "100%" }}
                    disabled={!novaCategoriaNome.trim() || salvandoCategoria} onClick={criarCategoria}>
                    {salvandoCategoria ? "CRIANDO..." : "CRIAR CATEGORIA"}
                  </button>
                </div>
              </div>
            </div>
          )}
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
                  <div key={item.id_temp} className={`item-row${item.id_temp === editandoId ? " editing" : ""}`}>
                    <div>
                      <div className="item-nome">{item.nome_na_loja}</div>
                      <div className="item-cat">{item.categoria} · {item.url.substring(0, 45)}…</div>
                    </div>
                    <div className="item-loja">{LOJAS_LABEL[item.loja_slug] || item.loja_slug}</div>
                    <div className="item-meta">{item.preco_meta ? `Meta: R$ ${Number(item.preco_meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sem meta"}</div>
                    <div className="item-actions">
                      <button className="btn-remove-item" title="Editar" onClick={() => editarItem(item)}>✎</button>
                      <button className="btn-remove-item" title="Remover" onClick={() => removerDaFila(item.id_temp)}>✕</button>
                    </div>
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
          </div>
        </div>
      </main>
    </>
  );
}
