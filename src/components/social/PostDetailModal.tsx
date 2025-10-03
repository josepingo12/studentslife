import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Eye, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import CommentsSheet from "./CommentsSheet";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

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
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && post) {
      loadPostStats();
      trackView();
    }
  }, [open, post?.id]);

  const loadPostStats = async () => {
    if (!post?.id) return;

    // Load comments with user info
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*, profiles!comments_user_id_fkey(first_name, last_name, profile_image_url, business_name)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false });

    setComments(commentsData || []);
    setCommentsCount(commentsData?.length || 0);

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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      await loadPostStats();
      toast.success("Commento pubblicato");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Errore durante la pubblicazione del commento");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (profile?: any) => {
    const prof = profile || post?.public_profiles;
    if (prof?.business_name) {
      return prof.business_name;
    }
    if (prof?.first_name || prof?.last_name) {
      return `${prof.first_name || ""} ${prof.last_name || ""}`.trim();
    }
    return "Utente";
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden animate-scale-in">
        <div className="flex h-full w-full">
          {/* Image Section - Left Side */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/10 rounded-full backdrop-blur-sm transition-all hover:scale-110"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            
            <img
              src={post.image_url}
              alt="Post"
              className="max-w-full max-h-full object-contain animate-fade-in"
            />
          </div>

          {/* Details Section - Right Side */}
          <div className="w-full md:w-[420px] flex flex-col bg-background border-l border-border/50">
            {/* Header with User Info */}
            <div className="p-4 border-b border-border">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                  navigate(`/profile/${post.user_id}`);
                  onOpenChange(false);
                }}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.public_profiles?.profile_image_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: it,
                    })}
                  </p>
                </div>
              </div>

              {post.content && (
                <p className="mt-3 text-sm text-foreground leading-relaxed">
                  {post.content}
                </p>
              )}
            </div>

            {/* Stats Bar */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{likesCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{commentsCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{viewsCount}</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nessun commento ancora</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 animate-fade-in">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profiles?.profile_image_url} />
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {getDisplayName(comment.profiles).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <p className="text-sm font-semibold text-foreground">
                            {getDisplayName(comment.profiles)}
                          </p>
                          <p className="text-sm text-foreground leading-relaxed break-words">
                            {comment.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: it,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Action Bar */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2 mb-3">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className="flex-1 gap-2"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Ti piace" : "Mi piace"}
                </Button>
              </div>

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Scrivi un commento..."
                  className="min-h-[40px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  size="icon"
                  className="h-10 w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostDetailModal;
