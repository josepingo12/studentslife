import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Users, Home, MessageCircle, UserCircle, Plus } from "lucide-react";
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
      .select(`
        favorite_user_id,
        profiles!favorites_favorite_user_id_fkey(
          id,
          first_name,
          last_name,
          business_name,
          profile_image_url
        )
      `)
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
    // Get all conversations
    const { data: convData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!convData) return;

    const messagesMap = new Map();
    const unreadMap = new Map();

    for (const conv of convData) {
      // Get other participant
      const { data: otherParticipant } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.conversation_id)
        .neq("user_id", userId)
        .maybeSingle();

      if (!otherParticipant) continue;

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.conversation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        messagesMap.set(otherParticipant.user_id, lastMsg);
      }

      // Count unread
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.conversation_id)
        .eq("is_read", false)
        .neq("sender_id", userId);

      if (count && count > 0) {
        unreadMap.set(otherParticipant.user_id, count);
      }
    }

    setUserMessages(messagesMap);
    setUnreadCounts(unreadMap);
  };

  const handleUserClick = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (existingConv && existingConv.length > 0) {
        for (const conv of existingConv) {
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.conversation_id)
            .eq("user_id", otherUserId)
            .maybeSingle();

          if (otherParticipant) {
            navigate(`/chat/${conv.conversation_id}`);
            return;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: otherUserId },
        ]);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-24">
      {/* Header */}
      <div className="ios-card mx-4 mt-4 p-4">
        <h1 className="text-2xl font-bold text-primary mb-4">Chat</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Cerca utenti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 ios-input"
          />
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
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="text-center py-12 ios-card">
            <p className="text-muted-foreground">Nessun utente trovato</p>
          </div>
        ) : (
          sortedUsers.map((userItem) => (
            <UserListItem
              key={userItem.id}
              user={userItem}
              currentUserId={user?.id || ""}
              unreadCount={unreadCounts.get(userItem.id) || 0}
              lastMessage={userMessages.get(userItem.id)}
              isFavorite={favorites.some(f => f.id === userItem.id)}
              onUserClick={handleUserClick}
              onToggleFavorite={handleToggleFavorite}
            />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-between h-20 px-4 max-w-md mx-auto">
          <button
            onClick={() => navigate("/client-dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Social</span>
          </button>
          
          <button
            onClick={() => navigate("/client-dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Partner</span>
          </button>

          <button
            onClick={() => setUploadSheetOpen(true)}
            className="relative -mt-6 bg-gradient-to-br from-primary to-primary/80 rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-8 h-8 text-white" />
          </button>

          <button
            className="flex flex-col items-center gap-1 text-primary transition-colors relative"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <NotificationBadge count={totalUnread} />
            </div>
            <span className="text-xs font-medium">Chat</span>
          </button>
          
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors"
          >
            <UserCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Profilo</span>
          </button>
        </div>
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
