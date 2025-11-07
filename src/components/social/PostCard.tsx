import { useState, useEffect, useRef } from "react"; // Importa useRef
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Percorso corretto
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Trash2, VolumeX, Volume2, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { it, enUS, es, fr, de } from "date-fns/locale";
import CommentsSheet from "./CommentsSheet";
import ImageViewer from "./ImageViewer";
import LikesSheet from "./LikesSheet";
import { useTranslation } from "react-i18next";
import VideoFeed from "./VideoFeed";

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
  const [videoFeedOpen, setVideoFeedOpen] = useState(false);


  // Stati per la gestione del video
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    loadCommentsCount();
    checkIfSaved();
  }, [post.id]);

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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.public_profiles?.profile_image_url} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">
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
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap text-gray-800">{post.content}</p>
        </div>
      )}

      {/* Media Content */}
      {(() => {
        const isVideoUrl = (url?: string) => !!url && /(\.mp4|\.webm|\.ogg)(\?.*)?$/i.test(url);

     if (post.media_type === 'video' && (post.video_url || post.image_url)) {
       const src = post.video_url || post.image_url;
       return (
         <div className="relative cursor-pointer" onClick={() => setVideoFeedOpen(true)}>
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

        if (post.image_url) {
          if (isVideoUrl(post.image_url)) {
            return (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={post.image_url}
                  className="w-full max-h-96 object-cover"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  onClick={handleVideoClick}
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-8 w-8"
                    onClick={handleToggleMute}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full h-8 w-8"
                    onClick={handleToggleFullscreen}
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
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
      <div className="px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => setLikesSheetOpen(true)}
          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {likesCount} {t('profile.likes').toLowerCase()}
        </button>
        {commentsCount > 0 && (
          <p className="text-sm text-gray-500">
            {commentsCount} {t('post.comments').toLowerCase()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-around">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full px-4"
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
          className="gap-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full px-4"
          onClick={() => setCommentsOpen(true)}
        >
          <MessageCircle className="w-5 h-5" />
          {t('post.comment')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600 hover:text-yellow-500 hover:bg-yellow-50 rounded-full px-4"
          onClick={handleSaveToggle}
          disabled={loading}
        >
          <Bookmark className={`w-5 h-5 {isSaved ? "fill-yellow-500 text-yellow-500" : ""}`} />
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

             {/* Video Feed */}
             <VideoFeed
               open={videoFeedOpen}
               onOpenChange={setVideoFeedOpen}
               initialPost={post}
               currentUserId={currentUserId}
               onLikeToggle={onLikeToggle}
             />
          </div>
        );
      };

      export default PostCard;