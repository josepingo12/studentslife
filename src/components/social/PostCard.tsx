import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import CommentsSheet from "./CommentsSheet";
import ImageViewer from "./ImageViewer";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onDelete: (postId: string) => void;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

const PostCard = ({ post, currentUserId, onDelete, onLikeToggle }: PostCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadCommentsCount();
    checkIfSaved();
  }, [post.id]);

  const checkIfSaved = async () => {
    const { data } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
      .single();

    setIsSaved(!!data);
  };

  const loadCommentsCount = async () => {
    const { count } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setCommentsCount(count || 0);
  };
  
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

  const handleSaveToggle = async () => {
    setLoading(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
        setIsSaved(false);
        toast({
          title: "Post rimosso dai salvati",
        });
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) throw error;
        setIsSaved(true);
        toast({
          title: "Post salvato",
        });
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

  const displayName = post.profiles?.first_name 
    ? `${post.profiles.first_name} ${post.profiles.last_name || ''}`
    : post.profiles?.business_name || "Utente";

  return (
    <div className="ios-card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
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
        </button>
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
      {post.content && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div 
          className="cursor-pointer"
          onClick={() => setImageViewerOpen(true)}
        >
          <img 
            src={post.image_url} 
            alt="Post" 
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 border-t border-border flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {likesCount} {likesCount === 1 ? "like" : "likes"}
        </p>
        {commentsCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {commentsCount} {commentsCount === 1 ? "commento" : "commenti"}
          </p>
        )}
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
          onClick={() => setCommentsOpen(true)}
        >
          <MessageCircle className="w-5 h-5" />
          Commenta
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleSaveToggle}
          disabled={loading}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
          Salva
        </Button>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        open={commentsOpen}
        onOpenChange={(open) => {
          setCommentsOpen(open);
          if (!open) loadCommentsCount();
        }}
        postId={post.id}
        currentUserId={currentUserId}
      />

      {/* Image Viewer */}
      {post.image_url && (
        <ImageViewer
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
          imageUrl={post.image_url}
        />
      )}
    </div>
  );
};

export default PostCard;
