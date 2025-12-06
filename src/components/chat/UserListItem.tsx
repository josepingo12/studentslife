import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it, es, enUS, fr, de } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface UserListItemProps {
  user: any;
  currentUserId: string;
  unreadCount: number;
  lastMessage?: any;
  isFavorite: boolean;
  onUserClick: (userId: string) => void;
  onToggleFavorite: (userId: string) => void;
}

const UserListItem = ({
  user,
  currentUserId,
  unreadCount,
  lastMessage,
  isFavorite,
  onUserClick,
  onToggleFavorite,
}: UserListItemProps) => {
  const { t, i18n } = useTranslation();
  const [sharedPostAuthor, setSharedPostAuthor] = useState<string | null>(null);

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'es': return es;
      case 'fr': return fr;
      case 'de': return de;
      default: return it;
    }
  };

  const getDisplayName = () => {
    if (user.first_name) {
      return `${user.first_name} ${user.last_name || ""}`.trim();
    }
    return user.business_name || t('common.user');
  };

  // Check if message is a shared post and load author name
  useEffect(() => {
    const loadSharedPostAuthor = async () => {
      if (!lastMessage?.content) return;
      
      const match = lastMessage.content.match(/\[shared_post:([a-f0-9-]+)\]/);
      if (match) {
        const postId = match[1];
        const { data: post } = await supabase
          .from("posts")
          .select("user_id, profiles:user_id(first_name, last_name, business_name)")
          .eq("id", postId)
          .single();
        
        if (post?.profiles) {
          const profile = post.profiles as any;
          const name = profile.first_name 
            ? `${profile.first_name} ${profile.last_name || ""}`.trim()
            : profile.business_name || t('common.user');
          setSharedPostAuthor(name);
        }
      } else {
        setSharedPostAuthor(null);
      }
    };

    loadSharedPostAuthor();
  }, [lastMessage?.content, t]);

  const getMessagePreview = () => {
    if (!lastMessage?.content) return null;
    
    // Check if it's a shared post
    const match = lastMessage.content.match(/\[shared_post:([a-f0-9-]+)\]/);
    if (match && sharedPostAuthor) {
      const prefix = lastMessage.sender_id === currentUserId ? `${t('common.you')}: ` : "";
      return `${prefix}🎬 ${t('chat.sharedVideoFrom')} @${sharedPostAuthor}`;
    }
    
    // Check for media types
    if (lastMessage.media_type === 'audio') {
      const prefix = lastMessage.sender_id === currentUserId ? `${t('common.you')}: ` : "";
      return `${prefix}🎤 ${t('chat.voiceMessage')}`;
    }
    
    if (lastMessage.media_type === 'image') {
      const prefix = lastMessage.sender_id === currentUserId ? `${t('common.you')}: ` : "";
      return `${prefix}📷 ${t('chat.photo')}`;
    }
    
    if (lastMessage.media_type === 'video') {
      const prefix = lastMessage.sender_id === currentUserId ? `${t('common.you')}: ` : "";
      return `${prefix}🎥 ${t('chat.video')}`;
    }
    
    if (lastMessage.media_type === 'file') {
      const prefix = lastMessage.sender_id === currentUserId ? `${t('common.you')}: ` : "";
      return `${prefix}📎 ${t('chat.file')}`;
    }
    
    // Regular text message
    const prefix = lastMessage.sender_id === currentUserId ? `${t('common.you')}: ` : "";
    return `${prefix}${lastMessage.content}`;
  };

 return (
 <div className="ios-card p-4 flex items-center gap-3 cursor-pointer w-full overflow-hidden">
 <div onClick={() => onUserClick(user.id)} className="flex items-center gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 <Avatar className="h-14 w-14">
 <AvatarImage src={user.profile_image_url} />
 <AvatarFallback className="bg-primary text-primary-foreground">
 {getDisplayName()[0]}
            </AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold truncate flex-1">{getDisplayName()}</p>
            {lastMessage && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(lastMessage.created_at), {
                  addSuffix: false,
                  locale: getDateLocale(),
                })}
              </span>
            )}
          </div>

          {lastMessage && (
            <div className="mt-1 overflow-hidden">
              <p className="text-sm text-muted-foreground truncate">
                {getMessagePreview()}
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(user.id);
        }}
        className="p-2 flex-shrink-0"
      >
        <Star 
          className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      </button>
    </div>
  );
};

export default UserListItem;