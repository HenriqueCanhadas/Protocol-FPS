/**
 * hooks/useAuth.js — PROTOCOL FPS
 * Gerencia estado de autenticação via Supabase Auth.
 */
import { useState, useEffect } from "react";
import { getSupabase } from "@/services/supabase";

export function useAuth() {
  const [user, setUser]       = useState(null);
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

  return { user, loading, sb, signIn, signOut, updatePassword };
}
