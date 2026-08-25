// services/dashboard.service.js — PROTOCOL FPS
// Acesso a dados da Dashboard: itens+última leitura, histórico completo por
// item, itens com leitura num dia, coletas agregadas por dia, atividade
// recente e remoção server-side.
import { getSupabase } from "@/services/supabase";
import { diaBRT } from "@/utils/datas";

const PAGINA = 1000; // teto do PostgREST — Sprints 8/10

/**
 * Busca os itens com a última leitura e o menor preço já registrado
 * embutidos (embeds aliased "ultima"/"minimo" da mesma tabela
 * historico_precos — evita estourar o teto de 1000 linhas do PostgREST,
 * Sprint 12). Com fallback para bancos sem a migração multiusuário.
 * Retorna o array já no shape usado pela UI (ou null em caso de erro).
 */
export async function buscarItens() {
  const sb = await getSupabase();

  let { data: itens, error } = await sb
    .from("itens")
    .select("id, nome_na_loja, url, monitorando, preco_meta, user_id, lojas(nome), produtos(categoria), usuarios(email, nome), ultima:historico_precos(preco, disponivel, encontrado, coletado_em), minimo:historico_precos(preco, coletado_em)")
    .order("nome_na_loja", { ascending: true })
    .order("coletado_em", { referencedTable: "ultima", ascending: false })
    .limit(1, { referencedTable: "ultima" })
    .gt("minimo.preco", 0)
    .order("preco", { referencedTable: "minimo", ascending: true })
    .limit(1, { referencedTable: "minimo" });

  if (error) {
    // Fallback: banco ainda sem a migração multiusuário (sem user_id/usuarios)
    ({ data: itens, error } = await sb
      .from("itens")
      .select("id, nome_na_loja, url, monitorando, preco_meta, lojas(nome), produtos(categoria), historico_precos(preco, disponivel, encontrado, coletado_em)")
      .order("nome_na_loja", { ascending: true })
      .order("coletado_em", { referencedTable: "historico_precos", ascending: false })
      .limit(1, { referencedTable: "historico_precos" }));
  }

  if (error) return null;
  if (!itens?.length) return [];

  return itens.map((item) => {
    const ult = (item.ultima || item.historico_precos)?.[0] || {};
    const min = item.minimo?.[0] || {};
    return {
      item_id: item.id, nome_na_loja: item.nome_na_loja, url: item.url || null,
      loja: item.lojas?.nome || "—", categoria: item.produtos?.categoria || "—",
      monitorando: item.monitorando, preco_meta: item.preco_meta,
      preco: ult.preco ?? null, disponivel: ult.disponivel ?? false,
      // Sprint 41 (todo:204): sem nenhuma leitura ainda, o default fica em
      // "encontrado" (não em "não localizado") — mantém o mesmo comportamento
      // de sempre para item nunca coletado (cai em ESGOTADO pelo disponivel).
      encontrado: ult.encontrado ?? true,
      coletado_em: ult.coletado_em ?? null,
      // Menor preço já obtido (Sprint 12) — convive com a meta, não a substitui
      menor:    min.preco       ?? null,
      menor_em: min.coletado_em ?? null,
      // Dono do item (visão de admin; usuário normal só recebe os seus via RLS)
      dono_id:    item.user_id || null,
      dono_email: item.usuarios?.email || null,
      dono_nome:  item.usuarios?.nome  || null,
    };
  });
}

/**
 * Categorias cadastradas em `produtos` (Sprint 45, todo:245) — fonte única
 * para o filtro de categoria da Dashboard e o modal "Alterar categoria" do
 * ProductActionsDialog. Antes os dois usavam um dict estático (FILTROS_CAT)
 * que não sabia de categorias criadas depois pelo admin em "Criar categoria"
 * (Novo Produto, Sprints 31/33): a categoria nova ficava invisível nesses
 * dois lugares mesmo já existindo no banco. Mesma tabela que NovoProduto.jsx
 * já consulta ao carregar o formulário.
 */
export async function buscarCategorias() {
  const sb = await getSupabase();
  const { data, error } = await sb.from("produtos").select("categoria, nome");
  if (error || !data) return [];
  return data;
}

/**
 * Últimas leituras registradas no sistema, de qualquer item (Sprint 21) —
 * feed real de atividade para o ItemDetailPanel, no lugar do "log de
 * scraping ao vivo" 100% mockado do protótipo de referência (sem endpoint
 * real equivalente hoje). Dado genuíno: as leituras mais recentes que já
 * existem em historico_precos, com o nome/loja do item via join.
 */
export async function buscarAtividadeRecente(limite = 12) {
  const sb = await getSupabase();
  const { data } = await sb
    .from("historico_precos")
    .select("id, preco, disponivel, encontrado, coletado_em, itens(nome_na_loja, lojas(nome))")
    .order("coletado_em", { ascending: false })
    .limit(limite);
  return data || [];
}

/**
 * IDs de itens com QUALQUER leitura no dia civil de Brasília informado
 * (não só a última leitura) — busca paginada em blocos de 1000 (teto do
 * PostgREST). Usado pelo filtro "dia de coleta" (Sprint 14).
 */
export async function buscarItensDoDia(filtroDia) {
  const sb  = await getSupabase();
  const ini = `${filtroDia}T00:00:00-03:00`; // dia civil de Brasília
  const fim = new Date(new Date(ini).getTime() + 86400000).toISOString();
  const ids = new Set();
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await sb
      .from("historico_precos")
      .select("item_id")
      .gte("coletado_em", ini)
      .lt("coletado_em", fim)
      .range(de, de + PAGINA - 1);
    if (error || !data) break;
    data.forEach((r) => ids.add(r.item_id));
    if (data.length < PAGINA) break;
  }
  return ids;
}

/**
 * Contagem de itens distintos com leitura em cada um dos últimos `dias` dias
 * civis de Brasília (mais recente primeiro) — Sprint 21, CollectionsPanel.
 * NÃO é reuso de buscarItensDoDia (que resolve só 1 dia): agrega vários dias
 * de uma vez, com paginação em blocos de 1000 (teto do PostgREST).
 */
export async function buscarColetasPorDia(dias = 7) {
  const sb = await getSupabase();
  const hoje = new Date();
  const inicioJanela = new Date(hoje);
  inicioJanela.setUTCDate(inicioJanela.getUTCDate() - (dias - 1));
  const ini = `${diaBRT(inicioJanela)}T00:00:00-03:00`;

  const itensPorDia = new Map(); // "YYYY-MM-DD" -> Set(item_id)
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await sb
      .from("historico_precos")
      .select("item_id, coletado_em")
      .gte("coletado_em", ini)
      .range(de, de + PAGINA - 1);
    if (error || !data) break;
    data.forEach((r) => {
      const dia = diaBRT(r.coletado_em);
      if (!itensPorDia.has(dia)) itensPorDia.set(dia, new Set());
      itensPorDia.get(dia).add(r.item_id);
    });
    if (data.length < PAGINA) break;
  }

  const resultado = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(hoje);
    d.setUTCDate(d.getUTCDate() - i);
    const chave = diaBRT(d);
    resultado.push({ dia: chave, itens: itensPorDia.get(chave)?.size || 0 });
  }
  return resultado;
}

/**
 * Detalhe de um dia específico: todas as leituras do dia com a variação %
 * vs. a leitura imediatamente anterior de cada item (Sprint 21,
 * CollectionDayDialog) — lógica nova, não existia antes.
 */
export async function buscarDetalheDia(dia) {
  const sb  = await getSupabase();
  const ini = `${dia}T00:00:00-03:00`;
  const fim = new Date(new Date(ini).getTime() + 86400000).toISOString();

  let leituras = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await sb
      .from("historico_precos")
      .select("id, item_id, preco, disponivel, encontrado, coletado_em, itens(nome_na_loja, lojas(nome))")
      .gte("coletado_em", ini).lt("coletado_em", fim)
      .order("coletado_em", { ascending: false })
      .range(de, de + PAGINA - 1);
    if (error || !data) break;
    leituras = leituras.concat(data);
    if (data.length < PAGINA) break;
  }

  // Preço anterior a este dia, por item (uma query pequena e indexada por
  // item — o total de itens do catálogo é pequeno, nada de N+1 pesado)
  const itemIds = [...new Set(leituras.map((l) => l.item_id))];
  const anteriores = new Map();
  await Promise.all(itemIds.map(async (id) => {
    const { data } = await sb
      .from("historico_precos")
      .select("preco")
      .eq("item_id", id)
      .lt("coletado_em", ini)
      .not("preco", "is", null)
      .order("coletado_em", { ascending: false })
      .limit(1);
    if (data?.[0]) anteriores.set(id, data[0].preco);
  }));

  return leituras.map((l) => {
    const anterior = anteriores.get(l.item_id);
    const variacao = anterior && l.preco ? ((l.preco - anterior) / anterior) * 100 : null;
    return {
      id: l.id,
      nome: l.itens?.nome_na_loja || "—",
      loja: l.itens?.lojas?.nome || "—",
      preco: l.preco,
      disponivel: l.disponivel,
      encontrado: l.encontrado,
      coletadoEm: l.coletado_em,
      variacao,
    };
  });
}

/**
 * Histórico COMPLETO de um item, paginado em blocos de 1000 (o PostgREST
 * corta qualquer resposta em 1000 linhas — Sprint 10, todo:132).
 */
export async function buscarHistoricoCompleto(itemId) {
  const sb = await getSupabase();
  let todas = [], de = 0;
  for (;;) {
    const { data, error } = await sb
      .from("historico_precos")
      .select("id, preco, disponivel, encontrado, coletado_em")
      .eq("item_id", itemId)
      .order("coletado_em", { ascending: false })
      .range(de, de + PAGINA - 1);
    if (error || !data) break;
    todas = todas.concat(data);
    if (data.length < PAGINA) break;
    de += PAGINA;
  }
  return todas;
}

/**
 * Remove produtos/coletas via endpoint server-side (/api/remover),
 * que usa a SERVICE_KEY e ignora o RLS. Retorna a quantidade removida.
 * Flask atende em dev; Vercel Function em produção.
 */
export async function removerNoServidor(tipo, ids) {
  // Envia o access_token do usuário: o servidor valida a sessão e autoriza
  // apenas itens do próprio usuário (ou qualquer item, se admin).
  const sb = await getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  const resp = await fetch("/api/remover", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ tipo, ids }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data.removed ?? 0;
}
