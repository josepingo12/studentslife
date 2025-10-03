import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentUserId: string;
}

const CommentsSheet = ({ open, onOpenChange, postId, currentUserId }: CommentsSheetProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadComments();
      subscribeToComments();
    }
  }, [open, postId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        public_profiles!comments_user_id_fkey(first_name, last_name, profile_image_url, business_name)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Commento pubblicato",
      });
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

  const getDisplayName = (profile: any) => {
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile?.business_name || "Utente";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Commenti ({comments.length})</SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 mt-6">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nessun commento ancora. Sii il primo a commentare!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={comment.public_profiles?.profile_image_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getDisplayName(comment.public_profiles)[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {getDisplayName(comment.public_profiles)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t pt-4 flex gap-2">
          <Textarea
            placeholder="Scrivi un commento..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 min-h-[50px] max-h-[100px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || loading}
            size="icon"
            className="h-[50px] w-[50px] rounded-full flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
