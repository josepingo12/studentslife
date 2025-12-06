import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import VideoViewer from "./VideoViewer";

interface VideoFeedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPost: any;
  currentUserId: string;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity for a swipe

const VideoFeed = ({ open, onOpenChange, initialPost, currentUserId, onLikeToggle }: VideoFeedProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch tracking
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const touchCurrentY = useRef(0);
  const isTouching = useRef(false);

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
        .limit(50);

      if (error) throw error;

      // Find initial post index
      const initialIndex = data.findIndex(post => post.id === initialPost.id);

      setPosts(data);
      setCurrentIndex(initialIndex >= 0 ? initialIndex : 0);
    } catch (error) {
      console.error("Error loading video posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex < posts.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex, posts.length, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [currentIndex, isTransitioning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    touchCurrentY.current = e.touches[0].clientY;
    isTouching.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouching.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    // Prevent default to stop scroll interference
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isTouching.current) return;
    isTouching.current = false;

    const deltaY = touchStartY.current - touchCurrentY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;

    // Check if swipe is strong enough (distance or velocity)
    if (Math.abs(deltaY) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      if (deltaY > 0) {
        // Swipe up - go to next
        goToNext();
      } else {
        // Swipe down - go to previous
        goToPrev();
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isTransitioning) return;
    
    if (e.deltaY > 0) {
      goToNext();
    } else if (e.deltaY < 0) {
      goToPrev();
    }
  };

  if (!open || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[100] touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Position indicator */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 rounded-full px-3 py-1" style={{ top: 'calc(env(safe-area-inset-top, 16px) + 8px)' }}>
        <span className="text-white text-sm">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      {/* Current video */}
      <VideoViewer
        open={true}
        onOpenChange={onOpenChange}
        post={currentPost}
        currentUserId={currentUserId}
        onLikeToggle={onLikeToggle}
      />

      {/* Scroll indicators */}
      {currentIndex > 0 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="text-white/40 text-xs flex flex-col items-center gap-1">
            <div className="w-6 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      )}

      {currentIndex < posts.length - 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="text-white/40 text-xs flex flex-col items-center gap-1">
            <div className="w-6 h-1 bg-white/30 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
