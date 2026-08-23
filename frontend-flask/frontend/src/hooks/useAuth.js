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

  // Carrega o perfil (nivel/nome/ver_banco) quando o usuário loga
  useEffect(() => {
    if (!user) { setPerfil(PERFIL_PADRAO); setPerfilDe(null); return; }
    let ativo = true;
    getSupabase().then(async (client) => {
      let { data, error } = await client.from("usuarios")
        .select("nivel, nome, ver_banco").eq("id", user.id).single();
      if (error) {
        // ver_banco pode não existir ainda (migração sprint32b pendente) —
        // não deixa isso derrubar nivel/isAdmin, só cai sem ver_banco
        ({ data, error } = await client.from("usuarios")
          .select("nivel, nome").eq("id", user.id).single());
      }
      // Falha (ex.: migração multiusuário ainda não aplicada) → trata como normal
      if (ativo) {
        setPerfil(!error && data ? data : PERFIL_PADRAO);
        setPerfilDe(user.id);
      }
    });
    return () => { ativo = false; };
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
  // true enquanto há sessão mas o perfil dela ainda não chegou — páginas
  // que dependem de isAdmin/podeVerBanco devem esperar antes de redirecionar
  const perfilLoading = Boolean(user) && perfilDe !== user.id;

  return { user, perfil, isAdmin, podeVerBanco, loading, perfilLoading, sb, signIn, signOut };
}
