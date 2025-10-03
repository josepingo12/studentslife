import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StoryViewer from "./StoryViewer";
import CreateStoryDialog from "./CreateStoryDialog";

interface StoriesCarouselProps {
  currentUserId: string;
}

const StoriesCarousel = ({ currentUserId }: StoriesCarouselProps) => {
  const { toast } = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const { data } = await supabase
      .from("stories")
      .select(`
        *,
        profiles(first_name, last_name, profile_image_url, business_name)
      `)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Group stories by user
    const groupedStories: any = {};
    data?.forEach((story) => {
      if (!groupedStories[story.user_id]) {
        groupedStories[story.user_id] = {
          user_id: story.user_id,
          profile: story.profiles,
          stories: []
        };
      }
      groupedStories[story.user_id].stories.push(story);
    });

    setStories(Object.values(groupedStories));
  };

  const handleStoryCreated = () => {
    loadStories();
    setShowCreateDialog(false);
  };

  const userHasStory = stories.some(s => s.user_id === currentUserId);

  return (
    <>
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="relative"
          >
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <Plus className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
          </button>
          <span className="text-xs text-center max-w-[70px] truncate">La tua storia</span>
        </div>

        {/* Stories */}
        {stories.map((storyGroup) => (
          <div
            key={storyGroup.user_id}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <button
              onClick={() => setSelectedStory(storyGroup)}
              className="relative"
            >
              <div className="p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarImage src={storyGroup.profile?.profile_image_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {storyGroup.profile?.first_name?.[0] || storyGroup.profile?.business_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </button>
            <span className="text-xs text-center max-w-[70px] truncate">
              {storyGroup.profile?.first_name || storyGroup.profile?.business_name}
            </span>
          </div>
        ))}
      </div>

      {selectedStory && (
        <StoryViewer
          storyGroup={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}

      <CreateStoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={currentUserId}
        onStoryCreated={handleStoryCreated}
      />
    </>
  );
};

export default StoriesCarousel;
