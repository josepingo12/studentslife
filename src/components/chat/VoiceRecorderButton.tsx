import { useState, useRef, useEffect } from "react";
import { Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

const VoiceRecorderButton = ({ onRecordingComplete, disabled }: VoiceRecorderButtonProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(40).fill(0));
  const [touchStartY, setTouchStartY] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Determine best supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/wav',
      ];
      
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!supportedMimeType) {
        throw new Error("Nessun formato audio supportato dal browser");
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (!isCancelling && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
          onRecordingComplete(audioBlob);
        }
        
        setIsRecording(false);
        setRecordingTime(0);
        setIsCancelling(false);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start visualization
      visualizeAudio();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile accedere al microfono. Verifica i permessi.",
        variant: "destructive",
      });
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevels = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Take samples and normalize to 0-1 range
      const samples = 40;
      const step = Math.floor(dataArray.length / samples);
      const newLevels = [];
      
      for (let i = 0; i < samples; i++) {
        const index = i * step;
        const value = dataArray[index] / 255;
        newLevels.push(value);
      }
      
      setAudioLevels(newLevels);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    setIsCancelling(true);
    stopRecording();
  };

  const handleMouseDown = () => {
    if (disabled) return;
    startRecording();
  };

  const handleMouseUp = () => {
    if (!isRecording) return;
    stopRecording();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    startRecording();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording) return;
    const touch = e.touches[0];
    const deltaY = touchStartY - touch.clientY;
    
    // Se scorri verso l'alto di più di 50px, cancella
    if (deltaY > 50) {
      setIsCancelling(true);
    } else {
      setIsCancelling(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isRecording) return;
    
    if (isCancelling) {
      cancelRecording();
    } else {
      stopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full flex-shrink-0 touch-none"
        disabled={disabled}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500' : ''}`} />
      </Button>

      <Sheet open={isRecording} onOpenChange={() => {}}>
        <SheetContent 
          side="bottom" 
          className="h-[300px] border-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center h-full gap-6">
            {/* Cancel indicator */}
            {isCancelling && (
              <div className="absolute top-8 left-0 right-0 flex items-center justify-center gap-2 text-red-500 animate-pulse">
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">Scorri su per annullare</span>
              </div>
            )}

            {/* Waveform visualization */}
            <div className="flex items-center justify-center gap-1 h-32">
              {audioLevels.map((level, index) => (
                <div
                  key={index}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    isCancelling ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{
                    height: `${Math.max(4, level * 100)}px`,
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className={`text-2xl font-mono font-bold ${isCancelling ? 'text-red-500' : ''}`}>
              {formatTime(recordingTime)}
            </div>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground text-center">
              {isCancelling ? (
                <span className="text-red-500">Rilascia per annullare</span>
              ) : (
                <>
                  <p>Rilascia per inviare</p>
                  <p className="text-xs mt-1">Scorri su per annullare</p>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default VoiceRecorderButton;
