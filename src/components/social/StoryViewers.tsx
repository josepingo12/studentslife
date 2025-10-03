import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface StoryViewersProps {
  storyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Viewer {
  id: string;
  viewer_id: string;
  viewed_at: string;
  profiles: {
    first_name?: string;
    last_name?: string;
    business_name?: string;
    profile_image_url?: string;
  };
}

const StoryViewers = ({ storyId, open, onOpenChange }: StoryViewersProps) => {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && storyId) {
      loadViewers();
      subscribeToViewers();
    }
  }, [open, storyId]);

  const loadViewers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("story_views")
      .select(`
        id,
        viewer_id,
        viewed_at,
        profiles!story_views_viewer_id_fkey(
          first_name,
          last_name,
          business_name,
          profile_image_url
        )
      `)
      .eq("story_id", storyId)
      .order("viewed_at", { ascending: false });

    setViewers(data || []);
    setLoading(false);
  };

  const subscribeToViewers = () => {
    const channel = supabase
      .channel(`story-views-${storyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "story_views",
          filter: `story_id=eq.${storyId}`,
        },
        () => {
          loadViewers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getDisplayName = (viewer: Viewer) => {
    const profile = viewer.profiles;
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile?.business_name || "Utente";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visualizzazioni ({viewers.length})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nessuna visualizzazione ancora</p>
            </div>
          ) : (
            viewers.map((viewer) => (
              <div
                key={viewer.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={viewer.profiles?.profile_image_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getDisplayName(viewer)[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getDisplayName(viewer)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(viewer.viewed_at), {
                      addSuffix: true,
                      locale: it,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoryViewers;