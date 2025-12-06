import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import VideoViewer from "./VideoViewer";
import { motion, AnimatePresence } from "framer-motion";

interface VideoFeedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPost: any;
  currentUserId: string;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

const SWIPE_THRESHOLD = 30; // Reduced for more sensitivity
const SWIPE_VELOCITY_THRESHOLD = 0.2; // Reduced for faster response

const VideoFeed = ({ open, onOpenChange, initialPost, currentUserId, onLikeToggle }: VideoFeedProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch tracking
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const touchCurrentY = useRef(0);
  const isSwiping = useRef(false);
  const swipeHandled = useRef(false);

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
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, posts.length, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, isTransitioning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't interfere with touches on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('input') || target.closest('textarea')) {
      isSwiping.current = false;
      return;
    }
    
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    touchCurrentY.current = e.touches[0].clientY;
    isSwiping.current = true;
    swipeHandled.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current || swipeHandled.current) return;
    
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchStartY.current - touchCurrentY.current;
    
    // Prevent scroll if we're swiping vertically
    if (Math.abs(deltaY) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current || swipeHandled.current) return;
    isSwiping.current = false;

    const deltaY = touchStartY.current - touchCurrentY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;

    // Check if swipe is strong enough (distance or velocity)
    if (Math.abs(deltaY) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      swipeHandled.current = true;
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
    
    if (e.deltaY > 30) {
      goToNext();
    } else if (e.deltaY < -30) {
      goToPrev();
    }
  };

  if (!open || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  // Animation variants for smooth transitions
  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[100] touch-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Position indicator */}
      <div 
        className="absolute right-4 z-[110] bg-black/50 rounded-full px-3 py-1" 
        style={{ top: 'calc(env(safe-area-inset-top, 16px) + 8px)' }}
      >
        <span className="text-white text-sm">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      {/* Current video with animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentPost.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            y: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0"
        >
          <VideoViewer
            open={true}
            onOpenChange={onOpenChange}
            post={currentPost}
            currentUserId={currentUserId}
            onLikeToggle={onLikeToggle}
          />
        </motion.div>
      </AnimatePresence>

      {/* Scroll indicators - subtle bars */}
      {currentIndex > 0 && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none z-[110]">
          <div className="w-8 h-1 bg-white/30 rounded-full" />
        </div>
      )}

      {currentIndex < posts.length - 1 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-none z-[110]">
          <div className="w-8 h-1 bg-white/30 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
