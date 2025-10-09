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
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);

  const handleMediaUploaded = async (url: string) => {
    setMediaUrl(url);
    setLoading(true);

    try {
      const { error } = await supabase
        .from("stories")
        .insert({
          user_id: userId,
          image_url: uploadType === 'image' ? url : null,
          video_url: uploadType === 'video' ? url : null, // Aggiungi questo campo al database
          media_type: uploadType,
        });

      if (error) throw error;

      toast({
        title: "Storia pubblicata!",
        description: "La tua storia sarà visibile per 24 ore",
      });

      setMediaUrl("");
      setMediaType(null);
      setUploadType(null);
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
    setUploadType(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea una Storia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!uploadType ? (
            /* Selezione tipo media */
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setUploadType('image')}
                className="h-20 flex-col gap-2 bg-gradient-to-br from-green-500 to-emerald-600"
              >
                <ImageIcon className="w-8 h-8" />
                <span>Foto</span>
              </Button>

              <Button
                onClick={() => setUploadType('video')}
                className="h-20 flex-col gap-2 bg-gradient-to-br from-orange-500 to-red-600"
              >
                <VideoIcon className="w-8 h-8" />
                <span>Video</span>
              </Button>
            </div>
          ) : (
            /* Upload del media selezionato */
            <div className="space-y-4">
              <ImageUpload
                bucket="stories"
                userId={userId}
                onImageUploaded={handleMediaUploaded}
                accept={uploadType === 'image' ? "image/*" : "video/*"}
                maxSizeMB={uploadType === 'image' ? 10 : 50}
                showPreview={true}
              />

              <Button
                variant="ghost"
                onClick={() => setUploadType(null)}
                className="w-full"
              >
                ← Indietro
              </Button>
            </div>
          )}

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