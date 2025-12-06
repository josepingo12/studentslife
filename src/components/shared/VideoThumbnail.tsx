import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";

interface VideoThumbnailProps {
  videoUrl: string;
  className?: string;
  showPlayIcon?: boolean;
  onClick?: () => void;
}

const VideoThumbnail = ({ videoUrl, className = "", showPlayIcon = false, onClick }: VideoThumbnailProps) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (videoUrl) {
      generateThumbnail(videoUrl);
    }
  }, [videoUrl]);

  const generateThumbnail = (url: string) => {
    setLoading(true);
    setError(false);

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('webkit-playsinline', 'true');
    
    let thumbnailGenerated = false;
    
    const captureFrame = () => {
      if (thumbnailGenerated) return;
      thumbnailGenerated = true;
      
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 200;
        canvas.height = video.videoHeight || 356;
        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setThumbnail(dataUrl);
        }
      } catch (e) {
        console.error('Error generating thumbnail:', e);
        setError(true);
      }
      setLoading(false);
      cleanup();
    };

    const cleanup = () => {
      video.pause();
      video.src = '';
      video.load();
    };

    video.onloadeddata = () => {
      setTimeout(() => {
        video.currentTime = 0.5;
      }, 100);
    };
    
    video.onseeked = captureFrame;
    
    video.onerror = () => {
      console.error('Error loading video for thumbnail');
      setError(true);
      setLoading(false);
    };

    // Timeout fallback
    setTimeout(() => {
      if (!thumbnailGenerated) {
        setError(true);
        setLoading(false);
        cleanup();
      }
    }, 5000);

    video.src = url;
    video.load();
    
    // Try to play for mobile compatibility
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        video.pause();
        video.currentTime = 0.5;
      }).catch(() => {
        // Autoplay prevented, rely on load
      });
    }
  };

  if (loading) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !thumbnail) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <Play className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <img 
        src={thumbnail}
        alt=""
        className="w-full h-full object-cover"
      />
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-primary ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoThumbnail;
