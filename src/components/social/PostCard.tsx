import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Trash2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { it, enUS, es, fr, de } from "date-fns/locale";
import CommentsSheet from "./CommentsSheet";
import ImageViewer from "./ImageViewer";
import LikesSheet from "./LikesSheet";
import { useTranslation } from "react-i18next";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onDelete: (postId: string) => void;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

const PostCard = ({ post, currentUserId, onDelete, onLikeToggle }: PostCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
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
      .limit(1)
      .maybeSingle();

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
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('post.delete') + "?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: t('success.postDeleted'),
        description: t('success.postDeleted'),
      });

      onDelete(post.id);
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
          title: t('success.postDeleted'),
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
          title: t('success.postCreated'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayName = post.public_profiles?.first_name
    ? `${post.public_profiles.first_name} ${post.public_profiles.last_name || ''}`.trim()
    : post.public_profiles?.business_name || t('common.user');

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'es': return es;
      case 'fr': return fr;
      case 'de': return de;
      default: return it;
    }
  };

  return (
    <div className="ios-card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.public_profiles?.profile_image_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: getDateLocale() })}
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

      {/* Media Content - SUPPORTO VIDEO E IMMAGINI */}
      {(() => {
        const isVideoUrl = (url?: string) => !!url && /(\.mp4|\.webm|\.ogg)(\?.*)?$/i.test(url);
        // Prefer explicit media_type
        if (post.media_type === 'video' && (post.video_url || post.image_url)) {
          const src = post.video_url || post.image_url; // fallback in case old data stored video under image_url
          return (
            <div className="relative">
              <video
                src={src}
                className="w-full max-h-96 object-cover rounded-none"
                controls
                preload="metadata"
              >
                Il tuo browser non supporta i video.
              </video>
            </div>
          );
        }
        if (post.media_type === 'image' && post.image_url) {
          return (
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
          );
        }
        // Fallback per post vecchi senza media_type
        if (post.image_url) {
          if (isVideoUrl(post.image_url)) {
            return (
              <div className="relative">
                <video
                  src={post.image_url}
                  className="w-full max-h-96 object-cover rounded-none"
                  controls
                  preload="metadata"
                />
              </div>
            );
          }
          return (
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
          );
        }
        return null;
      })()}


      {/* Stats */}
      <div className="px-4 py-2 border-t border-border flex items-center gap-4">
        <button
          onClick={() => setLikesSheetOpen(true)}
          className="text-sm font-semibold hover:text-primary transition-colors"
        >
          {likesCount} {t('profile.likes').toLowerCase()}
        </button>
        {commentsCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {commentsCount} {t('post.comments').toLowerCase()}
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
          {t('post.like')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setCommentsOpen(true)}
        >
          <MessageCircle className="w-5 h-5" />
          {t('post.comment')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleSaveToggle}
          disabled={loading}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
          {t('common.save')}
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

      {/* Image Viewer - Solo per immagini */}
      {(post.media_type === 'image' || !post.media_type) && post.image_url && (
        <ImageViewer
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
          imageUrl={post.image_url}
        />
      )}

      {/* Likes Sheet */}
      <LikesSheet
        open={likesSheetOpen}
        onOpenChange={setLikesSheetOpen}
        postId={post.id}
      />
    </div>
  );
};

export default PostCard;
