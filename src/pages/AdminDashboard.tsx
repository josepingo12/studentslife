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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Modern iOS-style header */}
      <header className="sticky top-0 z-10 bg-background border-b" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Admin</h1>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="ios-button">
            <LogOut className="w-4 h-4 mr-1" />
            Esci
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4">
        <Tabs defaultValue="users" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 mb-4 h-auto bg-muted/30 p-1">
            <TabsTrigger value="users" className="flex-col gap-1 py-2 px-1 text-xs">
              <Users className="w-5 h-5" />
              <span>Utenti</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-col gap-1 py-2 px-1 text-xs">
              <BarChart3 className="w-5 h-5" />
              <span>Statist</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-col gap-1 py-2 px-1 text-xs">
              <FolderOpen className="w-5 h-5" />
              <span>Categorie</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="relative flex-col gap-1 py-2 px-1 text-xs">
              <div className="relative">
                <Flag className="w-5 h-5" />
                {pendingFlags > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
                  >
                    {pendingFlags}
                  </Badge>
                )}
              </div>
              <span>Mod</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-col gap-1 py-2 px-1 text-xs">
              <UserCircle className="w-5 h-5" />
              <span>Profilo</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-col gap-1 py-2 px-1 text-xs">
              <MessageCircle className="w-5 h-5" />
              <span>Chat</span>
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
