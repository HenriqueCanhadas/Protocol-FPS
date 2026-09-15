/**
 * hooks/useAuth.js — PROTOCOL FPS
 * Gerencia estado de autenticação via Supabase Auth + perfil (tabela usuarios).
 *
 * Papéis (usuarios.nivel): 1 = normal · 2 = admin.
 * O RLS já isola os dados por usuário; o perfil aqui serve para a UI
 * saber se deve exibir a visão de admin (itens de todos, por usuário).
 */
import { useState, useEffect } from "react";
import { getSupabase } from "@/services/supabase";

const PERFIL_PADRAO = { nivel: 1, nome: null };
// De quanto em quanto tempo o perfil é relido (Sprint 78 — bloqueio no meio
// de uma sessão aberta). É uma consulta de 1 linha por chave primária.
const REVALIDA_PERFIL_MS = 60000;

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [perfil, setPerfil]   = useState(PERFIL_PADRAO);
  const [loading, setLoading] = useState(true);
  // uid dono do perfil já carregado — perfilLoading é DERIVADO disso no
  // render (nunca fica obsoleto entre a sessão chegar e o efeito rodar)
  const [perfilDe, setPerfilDe] = useState(null);
  const [sb, setSb]           = useState(null);

  useEffect(() => {
    let unsub;
    getSupabase().then((client) => {
      setSb(client);
      // Sessão atual
      client.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
      // Escuta mudanças
      const { data } = client.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
      unsub = data.subscription;
    });
    return () => unsub?.unsubscribe();
  }, []);

  // Carrega o perfil (nivel/nome/ver_banco/bloqueado) quando o usuário loga,
  // e REVALIDA periodicamente (Sprint 78): um usuário bloqueado no meio de
  // uma sessão já aberta tem de perder o acesso na verificação seguinte, e
  // não continuar navegando até o token expirar.
  useEffect(() => {
    if (!user) { setPerfil(PERFIL_PADRAO); setPerfilDe(null); return; }
    let ativo = true;

    const carregarPerfil = async () => {
      const client = await getSupabase();
      // Colunas opcionais degradam uma a uma: bloqueado (sprint78) e
      // ver_banco (sprint32b) podem não existir se a migração não rodou —
      // nada disso pode derrubar nivel/isAdmin.
      let { data, error } = await client.from("usuarios")
        .select("nivel, nome, ver_banco, bloqueado").eq("id", user.id).single();
      if (error) {
        ({ data, error } = await client.from("usuarios")
          .select("nivel, nome, ver_banco").eq("id", user.id).single());
      }
      if (error) {
        ({ data, error } = await client.from("usuarios")
          .select("nivel, nome").eq("id", user.id).single());
      }
      // Falha (ex.: migração multiusuário ainda não aplicada) → trata como normal
      if (ativo) {
        setPerfil(!error && data ? data : PERFIL_PADRAO);
        setPerfilDe(user.id);
      }
    };

    carregarPerfil();
    const id = setInterval(carregarPerfil, REVALIDA_PERFIL_MS);
    // Voltar para a aba também revalida — cobre a janela deixada aberta em
    // segundo plano, onde o intervalo pode ter sido estrangulado pelo browser
    const aoVoltar = () => { if (document.visibilityState === "visible") carregarPerfil(); };
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      ativo = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [user]);

  const signIn = async (email, password) => {
    const client = await getSupabase();
    return client.auth.signInWithPassword({ email, password });
  };

  const signOut = async (scope = "local") => {
    const client = await getSupabase();
    return client.auth.signOut({ scope });
  };

  // (updatePassword removido na Sprint 13 — troca de senha só pelo fluxo
  // admin em /usuarios, via /api/usuarios acao=trocar_senha)

  const isAdmin = (perfil?.nivel ?? 1) >= 2;
  // Permissão independente de nivel — só quem tem usuarios.ver_banco=true
  // enxerga /admin (Sprint 32b: por padrão só o dono da conta; só ele pode
  // liberar para outra pessoa, pela tela Usuários).
  const podeVerBanco = Boolean(perfil?.ver_banco);
  // Sprint 78 (todo:310): conta barrada pelo dono. Aqui é só a EXPERIÊNCIA
  // (mostrar uma tela explicando, em vez de um app vazio) — a barragem real
  // é o ban na admin API do Supabase + o veto do RLS (ver a migração
  // sprint78_bloquear_usuario.sql). Enquanto o perfil não chegou, ninguém é
  // tratado como bloqueado: o padrão é não expulsar quem talvez esteja ok.
  const bloqueado = Boolean(perfil?.bloqueado);
  // true enquanto há sessão mas o perfil dela ainda não chegou — páginas
  // que dependem de isAdmin/podeVerBanco devem esperar antes de redirecionar
  const perfilLoading = Boolean(user) && perfilDe !== user.id;

  return { user, perfil, isAdmin, podeVerBanco, bloqueado, loading, perfilLoading, sb, signIn, signOut };
}
