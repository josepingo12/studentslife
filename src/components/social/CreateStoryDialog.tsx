import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import ImageUpload from "@/components/shared/ImageUpload";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onStoryCreated: () => void;
}

const CreateStoryDialog = ({ open, onOpenChange, userId, onStoryCreated }: CreateStoryDialogProps) => {
  const { toast } = useToast();
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const handleMediaUploaded = async (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
    setLoading(true);

    try {
      const { error } = await supabase
        .from("stories")
        .insert({
          user_id: userId,
          image_url: type === 'image' ? url : null,
          video_url: type === 'video' ? url : null,
          media_type: type,
        });

      if (error) throw error;

      toast({
        title: "Storia pubblicata!",
        description: type === 'video' 
          ? "Video caricato! Durata massima: 25 secondi"
          : "La tua storia sarà visibile per 24 ore",
      });

      setMediaUrl("");
      setMediaType(null);
      onStoryCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setMediaUrl("");
    setMediaType(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea una Storia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ImageUpload
            bucket="stories"
            userId={userId}
            onImageUploaded={handleMediaUploaded}
            accept="image/*,video/*"
            maxSizeMB={50}
            showPreview={true}
          />

          <p className="text-xs text-muted-foreground text-center">
            La tua storia sarà visibile per 24 ore
          </p>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2">Pubblicazione...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;