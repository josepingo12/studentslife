import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, BarChart3, FolderOpen, UserCircle, MessageCircle, Flag } from "lucide-react";
import UsersManagement from "@/components/admin/UsersManagement";
import Statistics from "@/components/admin/Statistics";
import CategoriesManagement from "@/components/admin/CategoriesManagement";
import AdminProfile from "@/components/admin/AdminProfile";
import AdminChats from "@/components/admin/AdminChats";
import ModerationPanel from "@/components/admin/ModerationPanel";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pendingFlags, setPendingFlags] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    loadPendingFlags();

    // Realtime subscription for flags
    const channel = supabase
      .channel("admin-flags-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_flags",
        },
        () => {
          loadPendingFlags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!isAdmin) {
        navigate("/");
        return;
      }

      setLoading(false);
    } catch (error) {
      navigate("/");
    }
  };

  const loadPendingFlags = async () => {
    try {
      const { count } = await supabase
        .from("content_flags")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      setPendingFlags(count || 0);
    } catch (error) {
      console.error("Error loading pending flags:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" className="ios-button">
            <LogOut className="w-4 h-4 mr-2" />
            Esci
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Utenti
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiche
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderOpen className="w-4 h-4 mr-2" />
              Categorie
            </TabsTrigger>
            <TabsTrigger value="moderation" className="relative">
              <Flag className="w-4 h-4 mr-2" />
              Moderazione
              {pendingFlags > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {pendingFlags}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserCircle className="w-4 h-4 mr-2" />
              Profilo
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="stats">
            <Statistics />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesManagement />
          </TabsContent>

          <TabsContent value="moderation">
            <ModerationPanel />
          </TabsContent>

          <TabsContent value="profile">
            <AdminProfile />
          </TabsContent>

          <TabsContent value="chat">
            <AdminChats />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
