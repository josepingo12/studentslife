import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

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
  const getDisplayName = () => {
    if (user.first_name) {
      return `${user.first_name} ${user.last_name || ""}`.trim();
    }
    return user.business_name || "Utente";
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
                  locale: it,
                })}
              </span>
            )}
          </div>

          {lastMessage && (
            <div className="mt-1 overflow-hidden">
              <p className="text-sm text-muted-foreground truncate">
                {lastMessage.sender_id === currentUserId && "Tu: "}
                {lastMessage.content}
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