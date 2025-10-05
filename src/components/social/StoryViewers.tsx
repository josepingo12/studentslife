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
      <SheetContent side="bottom" className="rounded-t-[20px] h-[70vh] bg-background/95 backdrop-blur-xl border-t border-border/50 p-0 shadow-2xl">
        {/* Header with view count */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border/30 px-5 py-4 z-10">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {viewers.length} {viewers.length === 1 ? 'visualizzazione' : 'visualizzazioni'}
            </h3>
          </div>
        </div>

        {/* Scrollable viewers list */}
        <div className="overflow-y-auto h-[calc(70vh-75px)] overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="p-4 bg-muted/30 rounded-full mb-4">
                <Eye className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Nessuna visualizzazione ancora</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Quando qualcuno vedrà la tua storia apparirà qui</p>
            </div>
          ) : (
            <div className="px-4 py-2">
              {viewers.map((viewer, index) => (
                <div
                  key={viewer.id}
                  className="flex items-center gap-3.5 py-3 px-2 rounded-xl active:bg-muted/30 transition-all duration-200 hover:bg-muted/20"
                  style={{
                    animation: `fade-in 0.3s ease-out ${index * 0.05}s backwards`
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm ring-1 ring-border/20">
                      <AvatarImage 
                        src={viewer.profiles?.profile_image_url} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-base">
                        {getDisplayName(viewer)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] truncate text-foreground leading-tight">
                      {getDisplayName(viewer)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
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