import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWebNotifications } from "@/hooks/useWebNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, User, Home, Users, MessageCircle, UserCircle, Plus, Search, X, Heart, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CategoryCarousel from "@/components/client/CategoryCarousel";
import PartnersList from "@/components/client/PartnersList";
import RecentPartners from "@/components/client/RecentPartners";
import StoriesCarousel from "@/components/social/StoriesCarousel";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";
import UploadSheet from "@/components/shared/UploadSheet";
import NotificationBadge from "@/components/chat/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import ChatsList from "@/components/chat/ChatsList";
import NotificationsSheet from "@/components/social/NotificationsSheet";
import ClientSettingsSheet from "@/components/client/ClientSettingsSheet";
import WalletSheet from "@/components/client/WalletSheet";
import { useTranslation } from "react-i18next";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"social" | "partners" | "chats">("social");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const totalUnread = useUnreadMessages(user?.id);
  const unreadNotifications = useUnreadNotifications(user?.id);
  const [userRole, setUserRole] = useState<string>();

  // Abilita notifiche web
  useWebNotifications({ userId: user?.id });

  useEffect(() => {
    checkAuth();
    if (activeTab === "social") {
      loadPosts();
      subscribeToNewPosts();
    }
  }, [activeTab]);

  useEffect(() => {
    const loadUserRole = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        if (data) {
          setUserRole(data.role);
        }
      }
    };
    loadUserRole();
  }, [user?.id]);

  const subscribeToNewPosts = () => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: role, error: roleError } = await supabase.rpc('get_user_role', { _user_id: user.id });

    console.log("Client dashboard - Role check:", { role }, "Error:", roleError);

    if (role !== "client") {
      if (role === "partner") {
        navigate("/partner-dashboard");
      } else {
        navigate("/login");
      }
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        public_profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, business_name),
        likes(id, user_id)
      `)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
    setLoadingPosts(false);
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isLiked 
            ? [...post.likes, { id: 'temp', user_id: user?.id }]
            : post.likes.filter((l: any) => l.user_id !== user?.id)
        };
      }
      return post;
    }));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, business_name, profile_image_url")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,business_name.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const getDisplayName = (profile: any) => {
    if (profile.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile.business_name || "Utente";
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-24">
      {/* Content based on active tab */}
      {activeTab === "social" ? (
        <div className="max-w-[470px] mx-auto w-full">
          {/* Top Bar with Settings */}
          <div className="flex justify-end px-4 pt-4">
            <Button
              onClick={() => setSettingsSheetOpen(true)}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mx-4 mt-2">
            <div className="relative ios-card p-3">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 border-none bg-transparent focus-visible:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-10"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              {/* Search Results Dropdown */}
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-lg border border-border z-50 max-h-80 overflow-y-auto">
                  {searching ? (
                    <p className="text-sm text-muted-foreground text-center py-6">{t('common.loading')}</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">{t('common.search')}</p>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            navigate(`/profile/${result.id}`);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={result.profile_image_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getDisplayName(result)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1">
                            <p className="font-semibold">{getDisplayName(result)}</p>
                            {result.first_name && result.business_name && (
                              <p className="text-xs text-muted-foreground">{result.business_name}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stories */}
          <div className="mt-4">
            <StoriesCarousel currentUserId={user.id} />
          </div>

          {/* Create Post */}
          <div className="mx-4 mt-4">
            <CreatePost 
              userId={user.id} 
              userProfile={profile}
              onPostCreated={handlePostCreated}
            />
          </div>

          {/* Posts Feed */}
          <div className="mx-4 mt-4 space-y-4">
            {loadingPosts ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 ios-card">
                <p className="text-muted-foreground">{t('post.noPosts')}</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  onDelete={handlePostDeleted}
                  onLikeToggle={handleLikeToggle}
                />
              ))
            )}
          </div>
        </div>
      ) : activeTab === "chats" ? (
        <div className="mt-4">
          <ChatsList currentUserId={user.id} />
        </div>
      ) : (
        <>
          {/* Recent Partners */}
          <div className="mt-6">
            <RecentPartners userId={user.id} />
          </div>

          {/* Category Carousel */}
          <div className="mt-6 px-4">
            <h3 className="text-xl font-bold mb-4">{t('partner.category')}</h3>
            <CategoryCarousel onSelectCategory={setSelectedCategory} />
          </div>

          {/* Partners List */}
          {selectedCategory && (
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4 px-4">{t('navigation.partners')}</h3>
              <div className="px-4">
                <PartnersList category={selectedCategory} />
              </div>
            </div>
          )}

          {!selectedCategory && (
            <div className="mt-12 text-center px-4">
              <p className="text-muted-foreground">
                {t('partner.category')}
              </p>
            </div>
          )}
        </>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-between h-20 px-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "social" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.social')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("partners")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === "partners" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.partners')}</span>
          </button>

          {/* Central Upload Button */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="flex flex-col items-center gap-1 transition-colors text-muted-foreground"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium">Carica</span>
          </button>

          <button
            onClick={() => setLikesSheetOpen(true)}
            className="flex flex-col items-center gap-1 transition-colors text-muted-foreground relative"
          >
            <div className="relative">
              <Heart className="w-6 h-6" />
              <NotificationBadge count={unreadNotifications} />
            </div>
            <span className="text-xs font-medium">Notifiche</span>
          </button>

          <button
            onClick={() => setActiveTab("chats")}
            className={`flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === "chats" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-xs font-medium">{t('navigation.chat')}</span>
          </button>
          
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center gap-1 transition-colors text-muted-foreground"
          >
            <UserCircle className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.profile')}</span>
          </button>
        </div>
      </div>

      {/* Upload Sheet */}
      <UploadSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        userId={user.id}
        onUploadComplete={() => {
          if (activeTab === "social") {
            loadPosts();
          }
        }}
      />

      {/* Settings Sheet */}
      <ClientSettingsSheet
        open={settingsSheetOpen}
        onOpenChange={setSettingsSheetOpen}
      />

      {/* Notifications Sheet */}
      <NotificationsSheet
        open={likesSheetOpen}
        onOpenChange={setLikesSheetOpen}
        userId={user.id}
        userRole={userRole}
      />

      {/* Wallet Sheet */}
      <WalletSheet
        open={walletSheetOpen}
        onOpenChange={setWalletSheetOpen}
        userId={user.id}
      />

      {/* Floating Wallet Button - Only visible in partners tab */}
      {activeTab === "partners" && (
        <button
          onClick={() => setWalletSheetOpen(true)}
          className="fixed bottom-24 right-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40 border-2 border-white/20"
        >
          <Wallet className="w-7 h-7" />
        </button>
      )}
    </div>
  );
};

export default ClientDashboard;
