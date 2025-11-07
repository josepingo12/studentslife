import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom"; // Importa Navigate
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RegisterClient from "./pages/RegisterClient";
import RegisterPartner from "./pages/RegisterPartner";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import { InstallPWA } from "./components/shared/InstallPWA";

// Importa Supabase Client
import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react"; // Importa useState e useEffect

// CONFIGURA IL TUO CLIENT SUPABASE QUI usando le variabili d'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Usa la publishable key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage, // Supabase userà localStorage per persistenza della sessione
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Stato di caricamento iniziale

  useEffect(() => {
    // Funzione asincrona per ottenere la sessione iniziale e sottoscriversi ai cambiamenti
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false); // Sessione caricata, termina lo stato di caricamento

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        // Puoi aggiungere qui logica specifica se l'utente si disconnette/riconnette
      });

      // Pulizia al dismount del componente
      return () => {
        subscription.unsubscribe();
      };
    };

    getInitialSession();
  }, []); // Esegui solo al mount del componente

  // Mostra una schermata di caricamento mentre controlla la sessione iniziale
  if (loading) {
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
        <InstallPWA />
        <HashRouter>
          <Routes>
            {/* Logica di routing condizionale per la pagina iniziale basata sulla sessione */}
            <Route
              path="/"
              element={session ? <Navigate to="/client-dashboard" replace /> : <Login />} // Reindirizza a dashboard se loggato, altrimenti a Login
            />

            {/* Rotte pubbliche */}
            <Route path="/register-client" element={<RegisterClient />} />
            <Route path="/register-partner" element={<RegisterPartner />} />
            <Route path="/login" element={<Login />} /> {/* Mantieni la rotta login per accesso diretto, se necessario */}
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Rotte protette - Il componente ProtectedRoute gestirà il reindirizzamento se la sessione non è valida */}
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

            {/* Rotta catch-all per pagine non trovate */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
