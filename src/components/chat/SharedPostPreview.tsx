import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Heart, MessageCircle, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SharedPostPreviewProps {
  postId: string;
  isOwn: boolean;
}

interface PostData {
  id: string;
  video_url?: string;
  image_url?: string;
  content?: string;
  user_id: string;
  created_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    business_name?: string;
    profile_image_url?: string;
  };
}

const SharedPostPreview = ({ postId, isOwn }: SharedPostPreviewProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [post, setPost] = useState<PostData | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      // Load post with profile
      const { data: postData } = await supabase
        .from("posts")
        .select(`
          id, video_url, image_url, content, user_id, created_at,
          profiles:user_id (first_name, last_name, business_name, profile_image_url)
        `)
        .eq("id", postId)
        .single();

      if (postData) {
        setPost({
          ...postData,
          profile: postData.profiles as any
        });
      }

      // Load counts
      const [likesRes, commentsRes, viewsRes] = await Promise.all([
        supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("post_id", postId),
        supabase.from("post_views").select("id", { count: "exact", head: true }).eq("post_id", postId)
      ]);

      setLikesCount(likesRes.count || 0);
      setCommentsCount(commentsRes.count || 0);
      setViewsCount(viewsRes.count || 0);
    } catch (error) {
      console.error("Error loading shared post:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate thumbnail from video for mobile compatibility
  const generateVideoThumbnail = (videoUrl: string) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('webkit-playsinline', 'true');
    
    video.onloadeddata = () => {
      // Wait a bit then seek to get a frame
      setTimeout(() => {
        video.currentTime = 0.5;
      }, 100);
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 200;
        canvas.height = video.videoHeight || 356;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          setVideoThumbnail(thumbnail);
        }
      } catch (e) {
        console.error('Error generating thumbnail:', e);
      }
      video.pause();
      video.src = '';
      video.load();
    };
    
    video.onerror = () => {
      console.error('Error loading video for thumbnail');
    };
    
    // For iOS - need to actually play briefly
    video.src = videoUrl;
    video.load();
    
    // Force play attempt for mobile (will be muted)
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        video.pause();
        video.currentTime = 0.5;
      }).catch(() => {
        // Autoplay was prevented, try just loading
        video.load();
      });
    }
  };

  useEffect(() => {
    if (post?.video_url && !videoThumbnail) {
      generateVideoThumbnail(post.video_url);
    }
  }, [post?.video_url]);

  const handleClick = async () => {
    // Record view when clicking
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("post_views").upsert({
        post_id: postId,
        viewer_id: user.id,
        viewed_at: new Date().toISOString()
      }, { onConflict: "post_id,viewer_id" });
    }
    
    // Navigate to the user's profile and open the video directly
    if (post) {
      navigate(`/profile/${post.user_id}?openPost=${postId}`);
    }
  };

  const getDisplayName = () => {
    if (post?.profile?.first_name) {
      return `${post.profile.first_name} ${post.profile.last_name || ""}`.trim();
    }
    return post?.profile?.business_name || t('common.user');
  };

  if (loading) {
    return (
      <div className={`rounded-xl overflow-hidden w-[200px] ${isOwn ? 'bg-primary-foreground/10' : 'bg-muted'}`}>
        <div className="aspect-[9/16] bg-muted animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={`rounded-xl p-4 ${isOwn ? 'bg-primary-foreground/10' : 'bg-muted'}`}>
        <p className="text-sm opacity-70">{t('social.postNotFound')}</p>
      </div>
    );
  }

  const mediaUrl = post.video_url || post.image_url;
  const isVideo = !!post.video_url;

  return (
    <div 
      className="rounded-xl overflow-hidden w-[200px] cursor-pointer transition-transform active:scale-95"
      onClick={handleClick}
    >
      {/* Media Preview */}
      <div className="relative aspect-[9/16] bg-black">
        {isVideo ? (
          <>
            {videoThumbnail ? (
              <img 
                src={videoThumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          </>
        ) : (
          <img 
            src={mediaUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Overlay with stats */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          {/* Author */}
          <p className="text-white text-xs font-medium mb-2 truncate">
            @{getDisplayName()}
          </p>
          
          {/* Stats Row */}
          <div className="flex items-center gap-3 text-white text-xs">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{viewsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>{likesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{commentsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedPostPreview;
