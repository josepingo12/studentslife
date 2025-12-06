import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Trash2, VolumeX, Volume2, Maximize, MoreVertical, Send } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import ReportContentDialog from "@/components/moderation/ReportContentDialog";
import BlockUserButton from "@/components/moderation/BlockUserButton";
import { formatDistanceToNow } from "date-fns";
import { it, enUS, es, fr, de } from "date-fns/locale";
import CommentsSheet from "./CommentsSheet";
import ImageViewer from "./ImageViewer";
import LikesSheet from "./LikesSheet";
import SharePostSheet from "./SharePostSheet";
import { useTranslation } from "react-i18next";
import VideoFeed from "./VideoFeed";
import HeartAnimation from "./HeartAnimation";

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
  const [sharesCount, setSharesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [videoFeedOpen, setVideoFeedOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Stati per la gestione del video
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    loadCommentsCount();
    loadSharesCount();
    checkIfSaved();
  }, [post.id]);

  const handleDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
      
      // Like the post if not already liked
      if (!isLiked && !loading) {
        try {
          const { error } = await supabase
            .from("likes")
            .insert({
              post_id: post.id,
              user_id: currentUserId,
            });

          if (!error) {
            onLikeToggle(post.id, true);
          }
        } catch (error) {
          console.error("Error liking post:", error);
        }
      }
    }
    lastTapRef.current = now;
  };

  // Logica per gestire il mute/unmute
  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Logica per gestire lo schermo intero
  const handleToggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      } else if ((videoRef.current as any).mozRequestFullScreen) {
        (videoRef.current as any).mozRequestFullScreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

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

  const loadSharesCount = async () => {
    const { count } = await supabase
      .from("post_shares")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setSharesCount(count || 0);
  };

  const handleShareComplete = async () => {
    // Reload shares count after sharing
    loadSharesCount();
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 max-w-[470px] mx-auto">
      {/* Header - More compact */}
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.public_profiles?.profile_image_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: getDateLocale() })}
            </p>
          </div>
        </button>
        {isOwner ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ReportContentDialog
                contentId={post.id}
                contentType="post"
                trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  {t('moderation.reportPost')}
                </DropdownMenuItem>
                }
              />
              <BlockUserButton
                userId={post.user_id}
                userName={displayName}
                trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  {t('moderation.blockUser')}
                </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content - More compact */}
      {post.content && (
        <div className="px-3 pb-2">
          <p className="whitespace-pre-wrap text-gray-800 text-sm">{post.content}</p>
        </div>
      )}

      {/* Media Content */}
      {(() => {
        const isVideoUrl = (url?: string) => !!url && /(\.mp4|\.webm|\.ogg)(\?.*)?$/i.test(url);

     if (post.media_type === 'video' && (post.video_url || post.image_url)) {
       const src = post.video_url || post.image_url;
       return (
         <div className="relative cursor-pointer" onClick={(e) => { handleDoubleTap(); }}>
           <video
             ref={videoRef}
             src={src}
             className="w-full max-h-96 object-cover"
             autoPlay
             loop
             muted={isMuted}
             playsInline
             preload="metadata"
           >
             Il tuo browser non supporta i video.
           </video>
           <HeartAnimation show={showHeartAnimation} />
           <div className="absolute bottom-3 right-3 flex gap-2">
             <Button
               variant="ghost"
               size="icon"
               className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-8 w-8"
               onClick={(e) => {
                 e.stopPropagation();
                 handleToggleMute();
               }}
             >
               {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
             </Button>
           </div>
         </div>
       );
     }

        if (post.media_type === 'image' && post.image_url) {
          return (
            <div
              className="relative cursor-pointer"
              onClick={handleDoubleTap}
            >
              <img
                src={post.image_url}
                alt="Post"
                className="w-full max-h-96 object-cover"
              />
              <HeartAnimation show={showHeartAnimation} />
            </div>
          );
        }

        if (post.image_url) {
          if (isVideoUrl(post.image_url)) {
            return (
              <div className="relative" onClick={handleDoubleTap}>
                <video
                  ref={videoRef}
                  src={post.image_url}
                  className="w-full max-h-96 object-cover"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                />
                <HeartAnimation show={showHeartAnimation} />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleToggleMute(); }}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleToggleFullscreen(); }}
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          }
          return (
            <div
              className="relative cursor-pointer"
              onClick={handleDoubleTap}
            >
              <img
                src={post.image_url}
                alt="Post"
                className="w-full max-h-96 object-cover"
              />
              <HeartAnimation show={showHeartAnimation} />
            </div>
          );
        }
        return null;
      })()}

      {/* Stats - Compact */}
      <div className="px-3 py-2 flex items-center gap-3 text-xs">
        <button
          onClick={() => setLikesSheetOpen(true)}
          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {likesCount} {t('profile.likes').toLowerCase()}
        </button>
        {commentsCount > 0 && (
          <span className="text-gray-500">
            {commentsCount} {t('post.comments').toLowerCase()}
          </span>
        )}
        {sharesCount > 0 && (
          <span className="text-gray-500">
            {sharesCount} {t('social.shares') || 'compartidos'}
          </span>
        )}
      </div>

      {/* Actions - Compact with Share button */}
      <div className="px-2 py-2 border-t border-gray-100 flex items-center justify-around">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full px-3 h-8 text-xs"
          onClick={handleLike}
          disabled={loading}
        >
          <Heart
            className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
          />
          {t('post.like')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full px-3 h-8 text-xs"
          onClick={() => setCommentsOpen(true)}
        >
          <MessageCircle className="w-4 h-4" />
          {t('post.comment')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-full px-3 h-8 text-xs"
          onClick={() => setShareSheetOpen(true)}
        >
          <Send className="w-4 h-4" />
          {t('social.share')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-600 hover:text-yellow-500 hover:bg-yellow-50 rounded-full px-3 h-8 text-xs"
          onClick={handleSaveToggle}
          disabled={loading}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-yellow-500 text-yellow-500" : ""}`} />
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

             {/* Video Feed */}
             <VideoFeed
               open={videoFeedOpen}
               onOpenChange={setVideoFeedOpen}
               initialPost={post}
               currentUserId={currentUserId}
               onLikeToggle={onLikeToggle}
             />

             {/* Share Sheet */}
             <SharePostSheet
               open={shareSheetOpen}
               onOpenChange={setShareSheetOpen}
               postId={post.id}
               currentUserId={currentUserId}
               onShareComplete={handleShareComplete}
             />
          </div>
        );
      };

export default PostCard;