/**
 * App.jsx — PROTOCOL FPS
 * Raiz da aplicação: roteamento, auth gate, drawer, toast global.
 */
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth }       from "@/hooks/useAuth";
import { useToast }      from "@/hooks/useToast";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useKonami, playKonamiSound } from "@/hooks/useKonami";

import LoginScreen   from "@/components/LoginScreen";
import BlockedScreen from "@/components/BlockedScreen";
import NavDrawer   from "@/components/NavDrawer";
import AppHeader   from "@/components/AppHeader";
import Toast       from "@/components/Toast";
import KonamiModal from "@/components/KonamiModal";

import Dashboard   from "@/pages/Dashboard";
import NovoProduto from "@/pages/NovoProduto";
import Usuarios    from "@/pages/Usuarios";
import Admin       from "@/pages/Admin";
import Conta       from "@/pages/Conta";

export default function App() {
  const { user, perfil, isAdmin, podeVerBanco, bloqueado, loading, perfilLoading, signIn, signOut } = useAuth();
  const { toast, showToast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [konamiOpen, setKonamiOpen] = useState(false);

  // Sprint 79: Easter Egg Konami Code com som 8-bit e modal retrô
  useKonami(() => {
    playKonamiSound();
    setKonamiOpen(true);
    showToast("🎮 CHEAT CODE ATIVADO! +30 Vidas no PROTOCOL FPS", "ok");
  });

  // Sprint 13: sessão expira após 30 min sem atividade (ou janela fechada)
  useAutoLogout(user, () => {
    signOut();
    showToast("Sessão encerrada por inatividade — faça login novamente.", "error");
  });

  // Enquanto verifica sessão, mostra spinner mínimo
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  // Não logado → tela de login
  if (!user) {
    return (
      <>
        <LoginScreen onLogin={signIn} />
        <Toast toast={toast} />
        <KonamiModal open={konamiOpen} onClose={() => setKonamiOpen(false)} />
      </>
    );
  }

  // Sprint 78 (todo:310): conta bloqueada pelo dono → nem chega à SPA.
  // O perfil é relido de minuto em minuto (useAuth), então um bloqueio
  // aplicado no meio de uma sessão já aberta cai aqui na verificação
  // seguinte, em vez de deixar a pessoa navegando até o token expirar.
  if (bloqueado) {
    return (
      <>
        <BlockedScreen email={user.email} onSair={() => signOut()} />
        <Toast toast={toast} />
      </>
    );
  }

  // Logado → SPA completa
  return (
    <BrowserRouter>
      <div id="app" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <NavDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          isAdmin={isAdmin}
          podeVerBanco={podeVerBanco}
          onLogout={() => signOut()}
        />

        <AppHeader
          onMenuClick={() => setDrawerOpen((o) => !o)}
          menuOpen={drawerOpen}
        />

        <Routes>
          <Route path="/"             element={<Dashboard   showToast={showToast} isAdmin={isAdmin} user={user} />} />
          <Route path="/novo-produto" element={<NovoProduto showToast={showToast} user={user} isAdmin={isAdmin} />} />
          <Route path="/usuarios"     element={<Usuarios showToast={showToast} isAdmin={isAdmin} perfilLoading={perfilLoading} user={user} />} />
          <Route path="/admin"        element={<Admin podeVerBanco={podeVerBanco} perfilLoading={perfilLoading} />} />
          <Route path="/conta"        element={
            <Conta user={user} perfil={perfil} signOut={signOut} />
          } />
          {/* Rotas legadas → redireciona */}
          <Route path="/novo_produto" element={<Navigate to="/novo-produto" replace />} />
          <Route path="/novo-usuario" element={<Navigate to="/usuarios"     replace />} />
          <Route path="/usuario"      element={<Navigate to="/conta"        replace />} />
          <Route path="*"             element={<Navigate to="/"             replace />} />
        </Routes>

        <Toast toast={toast} />
        <KonamiModal open={konamiOpen} onClose={() => setKonamiOpen(false)} />
      </div>
    </BrowserRouter>
  );
}
