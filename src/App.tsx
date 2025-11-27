import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RegisterClient from "./pages/RegisterClient";
import RegisterPartner from "./pages/RegisterPartner";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import ClientDashboard from "./pages/ClientDashboard";
import PartnerDetails from "./pages/PartnerDetails";
import PartnerDashboard from "./pages/PartnerDashboard";
import Social from "./pages/Social";
import Chats from "./pages/Chats";
import ChatConversation from "./pages/ChatConversation";
import UserProfile from "./pages/UserProfile";
import Badges from "./pages/Badges";
import PendingApproval from "./pages/PendingApproval";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSetup from "./pages/AdminSetup";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Usa il sistema di auth centralizzato
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

// Handler para detectar tokens de recuperación de contraseña en la URL
const usePasswordRecoveryRedirect = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    const currentUrl = window.location.href;
    const hash = window.location.hash;
    const search = window.location.search;
    
    // Detecta si hay tokens de recuperación en la URL
    const hasRecoveryTokens = 
      currentUrl.includes('type=recovery') ||
      currentUrl.includes('access_token') ||
      search.includes('type=recovery') ||
      hash.includes('access_token');
    
    // Si estamos en /update-password sin hash routing, redirigir correctamente
    const isOnUpdatePasswordPath = window.location.pathname === '/update-password';
    
    if (hasRecoveryTokens || isOnUpdatePasswordPath) {
      setIsRedirecting(true);
      
      // Extraer tokens del hash fragment o query string
      let tokenParams = '';
      if (hash.includes('access_token')) {
        tokenParams = hash.replace('#', '');
      } else if (search) {
        tokenParams = search.replace('?', '');
      }
      
      // Redirigir a la ruta con hash incluyendo los tokens
      const newUrl = `${window.location.origin}/#/update-password${tokenParams ? '?' + tokenParams : ''}`;
      window.location.replace(newUrl);
    }
  }, []);
  
  return isRedirecting;
};

const App = () => {
  const { session, loading } = useAuth();
  const isRedirecting = usePasswordRecoveryRedirect();
  
  if (loading || isRedirecting) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px' }}>
        Caricamento app...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            {/* Se l'utente è già loggato, vai alla dashboard appropriata */}
            <Route
              path="/"
              element={
                session ? (
                  <Navigate to="/client-dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Rotte pubbliche */}
            <Route path="/register-client" element={<RegisterClient />} />
            <Route path="/register-partner" element={<RegisterPartner />} />
            <Route
              path="/login"
              element={
                session ? (
                  <Navigate to="/client-dashboard" replace />
                ) : (
                  <Login />
                )
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/home" element={<Index />} />

            {/* Rotte protette */}
            <Route
              path="/client-dashboard"
              element={
                <ProtectedRoute requireRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partner/:id"
              element={
                <ProtectedRoute>
                  <PartnerDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partner-dashboard"
              element={
                <ProtectedRoute requireRole="partner">
                  <PartnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/social"
              element={
                <ProtectedRoute>
                  <Social />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chats"
              element={
                <ProtectedRoute>
                  <Chats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:conversationId"
              element={
                <ProtectedRoute>
                  <ChatConversation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId?"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/badges"
              element={
                <ProtectedRoute>
                  <Badges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/admin-setup" element={<AdminSetup />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;