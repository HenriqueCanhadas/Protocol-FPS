// hooks/useDashboardFilters.js — PROTOCOL FPS
// Busca + categoria + loja/produto da loja + usuário (admin) + dia de coleta
// + ordenação — toda a lógica de filtro/ordenação que antes vivia inline em
// pages/Dashboard.jsx, movida sem alterar nenhum comportamento (Sprint 17/V3).
import { useState, useEffect } from "react";
import { diaBRT } from "@/utils/datas";
import { buscarItensDoDia } from "@/services/dashboard.service";
import { LOJAS_FILTER } from "@/pages/Dashboard/Dashboard.constants";

// Busca persiste entre sessões (pedido do usuário: "mantenha sempre o último
// texto salvo") — mesmo precedente de localStorage do useAutoLogout (fps_*).
const CHAVE_BUSCA = "fps_busca_produtos";
const lerBuscaSalva = () => {
  try { return localStorage.getItem(CHAVE_BUSCA) || ""; } catch { return ""; }
};

export function useDashboardFilters({ dados, isAdmin, user }) {
  const [filtro,        setFiltro]        = useState("all");
  const [termoBusca,    setTermoBuscaState] = useState(lerBuscaSalva);
  const [sortCampo,     setSortCampo]     = useState("nome");
  const [sortDir,       setSortDir]       = useState("asc");
  const [filtroLoja,    setFiltroLoja]    = useState("all");
  const [filtroProduto, setFiltroProduto] = useState("all"); // produto dentro da loja selecionada
  const [filtroUsuario, setFiltroUsuario] = useState("all"); // admin: dono dos itens
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
      const q = filtroLoja.toLowerCase();
      d = d.filter(x => (x.loja || "").toLowerCase().includes(q));
    }
    if (filtroProduto !== "all") {
      d = d.filter(x => x.item_id === filtroProduto);
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
    d.sort((a, b) => {
      if (sortCampo === "nome") {
        const cmp = (a.nome_na_loja || "").localeCompare(b.nome_na_loja || "", "pt-BR");
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
  const produtosDaLoja = filtroLoja === "all" ? [] :
    dados
      .filter((x) => (x.loja || "").toLowerCase().includes(filtroLoja))
      .sort((a, b) => (a.nome_na_loja || "").localeCompare(b.nome_na_loja || "", "pt-BR"));

  const lojaAtiva = LOJAS_FILTER.find((l) => l.key === filtroLoja);

  // Admin: donos distintos dos itens carregados (usuário normal só recebe os seus)
  const donos = isAdmin
    ? [...new Map(dados.filter((x) => x.dono_id).map((x) =>
        [x.dono_id, { id: x.dono_id, rotulo: x.dono_nome || x.dono_email || x.dono_id.slice(0, 8) }]
      )).values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"))
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
    filtroDia, setFiltroDia,
    dadosFiltrados,
    produtosDaLoja,
    lojaAtiva,
    donos,
    rotuloDono,
  };
}
