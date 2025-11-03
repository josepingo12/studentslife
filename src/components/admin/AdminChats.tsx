import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserListItem from "@/components/chat/UserListItem";

const AdminChats = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<Map<string, any>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);
      await Promise.all([
        loadAllUsers(user.id),
        loadMessagesData(user.id)
      ]);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadAllUsers = async (currentUserId: string) => {
    setLoading(true);
    
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId);

    setAllUsers(usersData || []);
    setLoading(false);
  };

  const loadMessagesData = async (userId: string) => {
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!convData) return;

    const messagesMap = new Map();
    const unreadMap = new Map();

    for (const conv of convData) {
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
      if (!otherUserId) continue;

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
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConv) {
        navigate(`/chat/${existingConv.id}`);
        return;
      }

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
      toast({ 
        title: "Errore", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const name = u.first_name || u.business_name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
    <div className="max-w-4xl mx-auto">
      <div className="ios-card p-6 mb-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Chat Amministratore</h2>
        
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

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12">
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
              isFavorite={false}
              onUserClick={handleUserClick}
              onToggleFavorite={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminChats;
