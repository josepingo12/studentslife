import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/studentslife">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register-client" element={<RegisterClient />} />
          <Route path="/register-partner" element={<RegisterPartner />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/partner/:id" element={<PartnerDetails />} />
          <Route path="/partner-dashboard" element={<PartnerDashboard />} />
          <Route path="/social" element={<Social />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:conversationId" element={<ChatConversation />} />
          <Route path="/profile/:userId?" element={<UserProfile />} />
          
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
