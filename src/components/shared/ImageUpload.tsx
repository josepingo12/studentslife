import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Image, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  bucket: "avatars" | "stories" | "posts" | "gallery";
  userId: string;
  onImageUploaded: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  showPreview?: boolean;
}

const ImageUpload = ({ 
  bucket, 
  userId, 
  onImageUploaded, 
  accept = "image/*,video/*",
  maxSizeMB = 10,
  showPreview = true
}: ImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: `Il file deve essere inferiore a ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      toast({
        title: "Upload completato!",
        description: file.type.startsWith('video/') ? "Video caricato con successo" : "Immagine caricata con successo",
      });

      onImageUploaded(publicUrl);
      
      if (showPreview) {
        setPreview(publicUrl);
        setPreviewType(file.type.startsWith('video/') ? 'video' : 'image');
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Errore upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setPreviewType(null);
  };

  return (
    <div className="space-y-3">
      {showPreview && preview && (
        <div className="relative">
          {previewType === 'video' ? (
            <video 
              src={preview} 
              className="w-full h-48 object-cover rounded-lg"
              controls
              preload="metadata"
            />
          ) : (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg"
            />
          )}
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={clearPreview}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Image className="w-4 h-4" />
              Galleria
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="w-4 h-4" />
          Fotocamera
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
