import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Image, Video, CheckCircle2, Camera, FileText } from "lucide-react";
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadType) return;

    const isVideo = file.type.startsWith("video/");

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

      // Create post or story con media_type corretto
      const isVideo = file.type.startsWith("video/");

      if (uploadType === "story") {
        const { error: storyError } = await supabase
          .from("stories")
          .insert({
            user_id: userId,
            image_url: isVideo ? null : publicUrl,
            video_url: isVideo ? publicUrl : null,
            media_type: isVideo ? 'video' : 'image',
          });

        if (storyError) throw storyError;
      } else {
        const { error: postError } = await supabase
          .from("posts")
          .insert({
            user_id: userId,
            content: content || null,
            image_url: isVideo ? null : publicUrl,
            video_url: isVideo ? publicUrl : null,
            media_type: isVideo ? 'video' : 'image',
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
      <SheetContent
        side="bottom"
        className={`rounded-t-[24px] bg-white border-t border-border/30 p-0 shadow-2xl ${
          isDesktop
            ? uploadType ? 'h-[500px] max-w-2xl mx-auto' : 'h-[280px] max-w-lg mx-auto'
            : uploadType ? 'h-[80vh]' : 'h-[280px]'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header - SENZA X */}
        <div className="text-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {uploadType ? (uploadType === "story" ? "Nuova Storia" : "Nuovo Post") : "Cosa vuoi condividere?"}
          </h2>
        </div>

        <div className="px-6 py-6">
          {!uploadType ? (
            /* Selection screen - SOLO STORIA E POST */
            <div className="grid grid-cols-2 gap-4">
              {/* Storia */}
              <Button
                variant="ghost"
                onClick={() => setUploadType("story")}
                className="h-auto p-6 flex flex-col items-center gap-4 hover:bg-gray-50 transition-all duration-200 rounded-2xl group border border-gray-200"
              >
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-4 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-200">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base text-gray-900">
                    Storia
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Condividi un momento
                  </p>
                </div>
              </Button>

              {/* Post */}
              <Button
                variant="ghost"
                onClick={() => setUploadType("post")}
                className="h-auto p-6 flex flex-col items-center gap-4 hover:bg-gray-50 transition-all duration-200 rounded-2xl group border border-gray-200"
              >
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-200">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base text-gray-900">
                    Post
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Scrivi qualcosa
                  </p>
                </div>
              </Button>
            </div>
          ) : success ? (
            /* Success screen */
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="w-24 h-24 text-green-500 animate-pulse" />
              <h3 className="text-2xl font-bold text-green-500">Pubblicato!</h3>
              <p className="text-gray-600 text-center">
                Il tuo {uploadType === "story" ? "storia" : "post"} è stato caricato con successo
              </p>
            </div>
          ) : uploading ? (
            /* Upload progress screen */
            <div className="space-y-6 py-8">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-blue-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">{uploadProgress}%</span>
                  </div>
                </div>
              </div>
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-center text-gray-600">
                Caricamento in corso...
              </p>
            </div>
          ) : (
            /* Upload form */
            <div className="space-y-6">
              {uploadType === "post" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Descrizione</label>
                  <Textarea
                    placeholder="Scrivi qualcosa..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] resize-none rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Seleziona dal dispositivo</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload">
                  <Button
                    type="button"
                    className="w-full h-20 flex-col gap-2 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white border-0 rounded-2xl"
                    asChild
                  >
                    <div className="cursor-pointer">
                      <Camera className="w-6 h-6" />
                      <span className="text-sm font-medium">Foto/Video</span>
                    </div>
                  </Button>
                </label>
              </div>

              <Button
                onClick={() => setUploadType(null)}
                variant="ghost"
                className="w-full rounded-2xl text-gray-600 hover:bg-gray-100"
              >
                ← Indietro
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UploadSheet;
