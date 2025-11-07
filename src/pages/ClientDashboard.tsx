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
import { MapPin } from "lucide-react";
import NotificationsSheet from "@/components/social/NotificationsSheet";
import { PushNotifications } from '@capacitor/push-notifications';

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
  const [fcmToken, setFcmToken] = useState<string | null>(null); // Stato per il token FCM

  // Abilita notifiche web
  useWebNotifications({ userId: user?.id });

  const markAllNotificationsAsRead = async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      console.log('Tutte le notifiche marcate come lette.');
    } catch (error) {
      console.error('Errore nel marcare le notifiche come lette:', error);
    }
  };

  // NUOVA LOGICA PER LE NOTIFICHE PUSH
  useEffect(() => {
    const initializePushNotifications = async () => {
      if (!user?.id) return; // Assicurati che l'utente sia loggato

      try {
        // 1. Richiedi i permessi per le notifiche
        let permStatus = await PushNotifications.requestPermissions();
        console.log(`Notifiche permessi: ${permStatus.receive}`);

        if (permStatus.receive === 'prompt' || permStatus.receive === 'denied') {
          console.warn('Permessi di notifica non concessi.');
          return;
        }

        // 2. Registra l'app per ricevere le notifiche
        await PushNotifications.register();

        // 3. Ottieni il token FCM
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token:', token.value);
          setFcmToken(token.value);
          // Salva il token FCM nel tuo database (Supabase)
          await saveFcmTokenToDatabase(user.id, token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration:', error);
        });

        // 4. Configura i listener per i messaggi in arrivo (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received (foreground):', notification);
          // Qui puoi aggiornare la UI della chat in tempo reale (se l'utente è nella chat)
          // o mostrare una notifica in-app personalizzata.
          // Il plugin mostrerà automaticamente una notifica di sistema se il payload include 'notification'.
        });

        // 5. Configura i listener per l'azione sulla notifica (utente clicca sulla notifica)
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push notification action performed', action);
          // 'action.notification.data' conterrà i dati inviati dal backend.
          const conversationId = action.notification.data?.conversationId;
          if (conversationId) {
            navigate(`/chat/${conversationId}`);
          }
        });

      } catch (error) {
        console.error('Errore nell\'inizializzazione delle notifiche push:', error);
      }
    };

    // Chiama la funzione di inizializzazione quando l'utente è disponibile
    if (user) {
      initializePushNotifications();
    }

    // Cleanup: rimuovi i listener quando il componente si smonta
    return () => {
      PushNotifications.removeAllListeners();
    };

  }, [user, navigate]); // Aggiungi 'user' e 'navigate' alle dipendenze dell'useEffect

  // Funzione per salvare il token FCM nel database (Supabase)
  const saveFcmTokenToDatabase = async (userId: string, token: string) => {
    try {
      const { error } = await supabase
        .from('user_fcm_tokens') // Assicurati che questa sia la tua tabella per i token FCM
        .upsert(
          { user_id: userId, fcm_token: token, platform: 'android' },
          { onConflict: ['user_id', 'platform'] } // Aggiorna se esiste già un token per questo utente/piattaforma
        );

      if (error) {
        console.error('Errore nel salvare il token FCM:', error);
      } else {
        console.log('Token FCM salvato/aggiornato nel database per utente:', userId);
      }
    } catch (error) {
      console.error('Errore durante l\'operazione di upsert del token FCM:', error);
    }
  };


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
              <p className="text-gray-600">
                {t('partner.category')}
              </p>
            </div>
          )}
        </>
      )}

      {/* Bottom Navigation - Updated with modern, rounded, light blue icons */}
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
            onClick={() => setActiveTab("partners")}
            className={`flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
              activeTab === "partners"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-blue-50"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t('navigation.partners')}</span>
          </button>

          {/* Central Upload Button - Now a large circular button with a Plus icon */}
          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 h-16 w-16 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-105 transition-all"
          >
            <Plus className="w-8 h-8" />
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
            onClick={() => setActiveTab("chats")}
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
        onMarkAsRead={markAllNotificationsAsRead}
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
          className="fixed bottom-24 right-6 h-16 w-16 rounded-2xl bg-blue-500 text-white shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40 border-2 border-white/20"
        >
          <Wallet className="w-7 h-7" />
        </button>
      )}
    </div>
  );
};

export default ClientDashboard;