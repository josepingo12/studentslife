// File: ClientDashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWebNotifications } from "@/hooks/useWebNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, User, Home, Users, MessageCircle, UserCircle, Plus, Search, X, Heart, Wallet, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CategoryCarousel from "@/components/client/CategoryCarousel";
import PartnersList from "@/components/client/PartnersList";
import RecentPartners from "@/components/client/RecentPartners";
import PartnersMap from "@/components/client/PartnersMap";

import PostCard from "@/components/social/PostCard";
import UploadSheet from "@/components/shared/UploadSheet";
import NotificationBadge from "@/components/chat/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import ChatsList from "@/components/chat/ChatsList";
import NotificationsSheet from "@/components/social/NotificationsSheet";
import ClientSettingsSheet from "@/components/client/ClientSettingsSheet";
import WalletSheet from "@/components/client/WalletSheet";
import LoyaltyCardsSheet from "@/components/client/LoyaltyCardsSheet";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { useClientOnboarding } from "@/hooks/useClientOnboarding";
import ClientOnboarding from "@/components/client/ClientOnboarding";


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
  const [loyaltyCardsSheetOpen, setLoyaltyCardsSheetOpen] = useState(false);
  const totalUnread = useUnreadMessages(user?.id);
  const unreadNotifications = useUnreadNotifications(user?.id);
  const [userRole, setUserRole] = useState<string>();
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");
const [partnerSearchResults, setPartnerSearchResults] = useState<any[]>([]);
const [partnerSearching, setPartnerSearching] = useState(false);


  // Rimuovi questo stato, non è più necessario qui
  // const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Abilita notifiche web (se non è una piattaforma nativa)
  useWebNotifications({ userId: user?.id });

  // Client onboarding
  const {
    isOnboardingActive,
    getCurrentStep,
    getProgress,
    totalSteps,
    currentStep,
    nextStep,
    prevStep,
    skipCurrentStep,
    completeOnboarding,
    refreshCompletion,
    canProceed,
  } = useClientOnboarding(user?.id);

  const markAllNotificationsAsRead = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      console.log('Tutte le notifiche marcate come lette.');
    } catch (error) {
      console.error('Errore nel marcare le notifiche come lette:', error);
    }
  };

  // --- RIMUOVI COMPLETAMENTE QUALSIASI BLOCCO useEffect CHE INIZIALIZZA LE NOTIFICHE PUSH ---
  // --- E ANCHE LA FUNZIONE `saveFcmTokenToDatabase` SE PRESENTE QUI ---


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
      .select(
        `
        *,
        public_profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, business_name),
        likes(id, user_id)
        `
      )
      .eq("status", "approved")
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

const handlePartnerSearch = async (query: string) => {
  setPartnerSearchQuery(query);

  if (!query.trim()) {
    setPartnerSearchResults([]);
    setPartnerSearching(false);
    return;
  }

  setPartnerSearching(true);
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, business_name, profile_image_url")
    .not("business_name", "is", null) // Solo partner con business_name
    .or(`business_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(10);

  setPartnerSearchResults(data || []);
  setPartnerSearching(false);
};


  const getDisplayName = (profile: any) => {
    if (profile.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile.business_name || "Utente";
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Content based on active tab */}
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
                  data-onboarding="avatar"
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
                  placeholder={t('search.placeholder')}
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
                  <p className="text-sm text-gray-500 text-center py-8">{t('search.noUsersFound')}</p>
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
      ) : activeTab === "chats" ? (
        <div className="mt-4">
          <ChatsList currentUserId={user.id} />
        </div>
      ) : (
        <>
          {/* Epic Hero Section with animated gradient background */}
          <div className="relative overflow-hidden min-h-[520px]">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 animate-gradient-shift" />
            
            {/* Floating decorative circles */}
            <div className="absolute top-10 left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute top-32 right-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-20 left-10 w-24 h-24 bg-blue-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

            {/* Header with Wallet and Search */}
            <div className="relative z-20 px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Socios</h2>
                  <p className="text-cyan-100 text-sm font-medium">Descubre lugares increíbles</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLoyaltyCardsSheetOpen(true)}
                    className="flex flex-col items-center gap-1 text-white p-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-105 transition-all duration-300"
                    data-onboarding="loyalty-cards"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Tarjetas</span>
                  </button>
                  <button
                    onClick={() => setWalletSheetOpen(true)}
                    className="flex flex-col items-center gap-1 text-white p-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-105 transition-all duration-300"
                    data-onboarding="wallet"
                  >
                    <Wallet className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Wallet</span>
                  </button>
                </div>
              </div>

              {/* Search Bar with glass effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-2xl" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 z-10" />
                <Input
                  type="text"
                  placeholder="Busca restaurantes, tiendas, bares..."
                  value={partnerSearchQuery}
                  onChange={(e) => handlePartnerSearch(e.target.value)}
                  className="relative w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-white/30 bg-transparent text-white placeholder:text-white/60 focus-visible:ring-0 focus:border-white/50 focus:bg-white/10 text-base font-medium"
                />
                {partnerSearchQuery && (
                  <button
                    onClick={() => handlePartnerSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {partnerSearchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 mx-0 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 z-50 max-h-80 overflow-y-auto">
                  {partnerSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <p className="text-sm text-gray-500">Buscando socios...</p>
                    </div>
                  ) : partnerSearchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-cyan-500" />
                      </div>
                      <p className="text-sm text-gray-500">No se encontraron socios</p>
                    </div>
                  ) : (
                    <div className="py-3">
                      {partnerSearchResults.map((result, index) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            navigate(`/partner/${result.id}`);
                            setPartnerSearchQuery("");
                            setPartnerSearchResults([]);
                          }}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-cyan-50 transition-all duration-200"
                        >
                          <Avatar className="h-14 w-14 ring-2 ring-cyan-100">
                            <AvatarImage src={result.profile_image_url} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold">
                              {(result.business_name || result.first_name || "S")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1">
                            <p className="font-bold text-gray-900">{result.business_name || `${result.first_name} ${result.last_name || ""}`.trim()}</p>
                          </div>
                          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                            Ver
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category Grid - Glovo Style */}
            <div className="relative z-10 px-4 pt-2 pb-8">
              <CategoryCarousel onSelectCategory={setSelectedCategory} />
            </div>
            
            {/* Decorative curved wave at bottom */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 100" className="w-full h-16" preserveAspectRatio="none">
                <path
                  fill="#f9fafb"
                  d="M0,40L60,45C120,50,240,60,360,55C480,50,600,30,720,25C840,20,960,30,1080,40C1200,50,1320,60,1380,65L1440,70L1440,100L1380,100C1320,100,1200,100,1080,100C960,100,840,100,720,100C600,100,480,100,360,100C240,100,120,100,60,100L0,100Z"
                />
              </svg>
            </div>
          </div>

          {/* Content on white background */}
          <div className="bg-gray-50">
            {/* Recent Partners Section */}
            <div className="pt-4">
              <RecentPartners userId={user.id} />
            </div>

            {/* Partners List - shown when category selected */}
            {selectedCategory && (
              <div className="mt-6 px-4 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{t('navigation.partners')}</h3>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-cyan-600 font-semibold hover:text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full transition-colors"
                  >
                    {t('common.close')}
                  </button>
                </div>
                <PartnersList category={selectedCategory} />
              </div>
            )}

            {/* Partners Map Section */}
            <div className="mt-8 px-4 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('partner.mapTitle')}</h3>
              </div>
              <div className="rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-cyan-100/50 bg-white">
                <PartnersMap />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation - Glovo Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl">
        <div className="flex items-center justify-around h-20 px-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("social")}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
              activeTab === "social"
                ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-200/50 scale-105"
                : "text-gray-400 hover:text-cyan-600 hover:bg-cyan-50"
            }`}
            data-onboarding="social-tab"
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('navigation.social')}</span>
          </button>

          <button
            onClick={() => setActiveTab("partners")}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
              activeTab === "partners"
                ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-200/50 scale-105"
                : "text-gray-400 hover:text-cyan-600 hover:bg-cyan-50"
            }`}
            data-onboarding="partners-tab"
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t('navigation.partners')}</span>
          </button>

          {/* Central Upload Button - Glovo Style */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-8 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-xl shadow-cyan-300/50 flex items-center justify-center hover:shadow-2xl hover:scale-110 transition-all duration-300"
            data-onboarding="upload-button"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 blur-md opacity-50" />
            <Plus className="w-8 h-8 relative z-10" />
          </button>

          <button
            onClick={() => setLikesSheetOpen(true)}
            className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 text-gray-400 relative hover:text-cyan-600 hover:bg-cyan-50"
          >
            <div className="relative">
              <Heart className="w-6 h-6" />
              <NotificationBadge count={unreadNotifications} />
            </div>
            <span className="text-[10px] font-bold">Notifiche</span>
          </button>

          <button
            onClick={() => setActiveTab("chats")}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === "chats"
                ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-200/50 scale-105"
                : "text-gray-400 hover:text-cyan-600 hover:bg-cyan-50"
            }`}
            data-onboarding="chat-tab"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-[10px] font-bold">{t('navigation.chat')}</span>
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

      {/* Notifications Sheet (questo è il tuo LikesSheet) */}
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

      {/* Loyalty Cards Sheet */}
      <LoyaltyCardsSheet
        open={loyaltyCardsSheetOpen}
        onOpenChange={setLoyaltyCardsSheetOpen}
        clientId={user.id}
      />

      {/* Client Onboarding Tutorial */}
      {isOnboardingActive && (
        <ClientOnboarding
          currentStep={currentStep}
          totalSteps={totalSteps}
          step={getCurrentStep()}
          progress={getProgress()}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipCurrentStep}
          onComplete={completeOnboarding}
          onNavigateTab={(tab) => setActiveTab(tab as "social" | "partners" | "chats")}
          onNavigateToProfile={() => navigate(`/profile/${user?.id}`)}
          onOpenWallet={() => setWalletSheetOpen(true)}
          onOpenLoyaltyCards={() => setLoyaltyCardsSheetOpen(true)}
          canProceed={canProceed()}
          walletOpen={walletSheetOpen}
          loyaltyCardsOpen={loyaltyCardsSheetOpen}
        />
      )}
    </div>
  );
};

export default ClientDashboard;
