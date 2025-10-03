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
      .select("id, viewer_id, viewed_at")
      .eq("story_id", storyId)
      .order("viewed_at", { ascending: false });

    if (data) {
      // Load profiles separately
      const viewersWithProfiles = await Promise.all(
        data.map(async (view) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, business_name, profile_image_url")
            .eq("id", view.viewer_id)
            .single();

          return {
            ...view,
            profiles: profile || {}
          };
        })
      );
      
      setViewers(viewersWithProfiles);
    }
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
      <SheetContent side="bottom" className="rounded-t-3xl h-[70vh] bg-background p-0">
        {/* Header with view count */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 z-10">
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2">
            <Eye className="w-5 h-5 text-foreground" />
            <h3 className="text-base font-semibold">{viewers.length} visualizzazioni</h3>
          </div>
        </div>

        {/* Scrollable viewers list */}
        <div className="overflow-y-auto h-[calc(70vh-80px)] px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">Nessuna visualizzazione ancora</p>
            </div>
          ) : (
            <div className="space-y-1">
              {viewers.map((viewer) => (
                <div
                  key={viewer.id}
                  className="flex items-center gap-3 py-3 active:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarImage src={viewer.profiles?.profile_image_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getDisplayName(viewer)[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{getDisplayName(viewer)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(viewer.viewed_at), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoryViewers;