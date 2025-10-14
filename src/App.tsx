import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
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

import AdminDashboard from "./pages/AdminDashboard";
import AdminSetup from "./pages/AdminSetup";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { InstallPWA } from "./components/shared/InstallPWA";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPWA />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register-client" element={<RegisterClient />} />
          <Route path="/register-partner" element={<RegisterPartner />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
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
            path="/admin" 
            element={
              <ProtectedRoute requireRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin-setup" element={<AdminSetup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
