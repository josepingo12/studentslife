import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/shared/ImageUpload";
import { useTranslation } from "react-i18next";

interface CreatePostProps {
  userId: string;
  userProfile: any;
  onPostCreated: () => void;
}

const CreatePost = ({ userId, userProfile, onPostCreated }: CreatePostProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !mediaUrl) {
      toast({
        title: t('common.error'),
        description: t('errors.fillAllFields'),
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
          image_url: mediaType === 'image' ? mediaUrl : null,
          video_url: mediaType === 'video' ? mediaUrl : null,
          media_type: mediaType,
        });

      if (error) throw error;

      toast({
        title: t('success.postCreated'),
        description: t('success.postCreated'),
      });

      setContent("");
      setMediaUrl(null);
      setMediaType(null);
      setShowMediaUpload(false);
      onPostCreated();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploaded = (url: string, type?: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type || 'image');
    setShowMediaUpload(false);
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
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
          placeholder={t('post.whatsOnYourMind')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-none"
          disabled={loading}
        />
      </div>

      {/* Media Preview */}
      {mediaUrl && (
        <div className="relative">
          {mediaType === 'image' ? (
            <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
          ) : (
            <video
              src={mediaUrl}
              className="w-full h-48 object-cover rounded-lg"
              controls
              preload="metadata"
            />
          )}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={removeMedia}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Media Upload */}
      {showMediaUpload && !mediaUrl && (
        <ImageUpload
          bucket="posts"
          userId={userId}
          onImageUploaded={handleMediaUploaded}
          accept="image/*,video/*"
          maxSizeMB={50}
          showPreview={false}
        />
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setShowMediaUpload(!showMediaUpload)}
          disabled={loading || !!mediaUrl}
        >
          <ImageIcon className="w-4 h-4" />
          {showMediaUpload ? t('common.cancel') : 'Foto/Video'}
        </Button>

        <Button
          type="submit"
          size="sm"
          className="gap-2"
          disabled={loading || (!content.trim() && !mediaUrl)}
        >
          {loading ? t('settings.saving') : t('post.publish')}
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default CreatePost;
