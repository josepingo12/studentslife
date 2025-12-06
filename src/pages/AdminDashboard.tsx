import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, BarChart3, FolderOpen, MessageCircle, Flag, Home, Settings, Plus } from "lucide-react";
import UsersManagement from "@/components/admin/UsersManagement";
import Statistics from "@/components/admin/Statistics";
import CategoriesManagement from "@/components/admin/CategoriesManagement";
import AdminChats from "@/components/admin/AdminChats";
import ModerationPanel from "@/components/admin/ModerationPanel";
import PostCard from "@/components/social/PostCard";
import StoriesCarousel from "@/components/social/StoriesCarousel";
import UploadSheet from "@/components/shared/UploadSheet";
import NotificationBadge from "@/components/chat/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useTranslation } from "react-i18next";

type AdminTab = "social" | "users" | "stats" | "categories" | "moderation" | "chats";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pendingFlags, setPendingFlags] = useState(0);
  const [activeTab, setActiveTab] = useState<AdminTab>("social");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const totalUnread = useUnreadMessages(user?.id);

  useEffect(() => {
    checkAdminAccess();
    loadPendingFlags();

    const flagsChannel = supabase
      .channel("admin-flags-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_flags" }, () => loadPendingFlags())
      .subscribe();

    const postsChannel = supabase
      .channel("admin-posts-moderation")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: "auto_moderated=eq.true" }, () => loadPendingFlags())
      .subscribe();

    const commentsChannel = supabase
      .channel("admin-comments-moderation")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: "auto_moderated=eq.true" }, () => loadPendingFlags())
      .subscribe();

    const messagesChannel = supabase
      .channel("admin-messages-moderation")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: "auto_moderated=eq.true" }, () => loadPendingFlags())
      .subscribe();

    const storiesChannel = supabase
      .channel("admin-stories-moderation")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories", filter: "auto_moderated=eq.true" }, () => loadPendingFlags())
      .subscribe();

    return () => {
      supabase.removeChannel(flagsChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(storiesChannel);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "social" && user) {
      loadPosts();
    }
  }, [activeTab, user]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/");
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: authUser.id,
        _role: "admin",
      });

      if (!isAdmin) {
        navigate("/");
        return;
      }

      setUser(authUser);
      setLoading(false);
    } catch (error) {
      navigate("/");
    }
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          public_profiles:user_id (
            id,
            first_name,
            last_name,
            business_name,
            profile_image_url
          ),
          likes (
            id,
            user_id
          )
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadPendingFlags = async () => {
    try {
      const { count: manualFlagsCount } = await supabase
        .from("content_flags")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      const { count: autoPostsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("auto_moderated", true)
        .eq("status", "pending");

      const { count: autoCommentsCount } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("auto_moderated", true)
        .eq("status", "pending");

      const { count: autoMessagesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("auto_moderated", true)
        .eq("status", "pending");

      const { count: autoStoriesCount } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("auto_moderated", true)
        .eq("status", "pending");
      
      const totalPending = (manualFlagsCount || 0) + 
                           (autoPostsCount || 0) + 
                           (autoCommentsCount || 0) + 
                           (autoMessagesCount || 0) +
                           (autoStoriesCount || 0);
      
      setPendingFlags(totalPending);
    } catch (error) {
      console.error("Error loading pending flags:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isLiked 
            ? [...(post.likes || []), { id: "temp", user_id: user?.id }]
            : (post.likes || []).filter((like: any) => like.user_id !== user?.id)
        };
      }
      return post;
    }));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "social":
        return (
          <div className="space-y-4">
            <StoriesCarousel currentUserId={user?.id} />
            
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Caricamento post...</div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('social.noPosts')}</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-[470px] mx-auto">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    onDelete={handleDeletePost}
                    onLikeToggle={handleLikeToggle}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case "users":
        return <UsersManagement />;
      case "stats":
        return <Statistics />;
      case "categories":
        return <CategoriesManagement />;
      case "moderation":
        return <ModerationPanel />;
      case "chats":
        return <AdminChats />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Modern Header */}
      <header 
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
      >
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">StudentsLife</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="rounded-full">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation - iOS Style */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {/* Social */}
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[60px] ${
              activeTab === "social"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Social</span>
          </button>

          {/* Users */}
          <button
            onClick={() => setActiveTab("users")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[60px] ${
              activeTab === "users"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Usuarios</span>
          </button>

          {/* Upload Button - Central */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </button>

          {/* Moderation */}
          <button
            onClick={() => setActiveTab("moderation")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[60px] relative ${
              activeTab === "moderation"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <Flag className="w-5 h-5" />
              {pendingFlags > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 min-w-[16px] rounded-full p-0 flex items-center justify-center text-[9px]"
                >
                  {pendingFlags > 99 ? "99+" : pendingFlags}
                </Badge>
              )}
            </div>
            <span className="text-[10px] font-medium">Mod</span>
          </button>

          {/* Chat */}
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all min-w-[60px] relative ${
              activeTab === "chats"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-[10px] font-medium">Chat</span>
          </button>
        </div>

        {/* Secondary Nav Row */}
        <div className="flex items-center justify-center gap-8 px-4 py-2 border-t border-border/30">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm ${
              activeTab === "stats"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estadísticas</span>
          </button>
          
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm ${
              activeTab === "categories"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Categorías</span>
          </button>
        </div>
      </div>

      {/* Upload Sheet */}
      <UploadSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        userId={user?.id}
        onUploadComplete={() => {
          if (activeTab === "social") {
            loadPosts();
          }
        }}
      />
    </div>
  );
};

export default AdminDashboard;