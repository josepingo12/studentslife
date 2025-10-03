import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onDelete: (postId: string) => void;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

const PostCard = ({ post, currentUserId, onDelete, onLikeToggle }: PostCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const isLiked = post.likes?.some((like: any) => like.user_id === currentUserId);
  const likesCount = post.likes?.length || 0;
  const isOwner = post.user_id === currentUserId;

  const handleLike = async () => {
    setLoading(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
        onLikeToggle(post.id, false);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) throw error;
        onLikeToggle(post.id, true);
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo post?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Post eliminato",
        description: "Il post è stato eliminato con successo",
      });

      onDelete(post.id);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayName = post.profiles?.first_name 
    ? `${post.profiles.first_name} ${post.profiles.last_name || ''}`
    : post.profiles?.business_name || "Utente";

  return (
    <div className="ios-card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.profiles?.profile_image_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: it })}
            </p>
          </div>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <img 
          src={post.image_url} 
          alt="Post" 
          className="w-full max-h-96 object-cover"
        />
      )}

      {/* Stats */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-around">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleLike}
          disabled={loading}
        >
          <Heart 
            className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
          />
          Mi piace
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled
        >
          <MessageCircle className="w-5 h-5" />
          Commenta
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled
        >
          <Share2 className="w-5 h-5" />
          Condividi
        </Button>
      </div>
    </div>
  );
};

export default PostCard;
