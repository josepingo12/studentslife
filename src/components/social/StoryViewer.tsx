import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StoryViewers from "./StoryViewers";

interface StoryViewerProps {
  storyGroup: {
    user_id: string;
    profile: any;
    stories: any[];
  };
  currentUserId: string;
  onClose: () => void;
  onNext?: () => void;
}

const StoryViewer = ({ storyGroup, currentUserId, onClose, onNext }: StoryViewerProps) => {
  const { toast } = useToast();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isViewersSheetOpen, setIsViewersSheetOpen] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = storyGroup.stories[currentStoryIndex];
  const STORY_DURATION = 5000; // 5 seconds per story
  const isOwnStory = storyGroup.user_id === currentUserId;

  // Detect if desktop
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Mark story as viewed and load views count
  useEffect(() => {
    if (currentStory) {
      if (!isOwnStory) {
        markStoryAsViewed(currentStory.id);
      }
      loadViewsCount(currentStory.id);
    }
  }, [currentStory, currentUserId, isOwnStory]);

  // Handle story progress and auto-advance
  useEffect(() => {
    if (isPaused || isViewersSheetOpen) {
      // Pause timers when paused or viewers sheet is open
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
      }
      return;
    }

    setProgress(0);
    
    // Progress bar animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / 100));
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    // Auto advance to next story
    storyTimeoutRef.current = setTimeout(() => {
      handleNextStory();
    }, STORY_DURATION);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
      }
    };
  }, [currentStoryIndex, isPaused, isViewersSheetOpen]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevStory();
          break;
        case 'ArrowRight':
          handleNextStory();
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused]);

  const markStoryAsViewed = async (storyId: string) => {
    try {
      await supabase
        .from("story_views")
        .upsert(
          { story_id: storyId, viewer_id: currentUserId, viewed_at: new Date().toISOString() },
          { onConflict: "story_id,viewer_id" }
        );
    } catch (error) {
      console.error("Error tracking story view:", error);
    }
  };

  const loadViewsCount = async (storyId: string) => {
    const { count } = await supabase
      .from("story_views")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId);
    
    setViewsCount(count || 0);
  };

  const handleNextStory = useCallback(() => {
    if (currentStoryIndex < storyGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      if (onNext) {
        onNext();
      } else {
        onClose();
      }
    }
  }, [currentStoryIndex, storyGroup.stories.length, onNext, onClose]);

  const handlePrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  }, [currentStoryIndex]);

  const handleViewersClick = () => {
    setIsViewersSheetOpen(true);
  };

  const handleMouseDown = (side: 'left' | 'right') => {
    if (side === 'left') {
      handlePrevStory();
    } else {
      handleNextStory();
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const displayName = storyGroup.profile?.first_name 
    ? `${storyGroup.profile.first_name} ${storyGroup.profile.last_name || ''}`.trim()
    : storyGroup.profile?.business_name || "Utente";

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Desktop Layout */}
      {isDesktop ? (
        <div className="relative w-full max-w-md h-full max-h-[90vh] bg-black rounded-lg overflow-hidden">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {storyGroup.stories.map((_: any, index: number) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-white">
                <AvatarImage src={storyGroup.profile?.profile_image_url} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs opacity-70">
                  {new Date(currentStory.created_at).toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseToggle}
                className="text-white hover:bg-white/20 p-2"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              {currentStory.media_type === 'video' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20 p-2"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full">
            {currentStory.media_type === 'image' || !currentStory.media_type ? (
              <img
                src={currentStory.image_url || currentStory.media_url}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentStory.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
              />
            )}

            {/* Click areas for navigation */}
            <div className="absolute inset-0 flex">
              <div 
                className="flex-1 cursor-pointer"
                onMouseDown={() => handleMouseDown('left')}
              />
              <div 
                className="flex-1 cursor-pointer"
                onMouseDown={() => handleMouseDown('right')}
              />
            </div>
          </div>

          {/* Navigation arrows */}
          {currentStoryIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevStory}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {(currentStoryIndex < storyGroup.stories.length - 1) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextStory}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Bottom actions */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            {isOwnStory && (
              <div className="flex justify-center mb-4">
                <Button
                  variant="ghost"
                  onClick={handleViewersClick}
                  className="text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{viewsCount} visualizzazioni</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mobile Layout */
        <div className="relative w-full h-full bg-black">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {storyGroup.stories.map((_: any, index: number) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-white">
                <AvatarImage src={storyGroup.profile?.profile_image_url} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs opacity-70">
                  {new Date(currentStory.created_at).toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwnStory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewersClick}
                  className="text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{viewsCount}</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full">
            {currentStory.media_type === 'image' || !currentStory.media_type ? (
              <img
                src={currentStory.image_url || currentStory.media_url}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentStory.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
              />
            )}

            {/* Click areas for navigation */}
            <div className="absolute inset-0 flex">
              <div 
                className="flex-1"
                onTouchStart={() => handleMouseDown('left')}
              />
              <div 
                className="flex-1"
                onTouchStart={() => handleMouseDown('right')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Story Viewers Sheet */}
      {isOwnStory && (
        <StoryViewers
          storyId={currentStory.id}
          open={isViewersSheetOpen}
          onOpenChange={setIsViewersSheetOpen}
        />
      )}
    </div>
  );
};

export default StoryViewer;
