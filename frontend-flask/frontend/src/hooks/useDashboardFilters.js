// hooks/useDashboardFilters.js — PROTOCOL FPS
// Busca + categoria + loja/produto da loja + usuário (admin) + dia de coleta
// + ordenação — toda a lógica de filtro/ordenação que antes vivia inline em
// pages/Dashboard.jsx, movida sem alterar nenhum comportamento (Sprint 17/V3).
import { useState, useEffect } from "react";
import { diaBRT } from "@/utils/datas";
import { buscarItensDoDia } from "@/services/dashboard.service";
import { LOJAS_FILTER, statusItem, compararRotulos } from "@/pages/Dashboard/Dashboard.constants";

// Busca persiste entre sessões (pedido do usuário: "mantenha sempre o último
// texto salvo") — mesmo precedente de localStorage do useAutoLogout (fps_*).
const CHAVE_BUSCA = "fps_busca_produtos";
const lerBuscaSalva = () => {
  try { return localStorage.getItem(CHAVE_BUSCA) || ""; } catch { return ""; }
};

// Mesma normalização do `_slug_loja` em main.py (minúsculas, sem espaços) —
// necessária porque `lojas.nome` pode ter espaço (ex. "Tangle Teezer") enquanto
// as `key`/`slug` de LOJAS_FILTER não têm (Sprint 34: sem isso o filtro de loja
// nunca casava com "Tangle Teezer").
const slugLoja = (nome) => (nome || "").toLowerCase().replace(/\s/g, "");

export function useDashboardFilters({ dados, isAdmin, user }) {
  const [filtro,        setFiltro]        = useState("all");
  const [termoBusca,    setTermoBuscaState] = useState(lerBuscaSalva);
  const [sortCampo,     setSortCampo]     = useState("nome");
  const [sortDir,       setSortDir]       = useState("asc");
  const [filtroLoja,    setFiltroLoja]    = useState("all");
  const [filtroProduto, setFiltroProduto] = useState("all"); // produto dentro da loja selecionada
  const [filtroUsuario, setFiltroUsuario] = useState("all"); // admin: dono dos itens
  const [filtroMeta,    setFiltroMeta]    = useState("all"); // all | sem | com (Sprint 74, todo:318)
  const [filtroDia,     setFiltroDia]     = useState("");    // dia de coleta (YYYY-MM-DD em BRT; "" = todos)
  const [itensDoDia,    setItensDoDia]    = useState(null);  // Set de item_ids com ALGUMA leitura no dia (null = carregando)

  // Filtro por dia de coleta: um item conta se teve QUALQUER leitura no dia
  // escolhido — não só se a última leitura é daquele dia (um item coletado em
  // 11/07 e de novo em 14/07 aparece nos dois dias). Como o Dashboard só
  // carrega a última leitura por item, os IDs do dia vêm do banco, paginados
  // em blocos de 1000 (teto do PostgREST — Sprints 8/10).
  useEffect(() => {
    if (!filtroDia) { setItensDoDia(null); return; }
    let ativo = true;
    setItensDoDia(null);
    buscarItensDoDia(filtroDia).then((ids) => { if (ativo) setItensDoDia(ids); });
    return () => { ativo = false; };
  }, [filtroDia]);

  // Ao trocar de loja, o filtro de produto (que pertence à loja) é limpo
  const selecionarLoja = (key) => { setFiltroLoja(key); setFiltroProduto("all"); };

  const setTermoBusca = (valor) => {
    setTermoBuscaState(valor);
    try {
      if (valor) localStorage.setItem(CHAVE_BUSCA, valor);
      else localStorage.removeItem(CHAVE_BUSCA);
    } catch { /* localStorage indisponível (modo privado etc.) — só não persiste */ }
  };

  // ── Sprint 70 (todo:306) ──────────────────────────────────────────────
  // Categoria/Loja/Produto/Usuário saíram da barra para um pop-up próprio
  // (FiltersDialog). Estas duas contagens moram aqui, e não no ControlBar,
  // porque quem conhece o conjunto completo de filtros é o hook — o botão só
  // consome. São separadas de propósito:
  //   · filtrosPopup = só o que o pop-up controla → pinta o botão de verde
  //     (ficar verde por causa da busca, que tem botão próprio, confundiria);
  //   · filtrosAtivos = TUDO que recorta a tabela, busca e dia inclusive →
  //     decide se o "REMOVER FILTROS" aparece, e é o que ele limpa.
  const filtrosPopup = [
    filtro !== "all",
    filtroLoja !== "all",
    filtroProduto !== "all",
    isAdmin && filtroUsuario !== "all",
    filtroMeta !== "all",
  ].filter(Boolean).length;

  const filtrosAtivos = filtrosPopup + [!!termoBusca.trim(), !!filtroDia].filter(Boolean).length;

  const limparFiltros = () => {
    setFiltro("all");
    setFiltroLoja("all");
    setFiltroProduto("all");
    setFiltroUsuario("all");
    setFiltroMeta("all");
    setTermoBusca("");   // também apaga o termo salvo em localStorage
    setFiltroDia("");
  };

  // Sprint 74 (todo:318): atalho do card "Itens sem meta" do KpiRibbon —
  // liga/desliga o recorte "só sem meta" sem mexer nos outros filtros.
  const alternarSemMeta = () => setFiltroMeta((v) => (v === "sem" ? "all" : "sem"));

  const toggleSort = (campo) => {
    if (sortCampo === campo) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCampo(campo); setSortDir("asc"); }
  };

  // Filtro + busca + sort
  const dadosFiltrados = (() => {
    let d = filtro === "all" ? [...dados] : dados.filter((x) => x.categoria === filtro);
    if (isAdmin && filtroUsuario !== "all") {
      d = d.filter((x) => x.dono_id === filtroUsuario);
    }
    if (termoBusca.trim()) {
      const q = termoBusca.toLowerCase();
      d = d.filter((x) =>
        (x.nome_na_loja || "").toLowerCase().includes(q) ||
        (x.loja || "").toLowerCase().includes(q) ||
        (x.categoria || "").toLowerCase().includes(q)
      );
    }
    if (filtroLoja !== "all") {
      d = d.filter(x => slugLoja(x.loja).includes(filtroLoja));
    }
    if (filtroProduto !== "all") {
      d = d.filter(x => x.item_id === filtroProduto);
    }
    // Sprint 74 (todo:318): recorte por presença de preço-meta. Mesmo teste
    // (`!x.preco_meta`) usado no marcador da tabela e no Detalhe do item, para
    // contador, marcação e lista nunca discordarem entre si.
    if (filtroMeta !== "all") {
      d = filtroMeta === "sem" ? d.filter((x) => !x.preco_meta) : d.filter((x) => !!x.preco_meta);
    }
    // Sprint 14: recorte por dia de coleta (dia civil de Brasília, mesmo
    // formato YYYY-MM-DD do <input type="date">). Usa os IDs vindos do banco
    // (qualquer leitura no dia); enquanto carregam, aproxima pela última
    // leitura para a tabela não piscar vazia.
    if (filtroDia) {
      d = itensDoDia
        ? d.filter((x) => itensDoDia.has(x.item_id))
        : d.filter((x) => x.coletado_em && diaBRT(x.coletado_em) === filtroDia);
    }
    // Campos de texto (Sprint 50, todo:256 — mesmo critério acionado pelo
    // dropdown "Ordenar" e pelo clique no cabeçalho da coluna, ProductTable):
    // nome (Produto) · loja (Loja) · categoria (Categoria, pela sigla salva
    // em produtos.categoria — mesma comparação usada nos filtros, não pelo
    // rótulo amigável) · status (Status, pelo texto do badge — statusItem).
    const CAMPOS_TEXTO = { nome: "nome_na_loja", loja: "loja", categoria: "categoria" };
    d.sort((a, b) => {
      if (CAMPOS_TEXTO[sortCampo] || sortCampo === "status") {
        const texto = (x) => sortCampo === "status" ? statusItem(x).texto : (x[CAMPOS_TEXTO[sortCampo]] || "");
        const cmp = texto(a).localeCompare(texto(b), "pt-BR");
        return sortDir === "asc" ? cmp : -cmp;
      }
      // Campos numéricos (Sprints 12/14): preco (atual) · menor (menor valor
      // obtido) · meta (preço-alvo) · data (timestamp da última coleta).
      // Itens sem valor vão para o fim.
      const valor = (x) => {
        if (sortCampo === "data") return x.coletado_em ? new Date(x.coletado_em).getTime() : null;
        if (sortCampo === "menor") return x.menor;
        if (sortCampo === "meta")  return x.preco_meta != null ? Number(x.preco_meta) : null;
        return x.preco;
      };
      const semValor = sortDir === "asc" ? Infinity : -Infinity;
      const pa = valor(a) ?? semValor;
      const pb = valor(b) ?? semValor;
      return sortDir === "asc" ? pa - pb : pb - pa;
    });
    return d;
  })();

  // ── Escopo de coleta (Sprint 4: coleta segmentada) ───────────
  // Produtos da loja selecionada (para o filtro "produto de loja")
  // Já era alfabético desde a Sprint 4; a Sprint 71 (todo:314) só trocou o
  // comparador pelo único do projeto (pt-BR, sensitivity "base"), para um
  // produto começando com minúscula não ser jogado para o fim da lista.
  const produtosDaLoja = filtroLoja === "all" ? [] :
    dados
      .filter((x) => slugLoja(x.loja).includes(filtroLoja))
      .sort((a, b) => compararRotulos(a.nome_na_loja, b.nome_na_loja));

  const lojaAtiva = LOJAS_FILTER.find((l) => l.key === filtroLoja);

  // Admin: donos distintos dos itens carregados (usuário normal só recebe os seus)
  const donos = isAdmin
    ? [...new Map(dados.filter((x) => x.dono_id).map((x) =>
        [x.dono_id, { id: x.dono_id, rotulo: x.dono_nome || x.dono_email || x.dono_id.slice(0, 8) }]
      )).values()].sort((a, b) => compararRotulos(a.rotulo, b.rotulo))
    : [];
  const rotuloDono = (item) =>
    item.dono_id === user?.id ? "você" : (item.dono_nome || item.dono_email || "—");

  return {
    filtro, setFiltro,
    termoBusca, setTermoBusca,
    sortCampo, sortDir, toggleSort,
    filtroLoja, selecionarLoja,
    filtroProduto, setFiltroProduto,
    filtroUsuario, setFiltroUsuario,
    filtroMeta, setFiltroMeta, alternarSemMeta,
    filtroDia, setFiltroDia,
    filtrosPopup, filtrosAtivos, limparFiltros,
    dadosFiltrados,
    produtosDaLoja,
    lojaAtiva,
    donos,
    rotuloDono,
  };
}
