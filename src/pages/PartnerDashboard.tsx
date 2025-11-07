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
    <div className="min-h-screen bg-gray-50 pb-24">
      {activeTab === "social" ? (
        <div className="max-w-[470px] mx-auto w-full">
          {/* Header con Menu, Posizione, Avatar e Search Bar Integrata - AZZURRO E MODERNO */}
          <div className="mx-4 mt-4 mb-2 relative">
            <div className="bg-blue-500 rounded-3xl px-6 py-4 shadow-lg flex flex-col gap-3">
              {/* Top row: Menu, Location, Avatar */}
              <div className="flex items-center justify-between">
                {/* Menu hamburger a sinistra */}
                <button
                  onClick={() => setSettingsSheetOpen(true)}
                  className="flex flex-col gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="w-6 h-0.5 bg-white rounded-full"></div>
                  <div className="w-6 h-0.5 bg-white rounded-full"></div>
                  <div className="w-6 h-0.5 bg-white rounded-full"></div>
                </button>

                {/* Posizione al centro con icona */}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Valladolid</span>
                </div>

                {/* Avatar a destra */}
                <button
                  onClick={() => navigate("/profile")}
                  className="hover:scale-105 transition-transform"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-white/30">
                    <AvatarImage src={profile?.profile_image_url} />
                    <AvatarFallback className="bg-white text-blue-500 font-semibold">
                      {getDisplayName(profile)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>

              {/* Bottom row: Integrated Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 z-10" />
                <Input
                  type="text"
                  placeholder="Cerca utenti, luoghi, hashtag..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-full border-none bg-blue-50 text-blue-800 placeholder:text-blue-400 focus-visible:ring-0 text-base font-medium transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hover:bg-blue-100 rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4 text-blue-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results Dropdown - positioned relative to the parent header div */}
            {searchQuery && (
              <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 mt-0 bg-white rounded-2xl shadow-xl border border-blue-100 z-50 max-h-80 overflow-y-auto">
                {searching ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t('common.loading')}</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Nessun utente trovato</p>
                ) : (
                  <div className="py-3">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          navigate(`/profile/${result.id}`);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 transition-colors"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={result.profile_image_url} />
                          <AvatarFallback className="bg-blue-500 text-white">
                            {getDisplayName(result)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-gray-900">{getDisplayName(result)}</p>
                          {result.first_name && result.business_name && (
                            <p className="text-sm text-gray-500">{result.business_name}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          {/* Settings Icon */}
          <div className="px-4 mb-4 flex justify-end">
            <Button
              onClick={() => setSettingsSheetOpen(true)}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

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

      {/* Bottom Navigation - Reverted to original sections with modern styling */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-20 px-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
              activeTab === "social"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-blue-50"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.social')}</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
              activeTab === "events"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-blue-50"
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.events')}</span>
          </button>

          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
              activeTab === "scanner"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-blue-50"
            }`}
          >
            <QrCode className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.scanner')}</span>
          </button>

          {/* Central Upload Button */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 h-16 w-16 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-105 transition-all"
          >
            <Plus className="w-8 h-8" />
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
              activeTab === "stats"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-blue-50"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.stats')}</span>
          </button>

          <button
            onClick={() => setLikesSheetOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-full transition-colors text-gray-500 relative hover:bg-blue-50"
          >
            <div className="relative">
              <Heart className="w-6 h-6" />
              <NotificationBadge count={unreadNotifications} />
            </div>
            <span className="text-xs font-medium">Notifiche</span>
          </button>

          <button
            onClick={() => navigate("/chats")}
            className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors relative ${
              activeTab === "chats"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-blue-50"
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-xs font-medium">{t('navigation.chat')}</span>
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
