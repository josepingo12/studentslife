import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface LikesNotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const LikesNotificationsSheet = ({ open, onOpenChange, userId }: LikesNotificationsSheetProps) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadLikes();
    }
  }, [open, userId]);

  const loadLikes = async () => {
    setLoading(true);
    try {
      // Get all posts by the user
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", userId);

      if (!userPosts || userPosts.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      const postIds = userPosts.map(p => p.id);

      // Get all likes for those posts
      const { data: likesData, error } = await supabase
        .from("likes")
        .select(`
          id,
          user_id,
          created_at,
          post_id,
          posts:post_id (
            image_url,
            video_url,
            content
          ),
          profiles:user_id (
            id,
            first_name,
            last_name,
            business_name,
            profile_image_url
          )
        `)
        .in("post_id", postIds)
        .neq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setLikes(likesData || []);
    } catch (error) {
      console.error("Error loading likes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (profile: any) => {
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile?.business_name || "Utente";
  };

  const handleProfileClick = (profileUserId: string) => {
    onOpenChange(false);
    navigate(`/profile/${profileUserId}`);
  };

  const handlePostClick = (postId: string) => {
    onOpenChange(false);
    // You can navigate to post detail if needed
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 justify-center">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <span className="text-lg font-bold">Notifiche</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(70vh-80px)] mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Nessuna notifica ancora</p>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {likes.map((like) => (
                <div
                  key={like.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    onClick={() => handleProfileClick(like.user_id)}
                    className="cursor-pointer"
                  >
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={like.profiles?.profile_image_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getDisplayName(like.profiles)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span 
                        className="font-semibold cursor-pointer hover:underline"
                        onClick={() => handleProfileClick(like.user_id)}
                      >
                        {getDisplayName(like.profiles)}
                      </span>
                      <span className="text-muted-foreground"> ha messo mi piace al tuo post</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(like.created_at), { addSuffix: true, locale: it })}
                    </p>
                  </div>
                  {like.posts?.image_url && (
                    <div 
                      onClick={() => handlePostClick(like.post_id)}
                      className="cursor-pointer"
                    >
                      <img
                        src={like.posts.image_url}
                        alt="Post"
                        className="w-12 h-12 rounded object-cover"
                      />
                    </div>
                  )}
                  {like.posts?.video_url && !like.posts?.image_url && (
                    <div 
                      onClick={() => handlePostClick(like.post_id)}
                      className="cursor-pointer"
                    >
                      <video
                        src={like.posts.video_url}
                        className="w-12 h-12 rounded object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default LikesNotificationsSheet;
