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
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    
    // Detectar si estamos en la ruta de recuperación de contraseña (sin HashRouter)
    // Supabase redirige a: /password-recovery#access_token=xxx
    const isPasswordRecoveryPath = pathname === '/password-recovery';
    
    if (isPasswordRecoveryPath) {
      setIsRedirecting(true);
      
      // Los tokens están en el hash: #access_token=xxx&refresh_token=xxx
      const tokenParams = hash.replace('#', '');
      
      // Redirigir a la ruta HashRouter con los tokens como query params
      const newUrl = `${window.location.origin}/#/update-password?${tokenParams}`;
      window.location.replace(newUrl);
      return;
    }
    
    // También manejar si el hash tiene doble # (edge case)
    if (hash.includes('#') && hash.includes('access_token')) {
      setIsRedirecting(true);
      const parts = hash.split('#');
      const route = parts[1]?.split('?')[0] || 'update-password';
      const tokens = parts.find(p => p.includes('access_token')) || '';
      const newUrl = `${window.location.origin}/#/${route}?${tokens}`;
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