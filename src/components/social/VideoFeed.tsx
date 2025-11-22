import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import VideoViewer from "./VideoViewer";

interface VideoFeedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPost: any;
  currentUserId: string;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

const VideoFeed = ({ open, onOpenChange, initialPost, currentUserId, onLikeToggle }: VideoFeedProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (open && initialPost) {
      loadVideoPosts();
    }
  }, [open, initialPost]);

  const loadVideoPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          public_profiles(*),
          likes(*)
        `)
        .eq("media_type", "video")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Trova l'indice del post iniziale
      const initialIndex = data.findIndex(post => post.id === initialPost.id);

      setPosts(data);
      setCurrentIndex(initialIndex >= 0 ? initialIndex : 0);
    } catch (error) {
      console.error("Error loading video posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
  const deltaY = startY.current - currentY.current;
  if (deltaY > 0 && currentIndex < posts.length - 1) {
  setCurrentIndex(prev => prev + 1);
  } else if (deltaY < 0 && currentIndex > 0) {
  setCurrentIndex(prev => prev - 1);
  }
  };
  const handleWheel = (e: React.WheelEvent) => {
  e.preventDefault();
  if (e.deltaY > 0 && currentIndex < posts.length - 1) {
  setCurrentIndex(prev => prev + 1);
  } else if (e.deltaY < 0 && currentIndex > 0) {
  setCurrentIndex(prev => prev - 1);
  }
  };
  if (!open || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Indicatore di posizione */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 rounded-full px-3 py-1">
        <span className="text-white text-sm">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      {/* Video corrente */}
      <VideoViewer
        open={true}
        onOpenChange={onOpenChange}
        post={currentPost}
        currentUserId={currentUserId}
        onLikeToggle={onLikeToggle}
      />

      {/* Indicatori di scroll */}
      {currentIndex > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div className="text-white/50 text-xs animate-bounce">↑ Scorri su</div>
        </div>
      )}

      {currentIndex < posts.length - 1 && (
        <div className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className="text-white/50 text-xs animate-bounce">↓ Scorri giù</div>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;