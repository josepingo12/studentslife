import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isOwn: boolean;
}

const VoiceMessagePlayer = ({ audioUrl, isOwn }: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(30).fill(0.3));
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const setupAudioContext = async () => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      visualizeAudio();
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateVisualization = () => {
      if (!analyserRef.current || !isPlaying) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume for each bar
      const barCount = 30;
      const barSize = Math.floor(dataArray.length / barCount);
      const newLevels = [];
      
      for (let i = 0; i < barCount; i++) {
        const start = i * barSize;
        const end = start + barSize;
        const slice = dataArray.slice(start, end);
        const average = slice.reduce((a, b) => a + b, 0) / slice.length;
        newLevels.push(Math.min(1, average / 255));
      }
      
      setAudioLevels(newLevels);
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      if (!audioContextRef.current) {
        await setupAudioContext();
      }
      audio.play();
      setIsPlaying(true);
      visualizeAudio();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 min-w-[200px] max-w-[280px] ${isOwn ? 'flex-row' : 'flex-row'}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className={`rounded-full flex-shrink-0 h-9 w-9 ${
          isOwn 
            ? 'text-primary-foreground hover:bg-primary-foreground/20' 
            : 'text-foreground hover:bg-foreground/10'
        }`}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </Button>

      {/* Waveform Visualization */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 h-8">
          {audioLevels.map((level, index) => {
            const isPassed = progress > 0 && (index / audioLevels.length) * 100 < progress;
            return (
              <div
                key={index}
                className={`flex-1 rounded-full transition-all duration-100 ${
                  isOwn
                    ? isPassed
                      ? 'bg-primary-foreground'
                      : 'bg-primary-foreground/30'
                    : isPassed
                    ? 'bg-primary'
                    : 'bg-foreground/30'
                }`}
                style={{
                  height: `${Math.max(12, (isPlaying ? level : 0.3) * 100)}%`,
                  minHeight: '3px'
                }}
              />
            );
          })}
        </div>
        
        {/* Duration */}
        <div className={`text-[10px] ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {formatTime(isPlaying ? currentTime : duration)}
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
