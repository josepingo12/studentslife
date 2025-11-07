import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react"; // Added X icon
import FavoritesCarousel from "./FavoritesCarousel";
import UserListItem from "./UserListItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar imports

interface ChatsListProps {
  currentUserId: string;
}

const ChatsList = ({ currentUserId }: ChatsListProps) => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadAllUsers(currentUserId),
      loadFavorites(currentUserId),
      loadMessagesData(currentUserId),
    ]);
    setLoading(false);
  };

  const loadAllUsers = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, business_name, profile_image_url")
      .neq("id", userId);

    setAllUsers(data || []);
  };

  const loadFavorites = async (userId: string) => {
    const { data } = await supabase
      .from("favorites")
      .select(
        `
        id,
        favorite_user_id,
        public_profiles!favorites_favorite_user_id_fkey(
          id,
          first_name,
          last_name,
          business_name,
          profile_image_url
        )
        `
      )
      .eq("user_id", userId);

    if (data) {
      const formattedFavorites = data.map((fav: any) => ({
        id: fav.favorite_user_id,
        profile_image_url: fav.public_profiles?.profile_image_url,
        first_name: fav.public_profiles?.first_name,
        last_name: fav.public_profiles?.last_name,
        business_name: fav.public_profiles?.business_name,
      }));
      setFavorites(formattedFavorites);
    }
  };

  const loadMessagesData = async (userId: string) => {
    const { data: conversationsData } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!conversationsData || conversationsData.length === 0) {
      setMessages([]);
      return;
    }

    const conversationIds = conversationsData.map((c) => c.id);

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    const lastMessages: any[] = [];
    const unreadCountsMap: Record<string, number> = {};

    conversationsData.forEach((conv) => {
      const convMessages = messagesData?.filter(
        (m) => m.conversation_id === conv.id
      );
      if (convMessages && convMessages.length > 0) {
        const lastMessage = convMessages[0];
        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

        lastMessages.push({
          ...lastMessage,
          other_user_id: otherUserId,
        });

        const unreadCount = convMessages.filter(
          (m) => !m.is_read && m.sender_id !== userId
        ).length;
        unreadCountsMap[otherUserId] = unreadCount;
      }
    });

    setMessages(lastMessages);
    setUnreadCounts(unreadCountsMap);
  };

  const handleUserClick = async (otherUserId: string) => {
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`
      )
      .maybeSingle();

    if (existingConversation) {
      navigate(`/chat/${existingConversation.id}`);
    } else {
      const { data: newConversation } = await supabase
        .from("conversations")
        .insert({
          user1_id: currentUserId,
          user2_id: otherUserId,
        })
        .select()
        .single();

      if (newConversation) {
        navigate(`/chat/${newConversation.id}`);
      }
    }
  };

  const handleToggleFavorite = async (userId: string) => {
    const isFavorite = favorites.some((fav) => fav.id === userId);

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", currentUserId)
        .eq("favorite_user_id", userId);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: currentUserId, favorite_user_id: userId });
    }

    loadFavorites(currentUserId);
  };

  const filteredUsers = allUsers.filter((u) => {
    const displayName =
      u.first_name || u.business_name
        ? `${u.first_name || ""} ${u.last_name || ""} ${u.business_name || ""}`.toLowerCase()
        : "";
    return displayName.includes(searchQuery.toLowerCase());
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    const unreadA = unreadCounts[a.id] || 0;
    const unreadB = unreadCounts[b.id] || 0;

    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadA === 0 && unreadB > 0) return 1;

    const msgA = messages.find((m) => m.other_user_id === a.id);
    const msgB = messages.find((m) => m.other_user_id === b.id);

    if (msgA && !msgB) return -1;
    if (!msgA && msgB) return 1;
    if (msgA && msgB) {
      return new Date(msgB.created_at).getTime() - new Date(msgA.created_at).getTime();
    }

    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar - Updated to match modern iOS style */}
      <div className="px-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 z-10" />
          <Input
            type="text"
            placeholder="Cerca utenti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-full border-none bg-blue-50 text-blue-800 placeholder:text-blue-400 focus-visible:ring-0 text-base font-medium transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hover:bg-blue-100 rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4 text-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <FavoritesCarousel
          favorites={favorites}
          onFavoriteClick={handleUserClick}
          onRemoveFavorite={(id) => handleToggleFavorite(id)}
        />
      )}

      {/* Users List */}
      <div className="px-4">
        {sortedUsers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-600">Nessun utente trovato</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedUsers.map((user) => {
              const lastMsg = messages.find((m) => m.other_user_id === user.id);
              return (
                <UserListItem
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                  unreadCount={unreadCounts[user.id] || 0}
                  lastMessage={lastMsg}
                  isFavorite={favorites.some((fav) => fav.id === user.id)}
                  onUserClick={() => handleUserClick(user.id)}
                  onToggleFavorite={() => handleToggleFavorite(user.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsList;
