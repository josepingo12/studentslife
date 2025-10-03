import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryViewerProps {
  storyGroup: {
    user_id: string;
    profile: any;
    stories: any[];
  };
  onClose: () => void;
}

const StoryViewer = ({ storyGroup, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < storyGroup.stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return prev;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, storyGroup.stories.length, onClose]);

  const handleNext = () => {
    if (currentIndex < storyGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Story image */}
      <div className="relative h-full flex items-center justify-center">
        <img
          src={currentStory.image_url}
          alt="Story"
          className="max-h-full max-w-full object-contain"
        />
        
        {/* Navigation areas */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={handleNext}
        />
      </div>
    </div>
  );
};

export default StoryViewer;
