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

  // Carrega o perfil (nivel/nome) quando o usuário loga
  useEffect(() => {
    if (!user) { setPerfil(PERFIL_PADRAO); return; }
    let ativo = true;
    getSupabase().then((client) =>
      client.from("usuarios")
        .select("nivel, nome")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          // Falha (ex.: migração ainda não aplicada) → trata como normal
          if (ativo) setPerfil(!error && data ? data : PERFIL_PADRAO);
        })
    );
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

  const updatePassword = async (password) => {
    const client = await getSupabase();
    return client.auth.updateUser({ password });
  };

  const isAdmin = (perfil?.nivel ?? 1) >= 2;

  return { user, perfil, isAdmin, loading, sb, signIn, signOut, updatePassword };
}
