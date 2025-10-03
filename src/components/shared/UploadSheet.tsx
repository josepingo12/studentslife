import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Image, Video, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUploadComplete?: () => void;
}

const UploadSheet = ({ open, onOpenChange, userId, onUploadComplete }: UploadSheetProps) => {
  const { toast } = useToast();
  const [uploadType, setUploadType] = useState<"post" | "story" | null>(null);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = event.target.files?.[0];
    if (!file || !uploadType) return;

    setUploading(true);
    setUploadProgress(0);
    setSuccess(false);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase Storage
      const bucket = uploadType === "story" ? "stories" : "posts";
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create post or story
      if (uploadType === "story") {
        const { error: storyError } = await supabase
          .from("stories")
          .insert({
            user_id: userId,
            image_url: publicUrl,
          });

        if (storyError) throw storyError;
      } else {
        const { error: postError } = await supabase
          .from("posts")
          .insert({
            user_id: userId,
            content: content || null,
            image_url: publicUrl,
          });

        if (postError) throw postError;
      }

      // Show success
      setSuccess(true);
      setTimeout(() => {
        onUploadComplete?.();
        handleClose();
      }, 1500);

      toast({
        title: "Successo! ✨",
        description: `${uploadType === "story" ? "Storia" : "Post"} caricato con successo`,
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setUploadType(null);
    setContent("");
    setUploading(false);
    setUploadProgress(0);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh]">
        <SheetHeader>
          <SheetTitle className="text-center text-2xl">
            {uploadType ? (uploadType === "story" ? "Nuova Storia" : "Nuovo Post") : "Cosa vuoi pubblicare?"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {!uploadType ? (
            // Selection screen
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setUploadType("post")}
                className="h-32 flex-col gap-3 bg-gradient-to-br from-primary to-primary/80"
              >
                <Sparkles className="w-12 h-12" />
                <span className="text-lg font-semibold">Post</span>
              </Button>
              <Button
                onClick={() => setUploadType("story")}
                className="h-32 flex-col gap-3 bg-gradient-to-br from-secondary to-secondary/80"
              >
                <Sparkles className="w-12 h-12" />
                <span className="text-lg font-semibold">Storia</span>
              </Button>
            </div>
          ) : success ? (
            // Success screen
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="w-24 h-24 text-green-500 animate-scale-in" />
              <h3 className="text-2xl font-bold text-green-500">Pubblicato!</h3>
              <p className="text-muted-foreground">
                Il tuo {uploadType === "story" ? "storia" : "post"} è stato caricato con successo
              </p>
            </div>
          ) : uploading ? (
            // Upload progress screen
            <div className="space-y-6 py-8">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{uploadProgress}%</span>
                  </div>
                </div>
              </div>
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-center text-muted-foreground">
                Caricamento in corso...
              </p>
            </div>
          ) : (
            // Upload form
            <div className="space-y-6">
              {uploadType === "post" && (
                <Textarea
                  placeholder="Scrivi qualcosa..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "image")}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      className="w-full h-24 flex-col gap-3"
                      variant="outline"
                      asChild
                    >
                      <div>
                        <Image className="w-8 h-8" />
                        <span>Foto</span>
                      </div>
                    </Button>
                  </label>
                </div>

                <div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e, "video")}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload">
                    <Button
                      type="button"
                      className="w-full h-24 flex-col gap-3"
                      variant="outline"
                      asChild
                    >
                      <div>
                        <Video className="w-8 h-8" />
                        <span>Video</span>
                      </div>
                    </Button>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full"
              >
                Annulla
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UploadSheet;
