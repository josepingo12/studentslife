import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Send, Check, CheckCheck, Paperclip, Image as ImageIcon, Video, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

const ChatConversation = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
  }, [conversationId]);

  useEffect(() => {
    if (user && conversationId) {
      loadMessages();
      markMessagesAsRead();

      // Subscribe to new messages
      const messagesChannel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
            if (payload.new.sender_id !== user.id) {
              markMessagesAsRead();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
            );
          }
        )
        .subscribe();

      // Subscribe to typing indicators
      const typingChannel = supabase
        .channel(`typing:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const data = payload.new as any;
            if (data && data.user_id !== user.id && typeof data.is_typing === 'boolean') {
              setIsTyping(data.is_typing);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
      };
    }
  }, [user, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);
    
    // Load current user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, business_name, profile_image_url")
      .eq("id", user.id)
      .single();
    
    if (profile) {
      setUserProfile(profile);
    }
    
    await loadOtherUser(user.id);
  };

  const loadOtherUser = async (userId: string) => {
    // Get conversation to find the other user
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!conversation) return;

    // Determine other user ID
    const otherUserId = conversation.user1_id === userId 
      ? conversation.user2_id 
      : conversation.user1_id;

    if (!otherUserId) return;

    // Get other user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, business_name, profile_image_url")
      .eq("id", otherUserId)
      .single();

    if (profile) {
      setOtherUser(profile);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("is_read", false)
      .neq("sender_id", user.id);
  };

  const handleSendMessage = async (e: React.FormEvent, mediaUrl?: string, mediaType?: string) => {
    e.preventDefault();

    if ((!newMessage.trim() && !mediaUrl) || !user) return;

    try {
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim() || null,
      };

      if (mediaUrl) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }

      const { error } = await supabase.from("messages").insert(messageData);

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Stop typing indicator
      await updateTypingStatus(false);

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user || !conversationId) return;

    await supabase
      .from("typing_indicators")
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Update typing indicator
    updateTypingStatus(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  const handleMediaUpload = async (file: File, type: 'image' | 'video' | 'file') => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const bucket = type === 'image' || type === 'video' ? 'posts' : 'gallery';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      await handleSendMessage(new Event('submit') as any, publicUrl, type);
      setUploadSheetOpen(false);
      toast({ title: "File inviato" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getDisplayName = () => {
    if (otherUser?.first_name) {
      return `${otherUser.first_name} ${otherUser.last_name || ""}`.trim();
    }
    return otherUser?.business_name || "Utente";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary flex flex-col">
      {/* Header */}
      <div className="ios-card mx-4 mt-4 p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/chats")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser?.profile_image_url} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getDisplayName()[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{getDisplayName()}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message) => {
          const isOwn = message.sender_id === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {!isOwn && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={otherUser?.profile_image_url} />
                  <AvatarFallback className="bg-primary/10 text-xs">
                    {getDisplayName()[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                }`}
              >
                {message.media_url && (
                  <div className="mb-2">
                    {message.media_type === 'image' ? (
                      <img src={message.media_url} alt="Media" className="rounded-lg max-w-full" />
                    ) : message.media_type === 'video' ? (
                      <video src={message.media_url} controls className="rounded-lg max-w-full" />
                    ) : (
                      <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline break-all">
                        <File className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">File allegato</span>
                      </a>
                    )}
                  </div>
                )}
                {message.content && <p className="break-words overflow-wrap-anywhere whitespace-pre-wrap">{message.content}</p>}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-xs ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: false,
                      locale: it,
                    })}
                  </span>
                  {isOwn && (
                    message.is_read ? (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 opacity-70" />
                    )
                  )}
                </div>
              </div>
              
              {isOwn && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={userProfile?.profile_image_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userProfile?.first_name?.[0] || userProfile?.business_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={otherUser?.profile_image_url} />
              <AvatarFallback className="bg-primary/10 text-xs">
                {getDisplayName()[0]}
              </AvatarFallback>
            </Avatar>
            <div className="bg-card rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="ios-card mx-4 mb-4 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Sheet open={uploadSheetOpen} onOpenChange={setUploadSheetOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                <Paperclip className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>Allega file</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <label className="flex flex-col items-center gap-2 cursor-pointer p-4 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Immagine</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'image')}
                  />
                </label>

                <label className="flex flex-col items-center gap-2 cursor-pointer p-4 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Video className="w-6 h-6 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium">Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'video')}
                  />
                </label>

                <label className="flex flex-col items-center gap-2 cursor-pointer p-4 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <File className="w-6 h-6 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">File</span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'file')}
                  />
                </label>
              </div>
            </SheetContent>
          </Sheet>

          <Input
            placeholder="Scrivi un messaggio..."
            value={newMessage}
            onChange={handleInputChange}
            className="flex-1 ios-input"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim()}
            className="rounded-full flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatConversation;
