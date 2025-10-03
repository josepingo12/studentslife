import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import CommentsSheet from "./CommentsSheet";
import { toast } from "sonner";

interface PostDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: any;
  currentUserId: string;
}

const PostDetailModal = ({ open, onOpenChange, post, currentUserId }: PostDetailModalProps) => {
  const navigate = useNavigate();
  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(
    post?.likes?.some((like: any) => like.user_id === currentUserId) || false
  );
  const [commentsCount, setCommentsCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    if (open && post) {
      loadPostStats();
      trackView();
    }
  }, [open, post?.id]);

  const loadPostStats = async () => {
    if (!post?.id) return;

    // Load comments count
    const { count: commentsTotal } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setCommentsCount(commentsTotal || 0);

    // Load views count
    const { count: viewsTotal } = await supabase
      .from("post_views")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setViewsCount(viewsTotal || 0);
  };

  const trackView = async () => {
    if (!post?.id || !currentUserId) return;

    try {
      await supabase
        .from("post_views")
        .insert({
          post_id: post.id,
          viewer_id: currentUserId,
        });
      
      // Reload views count after tracking
      const { count: viewsTotal } = await supabase
        .from("post_views")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);
      setViewsCount(viewsTotal || 0);
    } catch (error) {
      // Ignore duplicate view errors
    }
  };

  const handleLike = async () => {
    if (!post?.id) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
        setLikesCount((prev) => prev - 1);
        setIsLiked(false);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) throw error;
        setLikesCount((prev) => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Errore nell'aggiornamento del mi piace");
    }
  };

  const getDisplayName = () => {
    if (post?.public_profiles?.business_name) {
      return post.public_profiles.business_name;
    }
    if (post?.public_profiles?.first_name || post?.public_profiles?.last_name) {
      return `${post.public_profiles.first_name || ""} ${post.public_profiles.last_name || ""}`.trim();
    }
    return "Utente";
  };

  if (!post) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 bg-background border-border flex flex-col md:flex-row">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 text-foreground hover:bg-muted rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Image Section */}
          <div className="flex-1 flex items-center justify-center bg-black/5 p-4">
            <img
              src={post.image_url}
              alt="Post"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Details Section */}
          <div className="w-full md:w-96 flex flex-col border-l border-border">
            {/* User Header */}
            <div className="p-4 border-b border-border">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                onClick={() => {
                  navigate(`/profile/${post.user_id}`);
                  onOpenChange(false);
                }}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.public_profiles?.profile_image_url} />
                  <AvatarFallback>
                    {getDisplayName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{getDisplayName()}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            {post.content && (
              <div className="p-4 border-b border-border">
                <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
              </div>
            )}

            {/* Stats */}
            <div className="p-4 border-b border-border flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{likesCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{commentsCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{viewsCount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={isLiked ? "text-red-500" : ""}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentsOpen(true)}
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={post?.id || ""}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default PostDetailModal;
