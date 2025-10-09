import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
<<<<<<< HEAD
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
=======
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
import ImageUpload from "@/components/shared/ImageUpload";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onStoryCreated: () => void;
}

const CreateStoryDialog = ({ open, onOpenChange, userId, onStoryCreated }: CreateStoryDialogProps) => {
  const { toast } = useToast();
<<<<<<< HEAD
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);

  const handleMediaUploaded = async (url: string) => {
    setMediaUrl(url);
=======
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageUploaded = async (url: string) => {
    setImageUrl(url);
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
    setLoading(true);

    try {
      const { error } = await supabase
        .from("stories")
        .insert({
          user_id: userId,
<<<<<<< HEAD
          image_url: uploadType === 'image' ? url : null,
          video_url: uploadType === 'video' ? url : null, // Aggiungi questo campo al database
          media_type: uploadType,
=======
          image_url: url,
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
        });

      if (error) throw error;

      toast({
        title: "Storia pubblicata!",
        description: "La tua storia sarà visibile per 24 ore",
      });

<<<<<<< HEAD
      setMediaUrl("");
      setMediaType(null);
      setUploadType(null);
=======
      setImageUrl("");
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
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

<<<<<<< HEAD
  const resetDialog = () => {
    setMediaUrl("");
    setMediaType(null);
    setUploadType(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
=======
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea una Storia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
<<<<<<< HEAD
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

=======
          <div className="space-y-2">
            <ImageUpload
              bucket="stories"
              userId={userId}
              onImageUploaded={handleImageUploaded}
              accept="image/*,video/*"
              maxSizeMB={20}
              showPreview={true}
            />
            <p className="text-xs text-muted-foreground">
              La tua storia sarà visibile per 24 ore
            </p>
          </div>
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
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

<<<<<<< HEAD
export default CreateStoryDialog;
=======
export default CreateStoryDialog;
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
