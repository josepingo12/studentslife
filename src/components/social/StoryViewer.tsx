import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const isOwnStory = storyGroup.user_id === currentUserId;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < storyGroup.stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            // Try to advance to next user's story, or close if none
            if (onNext) {
              onNext();
            } else {
              onClose();
            }
            return prev;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, storyGroup.stories.length, onClose, onNext]);

  useEffect(() => {
    const currentStory = storyGroup.stories[currentIndex];
    if (currentStory && !isOwnStory) {
      trackView(currentStory.id);
    }
    if (currentStory) {
      loadViewsCount(currentStory.id);
    }
  }, [currentIndex, isOwnStory]);

  const trackView = async (storyId: string) => {
    try {
      await supabase
        .from("story_views")
        .upsert(
          { story_id: storyId, viewer_id: currentUserId },
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

  const handleNext = () => {
    if (currentIndex < storyGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      // Try to advance to next user's story, or close if none
      if (onNext) {
        onNext();
      } else {
        onClose();
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const currentStory = storyGroup.stories[currentIndex];
  const displayName = storyGroup.profile?.first_name 
    ? `${storyGroup.profile.first_name} ${storyGroup.profile.last_name || ''}`
    : storyGroup.profile?.business_name || "Utente";

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2">
        {storyGroup.stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index === currentIndex ? `${progress}%` : index < currentIndex ? "100%" : "0%"
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary" />
          <span className="font-semibold">{displayName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isOwnStory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewersOpen(true)}
              className="text-white hover:bg-white/20 gap-2"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">{viewsCount}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Story image container - fixed size */}
      <div className="absolute inset-0 top-20 bottom-0">
        <div className="relative h-full w-full flex items-center justify-center">
          <img
            src={currentStory.image_url}
            alt="Story"
            className="h-full w-full object-contain"
          />
          
          {/* Navigation areas */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
            onClick={handleNext}
          />
        </div>
      </div>

      {/* Story Viewers Sheet */}
      {isOwnStory && (
        <StoryViewers
          storyId={currentStory.id}
          open={viewersOpen}
          onOpenChange={setViewersOpen}
        />
      )}
    </div>
  );
};

export default StoryViewer;
