import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  userId: string;
  userProfile: any;
  onPostCreated: () => void;
}

const CreatePost = ({ userId, userProfile, onPostCreated }: CreatePostProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Errore",
        description: "Scrivi qualcosa prima di postare",
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
          content: content.trim(),
        });

      if (error) throw error;

      toast({
        title: "Post pubblicato!",
        description: "Il tuo post è stato condiviso con successo",
      });

      setContent("");
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
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled
        >
          <Image className="w-4 h-4" />
          Foto (prossimamente)
        </Button>
        <Button
          type="submit"
          size="sm"
          className="gap-2"
          disabled={loading || !content.trim()}
        >
          {loading ? "Pubblicazione..." : "Pubblica"}
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default CreatePost;
