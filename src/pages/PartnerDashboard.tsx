import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWebNotifications } from "@/hooks/useWebNotifications";
import { Button } from "@/components/ui/button";
import { Home, QrCode, BarChart3, UserCircle, Users, Plus, Calendar, Image as ImageIcon, MessageCircle, ArrowLeftRight, Settings, Heart, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import PartnerGalleryManager from "@/components/partner/PartnerGalleryManager";
import PartnerEventsManager from "@/components/partner/PartnerEventsManager";
import QRScanner from "@/components/partner/QRScanner";
import PartnerStats from "@/components/partner/PartnerStats";
import PartnerProfileEdit from "@/components/partner/PartnerProfileEdit";
import PartnerSocialProfile from "@/components/partner/PartnerSocialProfile";
import StoriesCarousel from "@/components/social/StoriesCarousel";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";
import UploadSheet from "@/components/shared/UploadSheet";
import NotificationBadge from "@/components/chat/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import SettingsSheet from "@/components/partner/SettingsSheet";
import NotificationsSheet from "@/components/social/NotificationsSheet";
import { MapPin } from "lucide-react";

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"social" | "events" | "gallery" | "scanner" | "stats" | "profile">("social");
  const [profileView, setProfileView] = useState<"social" | "business">("social");
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const totalUnread = useUnreadMessages(user?.id);
  const unreadNotifications = useUnreadNotifications(user?.id);
  const [userRole, setUserRole] = useState<string>();

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

  const loadPosts = async () => {
    setLoadingPosts(true);
    const { data: postsData } = await supabase
      .from("posts")
      .select(
        `
        *,
        public_profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, business_name),
        likes(id, user_id)
        `
      )
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

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: role, error: roleError } = await supabase.rpc('get_user_role', { _user_id: user.id });

    console.log("Partner dashboard - Role check:", { role }, "Error:", roleError);

    if (role !== "partner") {
      if (role === "client") {
        navigate("/client-dashboard");
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('auth.logout'),
      description: t('success.loggedOut'),
    });
    navigate("/login");
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Modern iOS-style header */}
      <header className="sticky top-0 z-10 bg-background border-b" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))', paddingBottom: '0.75rem' }}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">
            {activeTab === "social" && "Social"}
            {activeTab === "events" && t('navigation.events')}
            {activeTab === "gallery" && "Gallery"}
            {activeTab === "scanner" && "Scanner"}
            {activeTab === "stats" && t('navigation.stats')}
            {activeTab === "profile" && t('navigation.profile')}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/chats")}
              className="relative p-2 hover:bg-muted rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {totalUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => setSettingsSheetOpen(true)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className="hover:scale-105 transition-transform"
            >
              <Avatar className="h-9 w-9 ring-2 ring-muted">
                <AvatarImage src={profile?.profile_image_url} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getDisplayName(profile)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
        
        {/* Search bar - only visible on social tab */}
        {activeTab === "social" && (
          <div className="container mx-auto px-4 mt-3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Cerca utenti..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 rounded-full border-muted-foreground/20 bg-muted/50"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hover:bg-muted rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {searchQuery && (
              <div className="absolute top-[calc(100%+0.5rem)] left-4 right-4 bg-card rounded-xl shadow-xl border z-50 max-h-80 overflow-y-auto">
                {searching ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('common.loading')}</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nessun utente trovato</p>
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
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={result.profile_image_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getDisplayName(result)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1">
                          <p className="font-semibold">{getDisplayName(result)}</p>
                          {result.first_name && result.business_name && (
                            <p className="text-sm text-muted-foreground">{result.business_name}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      {activeTab === "social" ? (
        <div className="flex-1 overflow-y-auto pb-24">
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
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-600">{t('post.noPosts')}</p>
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
      ) : activeTab === "events" ? (
        <div className="px-4 mt-4">
          <PartnerEventsManager partnerId={user.id} />
        </div>
      ) : activeTab === "gallery" ? (
        <div className="px-4 mt-4">
          <PartnerGalleryManager partnerId={user.id} />
        </div>
      ) : activeTab === "scanner" ? (
        <div className="px-4 mt-4">
          <QRScanner partnerId={user.id} />
        </div>
      ) : activeTab === "stats" ? (
        <div className="px-4 mt-4">
          <PartnerStats partnerId={user.id} />
        </div>
      ) : (
        <div className="mt-4">
          {/* Profile Content */}
          {profileView === "social" ? (
            <PartnerSocialProfile
              profile={profile}
              userId={user.id}
              onUpdate={checkAuth}
              onSwitchToBusiness={() => setProfileView("business")}
            />
          ) : (
            <div className="px-4">
              {/* Switch Back Button */}
              <div className="mb-4 flex justify-center">
                <Button
                  onClick={() => setProfileView("social")}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {t('profile.socialProfile')}
                </Button>
              </div>
              <PartnerProfileEdit profile={profile} onUpdate={checkAuth} />
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation - Modern iOS style */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
        <div className="flex items-center justify-around px-2 pt-2 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${
              activeTab === "social"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Social</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${
              activeTab === "events"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Eventi</span>
          </button>

          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${
              activeTab === "scanner"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <QrCode className="w-6 h-6" />
            <span className="text-xs font-medium">QR</span>
          </button>

          {/* Central Upload Button */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-all flex-shrink-0 mx-1"
          >
            <Plus className="w-7 h-7" />
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${
              activeTab === "stats"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Stats</span>
          </button>

          <button
            onClick={() => setLikesSheetOpen(true)}
            className="relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors text-muted-foreground flex-1"
          >
            <div className="relative">
              <Heart className="w-6 h-6" />
              <NotificationBadge count={unreadNotifications} />
            </div>
            <span className="text-xs font-medium">Notif</span>
          </button>

          <button
            onClick={() => navigate("/chats")}
            className="relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors text-muted-foreground flex-1"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-xs font-medium">Chat</span>
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
      <SettingsSheet
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
    </div>
  );
};

export default PartnerDashboard;
