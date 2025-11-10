import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
        profiles!inner(
          first_name,
          last_name,
          business_name,
          profile_image_url
        )
      `)
      .eq("story_id", storyId)
      .order("viewed_at", { ascending: false });

    if (data) {
      setViewers(data);
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
    return profile?.business_name || "Usuario";
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] bg-background/98 backdrop-blur-xl border-t border-border/50 p-0">
        {/* Handle bar - Instagram style */}
        <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mt-3 mb-4" />
        
        {/* Header con contador */}
        <div className="px-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              {viewers.length}
            </h3>
          </div>
        </div>

        {/* Lista de visualizadores - Instagram style */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                <Eye className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Aún no hay visualizaciones</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {viewers.map((viewer, index) => (
                <div
                  key={viewer.id}
                  className="flex items-center gap-3 py-2.5 px-2 active:bg-muted/40 transition-colors duration-150"
                  style={{
                    animation: `fade-in 0.2s ease-out ${index * 0.03}s backwards`
                  }}
                >
                  <Avatar className="h-11 w-11 border border-border/20">
                    <AvatarImage
                      src={viewer.profiles?.profile_image_url}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-semibold text-sm">
                      {getDisplayName(viewer)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[14px] truncate text-foreground">
                      {getDisplayName(viewer)}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {formatDistanceToNow(new Date(viewer.viewed_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default StoryViewers;