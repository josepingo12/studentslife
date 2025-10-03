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
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden animate-scale-in">
        <div className="flex flex-col md:flex-row h-full w-full">
          {/* Image Section - Top on mobile, Left on desktop */}
          <div className="flex-1 bg-black relative flex items-center justify-center min-h-[50vh] md:min-h-full">
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
              className="w-full h-full object-contain animate-fade-in p-2"
            />
          </div>

          {/* Details Section - Bottom on mobile, Right on desktop */}
          <div className="w-full md:w-[420px] flex flex-col bg-background/95 backdrop-blur-xl md:border-l border-t md:border-t-0 border-border/50">
            {/* Header with User Info */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-b from-background to-transparent">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                  navigate(`/profile/${post.user_id}`);
                  onOpenChange(false);
                }}
              >
                <Avatar className="w-12 h-12 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <AvatarImage src={post.public_profiles?.profile_image_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
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
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                  {post.content}
                </p>
              )}
            </div>

            {/* Stats Bar */}
            <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-sm font-medium">{likesCount}</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">{commentsCount}</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <Eye className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">{viewsCount}</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nessun commento ancora</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Sii il primo a commentare!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 animate-fade-in group">
                      <Avatar className="w-9 h-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={comment.profiles?.profile_image_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-xs">
                          {getDisplayName(comment.profiles).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/50 rounded-2xl px-4 py-2.5 group-hover:bg-muted/70 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground">
                              {getDisplayName(comment.profiles)}
                            </p>
                            <span className="text-xs text-muted-foreground">·</span>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: it,
                              })}
                            </p>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed break-words">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Action Bar */}
            <div className="p-4 border-t border-border/50 bg-gradient-to-t from-background to-transparent">
              <div className="flex gap-2 mb-3">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className={`flex-1 gap-2 transition-all ${
                    isLiked 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                  }`}
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
                  className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-muted/50 border-muted"
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
                  className="h-11 w-11 rounded-full bg-primary hover:scale-105 transition-transform"
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
