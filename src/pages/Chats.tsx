import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

const Chats = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    loadConversations(user.id);
  };

  const loadConversations = async (userId: string) => {
    setLoading(true);

    // Get conversations where user is participant
    const { data: convData } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        conversations!inner(
          id,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId);

    if (!convData) {
      setLoading(false);
      return;
    }

    // For each conversation, get the other participant and last message
    const conversationsWithDetails = await Promise.all(
      convData.map(async (conv) => {
        const convId = conv.conversations.id;

        // Get other participant
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select(`
            user_id,
            profiles!conversation_participants_user_id_fkey(
              first_name,
              last_name,
              business_name,
              profile_image_url
            )
          `)
          .eq("conversation_id", convId)
          .neq("user_id", userId)
          .single();

        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Count unread messages
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convId)
          .eq("is_read", false)
          .neq("sender_id", userId);

        return {
          id: convId,
          otherUser: otherParticipant?.profiles,
          otherUserId: otherParticipant?.user_id,
          lastMessage: lastMessage,
          unreadCount: unreadCount || 0,
          updatedAt: conv.conversations.updated_at,
        };
      })
    );

    // Sort by last update
    conversationsWithDetails.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    setConversations(conversationsWithDetails);
    setLoading(false);
  };

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.otherUser?.first_name || conv.otherUser?.business_name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getDisplayName = (otherUser: any) => {
    if (otherUser?.first_name) {
      return `${otherUser.first_name} ${otherUser.last_name || ""}`.trim();
    }
    return otherUser?.business_name || "Utente";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary pb-24">
      {/* Header */}
      <div className="ios-card mx-4 mt-4 p-4">
        <h1 className="text-2xl font-bold text-primary mb-4">Chat</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Cerca chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 ios-input"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="mt-4 mx-4 space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 ios-card">
            <p className="text-muted-foreground">
              {searchQuery ? "Nessuna chat trovata" : "Nessuna chat ancora. Inizia a chattare!"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="ios-card p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <Avatar className="h-14 w-14">
                <AvatarImage src={conv.otherUser?.profile_image_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getDisplayName(conv.otherUser)[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{getDisplayName(conv.otherUser)}</p>
                  {conv.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.lastMessage.created_at), {
                        addSuffix: false,
                        locale: it,
                      })}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage?.sender_id === user?.id && "Tu: "}
                    {conv.lastMessage?.content || "Nessun messaggio"}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-2">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Chats;
