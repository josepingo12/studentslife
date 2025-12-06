import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LogOut, Users, BarChart3, FolderOpen, MessageCircle, Flag, Home, Plus, Search, X } from "lucide-react";
import UsersManagement from "@/components/admin/UsersManagement";
import Statistics from "@/components/admin/Statistics";
import CategoriesManagement from "@/components/admin/CategoriesManagement";
import AdminChats from "@/components/admin/AdminChats";
import ModerationPanel from "@/components/admin/ModerationPanel";
import PostCard from "@/components/social/PostCard";
import UploadSheet from "@/components/shared/UploadSheet";
import NotificationBadge from "@/components/chat/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AdminTab = "social" | "users" | "stats" | "categories" | "moderation" | "chats";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pendingFlags, setPendingFlags] = useState(0);
  const [activeTab, setActiveTab] = useState<AdminTab>("social");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const totalUnread = useUnreadMessages(user?.id);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("profile_image_url, first_name, last_name")
        .eq("id", userId)
        .single();
      if (data) setUserProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

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
      loadUserProfile(authUser.id);
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, business_name, profile_image_url, email")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,business_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(8);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
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
            {/* Modern Search Bar */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={t('search.searchUsers', 'Buscar usuarios...')}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-10 h-12 rounded-2xl bg-muted/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                    className="absolute right-3 p-1 rounded-full hover:bg-muted"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-2xl shadow-xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t('search.searching', 'Buscando...')}
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t('search.noResults', 'No se encontraron usuarios')}
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            navigate(`/profile/${result.id}`);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-border/30">
                            <AvatarImage src={result.profile_image_url} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                              {(result.first_name?.[0] || result.business_name?.[0] || "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground text-sm">
                              {result.business_name || `${result.first_name || ""} ${result.last_name || ""}`.trim() || "Usuario"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{result.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Cargando posts...</div>
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
            <Avatar className="h-11 w-11 ring-2 ring-primary/30 shadow-lg">
              <AvatarImage src={userProfile?.profile_image_url} />
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-pink-600 text-white font-bold">
                {userProfile?.first_name?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
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
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 py-4">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation - Modern Glass Style */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Glass background */}
        <div className="bg-background/80 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-black/20">
          <div className="flex items-end justify-around px-2 pt-2 pb-3">
          {/* Social */}
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === "social"
                ? "text-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === "social" ? "bg-primary/15 scale-110" : ""}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight">Social</span>
          </button>

          {/* Users */}
          <button
            onClick={() => setActiveTab("users")}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === "users"
                ? "text-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === "users" ? "bg-primary/15 scale-110" : ""}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight">Usuarios</span>
          </button>

          {/* Central Upload Button */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-8 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-full blur-lg opacity-50 animate-pulse" />
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-pink-600 text-white shadow-xl shadow-pink-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 ring-4 ring-background">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
          </button>

          {/* Stats */}
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === "stats"
                ? "text-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === "stats" ? "bg-primary/15 scale-110" : ""}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-tight">Stats</span>
          </button>

          {/* Moderation + Chat Combined as More */}
          <button
            onClick={() => setActiveTab("moderation")}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === "moderation" || activeTab === "chats" || activeTab === "categories"
                ? "text-primary"
                : "text-muted-foreground/70 hover:text-foreground"
            }`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 relative ${activeTab === "moderation" || activeTab === "chats" || activeTab === "categories" ? "bg-primary/15 scale-110" : ""}`}>
              <Flag className="w-5 h-5" />
              {(pendingFlags > 0 || totalUnread > 0) && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center px-1">
                  {(pendingFlags + totalUnread) > 99 ? "99+" : pendingFlags + totalUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight">Más</span>
          </button>
        </div>

        {/* Secondary Quick Access Bar */}
        {(activeTab === "moderation" || activeTab === "chats" || activeTab === "categories") && (
          <div className="flex items-center justify-center gap-2 px-4 pb-3 pt-1">
            <button
              onClick={() => setActiveTab("moderation")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "moderation"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              Mod
              {pendingFlags > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {pendingFlags}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "chats"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
              {totalUnread > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {totalUnread}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "categories"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Categ
            </button>
          </div>
        )}
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