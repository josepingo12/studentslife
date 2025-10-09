import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
<<<<<<< HEAD
import { Send, X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
=======
import { Send, X, Image as ImageIcon } from "lucide-react";
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
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
<<<<<<< HEAD
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !mediaUrl) {
=======
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !imageUrl) {
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
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
<<<<<<< HEAD
          image_url: mediaType === 'image' ? mediaUrl : null,
          video_url: mediaType === 'video' ? mediaUrl : null, // Aggiungi questo campo al database
          media_type: mediaType,
=======
          image_url: imageUrl,
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
        });

      if (error) throw error;

      toast({
        title: t('success.postCreated'),
        description: t('success.postCreated'),
      });

      setContent("");
<<<<<<< HEAD
      setMediaUrl(null);
      setMediaType(null);
      setShowImageUpload(false);
      setShowVideoUpload(false);
=======
      setImageUrl(null);
      setShowImageUpload(false);
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
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

<<<<<<< HEAD
  const handleMediaUploaded = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
    setShowImageUpload(false);
    setShowVideoUpload(false);
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

=======
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
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
<<<<<<< HEAD

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
=======
      
      {imageUrl && (
        <div className="relative">
          <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
<<<<<<< HEAD
            onClick={removeMedia}
=======
            onClick={() => setImageUrl(null)}
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

<<<<<<< HEAD
      {/* Image Upload */}
      {showImageUpload && !mediaUrl && (
        <ImageUpload
          bucket="posts"
          userId={userId}
          onImageUploaded={(url) => handleMediaUploaded(url, 'image')}
=======
      {showImageUpload && !imageUrl && (
        <ImageUpload
          bucket="posts"
          userId={userId}
          onImageUploaded={(url) => {
            setImageUrl(url);
            setShowImageUpload(false);
          }}
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
          accept="image/*"
          maxSizeMB={10}
          showPreview={false}
        />
      )}
<<<<<<< HEAD

      {/* Video Upload */}
      {showVideoUpload && !mediaUrl && (
        <ImageUpload
          bucket="posts"
          userId={userId}
          onImageUploaded={(url) => handleMediaUploaded(url, 'video')}
          accept="video/*"
          maxSizeMB={50} // Video più grandi
          showPreview={false}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
              setShowImageUpload(!showImageUpload);
              setShowVideoUpload(false);
            }}
            disabled={loading || !!mediaUrl}
          >
            <ImageIcon className="w-4 h-4" />
            {showImageUpload ? t('common.cancel') : 'Foto'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
              setShowVideoUpload(!showVideoUpload);
              setShowImageUpload(false);
            }}
            disabled={loading || !!mediaUrl}
          >
            <VideoIcon className="w-4 h-4" />
            {showVideoUpload ? t('common.cancel') : 'Video'}
          </Button>
        </div>

=======
      
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setShowImageUpload(!showImageUpload)}
          disabled={loading || !!imageUrl}
        >
          <ImageIcon className="w-4 h-4" />
          {showImageUpload ? t('common.cancel') : t('common.upload')}
        </Button>
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
        <Button
          type="submit"
          size="sm"
          className="gap-2"
<<<<<<< HEAD
          disabled={loading || (!content.trim() && !mediaUrl)}
=======
          disabled={loading || (!content.trim() && !imageUrl)}
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
        >
          {loading ? t('settings.saving') : t('post.publish')}
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default CreatePost;
