/**
 * App.jsx — PROTOCOL FPS
 * Raiz da aplicação: roteamento, auth gate, drawer, toast global.
 */
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth }  from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

import LoginScreen from "@/components/LoginScreen";
import NavDrawer   from "@/components/NavDrawer";
import AppHeader   from "@/components/AppHeader";
import Toast       from "@/components/Toast";

import Dashboard   from "@/pages/Dashboard";
import NovoProduto from "@/pages/NovoProduto";
import Conta       from "@/pages/Conta";

export default function App() {
  const { user, perfil, isAdmin, loading, signIn, signOut, updatePassword } = useAuth();
  const { toast, showToast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          onLogout={() => signOut()}
        />

        <AppHeader
          onMenuClick={() => setDrawerOpen((o) => !o)}
          menuOpen={drawerOpen}
        />

        <Routes>
          <Route path="/"             element={<Dashboard   showToast={showToast} isAdmin={isAdmin} user={user} />} />
          <Route path="/novo-produto" element={<NovoProduto showToast={showToast} user={user} />} />
          <Route path="/conta"        element={
            <Conta
              user={user}
              perfil={perfil}
              updatePassword={updatePassword}
              signOut={signOut}
              showToast={showToast}
            />
          } />
          {/* Rotas legadas do HTML puro → redireciona */}
          <Route path="/novo_produto" element={<Navigate to="/novo-produto" replace />} />
          <Route path="/usuario"      element={<Navigate to="/conta"        replace />} />
          <Route path="*"             element={<Navigate to="/"             replace />} />
        </Routes>

        <Toast toast={toast} />
      </div>
    </BrowserRouter>
  );
}
