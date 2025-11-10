import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWebNotifications } from "@/hooks/useWebNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Check, CheckCheck, Paperclip, MoreVertical, File } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import BlockUserButton from "@/components/moderation/BlockUserButton";
import ReportContentDialog from "@/components/moderation/ReportContentDialog";
import MediaUploadSheet from "@/components/chat/MediaUploadSheet";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import VoiceMessagePlayer from "@/components/chat/VoiceMessagePlayer";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

const ChatConversation = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Abilita notifiche web per questa conversazione
  useWebNotifications({ 
    userId: user?.id, 
    currentConversationId: conversationId 
  });

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

    setOtherUserId(otherUserId);

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
      const hasMedia = !!mediaUrl;
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        // content must be non-null per DB schema
        content: newMessage.trim() || (hasMedia ? "" : ""),
      };

      if (mediaUrl) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }

      const { error } = await supabase.from("messages").insert(messageData);

      if (error) throw error;

      // Notify admin about new message
      try {
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name, business_name")
          .eq("id", user.id)
          .single();

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        const senderName = senderProfile?.first_name || senderProfile?.business_name || "Usuario";
        const senderType = roleData?.role === "partner" ? "Socio" : "Cliente";
        const messagePreview = (newMessage.trim() || "Media inviato").substring(0, 100);

        await supabase.functions.invoke("notify-admin-message", {
          body: {
            sender_name: senderName,
            sender_type: senderType,
            message_preview: messagePreview,
          },
        });
      } catch (emailError) {
        // Don't block message sending if email fails
        console.error("Failed to send admin notification:", emailError);
      }

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
      toast({ title: "File inviato" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    if (!user) return;

    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      await handleSendMessage(new Event('submit') as any, publicUrl, 'audio');
      setVoiceRecorderOpen(false);
      toast({ title: "Messaggio vocale inviato" });
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {otherUserId && (
              <>
                <BlockUserButton
                  userId={otherUserId}
                  userName={getDisplayName()}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Blocca utente
                    </DropdownMenuItem>
                  }
                  onBlocked={() => navigate("/chats")}
                />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
              
              <div className="relative group max-w-[75%]">
                <div
                  className={`rounded-2xl px-4 py-2 ${
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
                    ) : message.media_type === 'audio' ? (
                      <VoiceMessagePlayer 
                        audioUrl={message.media_url} 
                        isOwn={isOwn}
                      />
                    ) : (
                      <a 
                        href={message.media_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`flex items-center gap-2 p-3 rounded-lg border ${isOwn ? 'bg-primary-foreground/10 border-primary-foreground/20' : 'bg-muted border-border'}`}
                      >
                        <File className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">File allegato</p>
                          <p className="text-xs opacity-70">Tocca per aprire</p>
                        </div>
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
                {!isOwn && (
                  <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ReportContentDialog
                      contentId={message.id}
                      contentType="message"
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    />
                  </div>
                )}
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
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="rounded-full flex-shrink-0"
            onClick={() => setUploadSheetOpen(true)}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Scrivi un messaggio..."
            className="flex-1 rounded-full"
            disabled={uploading}
          />

          <Button
            type="submit"
            size="icon"
            className="rounded-full flex-shrink-0"
            disabled={!newMessage.trim() || uploading}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>

      {/* Media Upload Sheet */}
      <MediaUploadSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        onMediaSelect={handleMediaUpload}
        onCameraCapture={(imageUrl) => {
          // Handle camera capture if needed
        }}
        onVoiceRecord={() => setVoiceRecorderOpen(true)}
        uploading={uploading}
      />

      {/* Voice Recorder */}
      {voiceRecorderOpen && (
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecording}
          onCancel={() => setVoiceRecorderOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatConversation;
