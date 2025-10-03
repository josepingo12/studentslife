import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/shared/ImageUploader";

interface CreatePostProps {
  userId: string;
  userProfile: any;
  onPostCreated: () => void;
}

const CreatePost = ({ userId, userProfile, onPostCreated }: CreatePostProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !imageUrl) {
      toast({
        title: "Errore",
        description: "Scrivi qualcosa o aggiungi un'immagine",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: content.trim() || null,
          image_url: imageUrl,
        });

      if (error) throw error;

      toast({
        title: "Post pubblicato!",
        description: "Il tuo post è stato condiviso con successo",
      });

      setContent("");
      setImageUrl(null);
      onPostCreated();
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

  return (
    <form onSubmit={handleSubmit} className="ios-card p-4 space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={userProfile?.profile_image_url} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userProfile?.first_name?.[0] || userProfile?.business_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <Textarea
          placeholder="Cosa stai pensando?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-none"
          disabled={loading}
        />
      </div>
      
      <ImageUploader
        bucket="posts"
        userId={userId}
        onUploadComplete={setImageUrl}
      />

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          size="sm"
          className="gap-2"
          disabled={loading || (!content.trim() && !imageUrl)}
        >
          {loading ? "Pubblicazione..." : "Pubblica"}
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default CreatePost;
