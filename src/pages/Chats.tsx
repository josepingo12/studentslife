import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWebNotifications } from "@/hooks/useWebNotifications";
import { Input } from "@/components/ui/input";
import { Search, Users, Home, MessageCircle, UserCircle, Plus, ArrowLeft, X } from "lucide-react"; // Added X for clear button
import { useToast } from "@/hooks/use-toast";
import FavoritesCarousel from "@/components/chat/FavoritesCarousel";
import UserListItem from "@/components/chat/UserListItem";
import UploadSheet from "@/components/shared/UploadSheet";
import NotificationBadge from "@/components/chat/NotificationBadge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const Chats = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<Map<string, any>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const totalUnread = useUnreadMessages(user?.id);

  // Abilita notifiche web
  useWebNotifications({ userId: user?.id });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);
    await Promise.all([
      loadAllUsers(user.id),
      loadFavorites(user.id),
      loadMessagesData(user.id)
    ]);
  };

  const loadAllUsers = async (currentUserId: string) => {
    setLoading(true);

    // Get all users except current user
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId);

    setAllUsers(usersData || []);
    setLoading(false);
  };

  const loadFavorites = async (userId: string) => {
    const { data: favData } = await supabase
      .from("favorites")
      .select(
        `
        favorite_user_id,
        profiles!favorites_favorite_user_id_fkey(
          id,
          first_name,
          last_name,
          business_name,
          profile_image_url
        )
        `
      )
      .eq("user_id", userId);

    if (favData) {
      const validFavorites = favData
        .filter(f => f.profiles)
        .map(f => {
          const profile = f.profiles as any;
          return {
            id: f.favorite_user_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            business_name: profile.business_name,
            profile_image_url: profile.profile_image_url
          };
        });
      setFavorites(validFavorites);
    }
  };

  const loadMessagesData = async (userId: string) => {
    // Get all conversations where user is participant
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!convData) return;

    const messagesMap = new Map();
    const unreadMap = new Map();

    for (const conv of convData) {
      // Determine other user ID
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

      if (!otherUserId) continue;

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        messagesMap.set(otherUserId, lastMsg);
      }

      // Count unread
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("is_read", false)
        .neq("sender_id", userId);

      if (count && count > 0) {
        unreadMap.set(otherUserId, count);
      }
    }

    setUserMessages(messagesMap);
    setUnreadCounts(unreadMap);
  };

  const handleUserClick = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Check if conversation exists with this user
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConv) {
        navigate(`/chat/${existingConv.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          user1_id: user.id,
          user2_id: otherUserId
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${newConv.id}`);
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleFavorite = async (userId: string) => {
    if (!user) return;

    const isFav = favorites.some(f => f.id === userId);

    try {
      if (isFav) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("favorite_user_id", userId);

        setFavorites(favorites.filter(f => f.id !== userId));
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, favorite_user_id: userId });

        const userToAdd = allUsers.find(u => u.id === userId);
        if (userToAdd) {
          setFavorites([...favorites, userToAdd]);
        }
      }
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const name = u.first_name || u.business_name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort: unread first, then by last message
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aUnread = unreadCounts.get(a.id) || 0;
    const bUnread = unreadCounts.get(b.id) || 0;

    if (aUnread !== bUnread) {
      return bUnread - aUnread;
    }

    const aMsg = userMessages.get(a.id);
    const bMsg = userMessages.get(b.id);

    if (!aMsg && !bMsg) return 0;
    if (!aMsg) return 1;
    if (!bMsg) return -1;

    return new Date(bMsg.created_at).getTime() - new Date(aMsg.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with back arrow and title */}
      <div className="bg-white rounded-b-3xl shadow-sm border-b border-gray-100 px-4 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => navigate("/client-dashboard")} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1 text-center">Chat</h1>
        <div className="w-10"></div> {/* Spacer to balance the layout */}
      </div>

      {/* Search Bar - Updated styling */}
      <div className="px-4 mt-4">
        <div className="relative w-full bg-white rounded-full shadow-sm border border-blue-100">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 z-10" />
          <Input
            type="text"
            placeholder="Cerca utenti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-full border-none bg-transparent text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 text-base font-medium transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Favorites Carousel */}
      {!searchQuery && (
        <div className="mt-4">
          <FavoritesCarousel
            favorites={favorites}
            onFavoriteClick={handleUserClick}
            onRemoveFavorite={handleToggleFavorite}
          />
        </div>
      )}

      {/* Users List */}
      <div className="mt-4 mx-4 space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-600">Nessun utente trovato</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedUsers.map((userItem) => {
              const lastMsg = userMessages.get(userItem.id);
              return (
                <UserListItem
                  key={userItem.id}
                  user={userItem}
                  currentUserId={user?.id || ""}
                  unreadCount={unreadCounts.get(userItem.id) || 0}
                  lastMessage={lastMsg}
                  isFavorite={favorites.some(f => f.id === userItem.id)}
                  onUserClick={handleUserClick}
                  onToggleFavorite={handleToggleFavorite}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Sheet */}
      <UploadSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        userId={user?.id || ""}
        onUploadComplete={() => {}}
      />
    </div>
  );
};

export default Chats;
