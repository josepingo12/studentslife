import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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

  const handleMediaUploaded = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const handlePublish = async () => {
    if (!mediaUrl || !mediaType) {
      toast({
        title: "Errore",
        description: "Seleziona un'immagine o un video prima di pubblicare",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("stories")
        .insert({
          user_id: userId,
          image_url: mediaType === 'image' ? mediaUrl : null,
          video_url: mediaType === 'video' ? mediaUrl : null,
          media_type: mediaType,
        });

      if (error) throw error;

      toast({
        title: "Storia pubblicata!",
        description: mediaType === 'video' 
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
          <DialogDescription>
            Carica una foto o un video per condividere la tua storia. Sarà visibile per 24 ore.
          </DialogDescription>
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

          {mediaUrl && (
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Pubblicazione...
                </>
              ) : (
                "Pubblica Storia"
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {mediaType === 'video' ? 'Video caricato - Durata massima: 25 secondi' : 'La tua storia sarà visibile per 24 ore'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;