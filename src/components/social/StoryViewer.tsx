import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Eye } from "lucide-react";
=======
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Eye
} from "lucide-react";
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
import StoryViewers from "./StoryViewers";

interface StoryViewerProps {
  storyGroup: {
    user_id: string;
    profile: any;
    stories: any[];
  };
  currentUserId: string;
  onClose: () => void;
  onNext?: () => void;
}

const StoryViewer = ({ storyGroup, currentUserId, onClose, onNext }: StoryViewerProps) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isViewersSheetOpen, setIsViewersSheetOpen] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
<<<<<<< HEAD
  const [viewers, setViewers] = useState<any[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  // NUOVO: Salva il progresso quando viene messo in pausa
  const [savedProgress, setSavedProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
=======
  const [isDesktop, setIsDesktop] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517

  const currentStory = storyGroup.stories[currentStoryIndex];
  const STORY_DURATION = 5000;
  const isOwnStory = storyGroup.user_id === currentUserId;

<<<<<<< HEAD
  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
=======
  // Detect if desktop
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

<<<<<<< HEAD
  useEffect(() => {
    if (currentStory) {
      if (!isOwnStory) markStoryAsViewed(currentStory.id);
      loadViewsCount(currentStory.id);
      loadViewers(currentStory.id);
    }
  }, [currentStory, currentUserId, isOwnStory]);

  // TIMER LOGIC MIGLIORATO - Riprende da dove era rimasto
  useEffect(() => {
    if (isPaused || isViewersSheetOpen) {
      // SALVA il progresso attuale quando viene messo in pausa
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
        storyTimeoutRef.current = null;
      }

      // Salva il progresso corrente
      setSavedProgress(progress);

      // Calcola il tempo rimanente
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, STORY_DURATION - elapsed);
      setRemainingTime(remaining);

      return;
    }

    // RIPRENDE da dove era rimasto
    let startProgress = progress;
    let duration = STORY_DURATION;

    // Se c'è un progresso salvato, riprendi da lì
    if (savedProgress > 0 && remainingTime > 0) {
      startProgress = savedProgress;
      duration = remainingTime;
    } else {
      // Nuova storia, inizia da capo
      startProgress = 0;
      duration = STORY_DURATION;
      setProgress(0);
    }

    // Segna il tempo di inizio
    startTimeRef.current = Date.now();

    // Progress bar animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const elapsed = Date.now() - startTimeRef.current;
        const totalProgress = startProgress + (elapsed / duration) * (100 - startProgress);
        return totalProgress >= 100 ? 100 : totalProgress;
      });
    }, 50); // Più fluido con 50ms
=======
  // Mark story as viewed and load views count
  useEffect(() => {
    if (currentStory) {
      if (!isOwnStory) {
        markStoryAsViewed(currentStory.id);
      }
      loadViewsCount(currentStory.id);
    }
  }, [currentStory, currentUserId, isOwnStory]);

  // Handle story progress and auto-advance - TIMER STOPS when viewers sheet is open
  useEffect(() => {
    if (isPaused || isViewersSheetOpen) {
      // Pause timers when paused or viewers sheet is open
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
      }
      return;
    }

    setProgress(0);
    
    // Progress bar animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (STORY_DURATION / 100));
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517

    // Auto advance to next story
    storyTimeoutRef.current = setTimeout(() => {
      handleNextStory();
<<<<<<< HEAD
    }, duration);
=======
    }, STORY_DURATION);
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
<<<<<<< HEAD
        progressIntervalRef.current = null;
      }
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
        storyTimeoutRef.current = null;
      }
    };
  }, [currentStoryIndex, isPaused, isViewersSheetOpen, savedProgress, remainingTime]);

  // Reset del progresso quando cambia storia
  useEffect(() => {
    setSavedProgress(0);
    setRemainingTime(0);
    setProgress(0);
  }, [currentStoryIndex]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': handlePrevStory(); break;
        case 'ArrowRight': handleNextStory(); break;
        case ' ': e.preventDefault(); setIsPaused(!isPaused); break;
      }
    };
=======
      }
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
      }
    };
  }, [currentStoryIndex, isPaused, isViewersSheetOpen]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevStory();
          break;
        case 'ArrowRight':
          handleNextStory();
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(!isPaused);
          break;
      }
    };

>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused]);

  const markStoryAsViewed = async (storyId: string) => {
    try {
<<<<<<< HEAD
      await supabase.from("story_views").upsert({
        story_id: storyId,
        viewer_id: currentUserId,
        viewed_at: new Date().toISOString()
      }, { onConflict: "story_id,viewer_id" });
=======
      await supabase
        .from("story_views")
        .upsert(
          { story_id: storyId, viewer_id: currentUserId, viewed_at: new Date().toISOString() },
          { onConflict: "story_id,viewer_id" }
        );
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
    } catch (error) {
      console.error("Error tracking story view:", error);
    }
  };

  const loadViewsCount = async (storyId: string) => {
    const { count } = await supabase
      .from("story_views")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId);
<<<<<<< HEAD
    setViewsCount(count || 0);
  };

  const loadViewers = async (storyId: string) => {
    const { data } = await supabase
      .from("story_views")
      .select(`
        id,
        viewer_id,
        viewed_at,
        profiles!inner(
          first_name,
          last_name,
          business_name,
          profile_image_url
        )
      `)
      .eq("story_id", storyId)
      .order("viewed_at", { ascending: false })
      .limit(3);

    setViewers(data || []);
  };

  const handleNextStory = useCallback(() => {
    // Reset del progresso per la prossima storia
    setSavedProgress(0);
    setRemainingTime(0);

    if (currentStoryIndex < storyGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      onNext ? onNext() : onClose();
=======
    
    setViewsCount(count || 0);
  };

  const handleNextStory = useCallback(() => {
    if (currentStoryIndex < storyGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      if (onNext) {
        onNext();
      } else {
        onClose();
      }
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
    }
  }, [currentStoryIndex, storyGroup.stories.length, onNext, onClose]);

  const handlePrevStory = useCallback(() => {
<<<<<<< HEAD
    // Reset del progresso per la storia precedente
    setSavedProgress(0);
    setRemainingTime(0);

=======
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  }, [currentStoryIndex]);

<<<<<<< HEAD
  const handleMouseDown = (side: 'left' | 'right') => {
    side === 'left' ? handlePrevStory() : handleNextStory();
  };

  const getDisplayName = (viewer: any) => {
    const profile = viewer.profiles;
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return profile?.business_name || "Utente";
  };

  const displayName = storyGroup.profile?.first_name
=======
  const handleViewersClick = () => {
    setIsViewersSheetOpen(true);
  };

  const handleMouseDown = (side: 'left' | 'right') => {
    if (side === 'left') {
      handlePrevStory();
    } else {
      handleNextStory();
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const displayName = storyGroup.profile?.first_name 
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
    ? `${storyGroup.profile.first_name} ${storyGroup.profile.last_name || ''}`.trim()
    : storyGroup.profile?.business_name || "Utente";

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
<<<<<<< HEAD
=======
      {/* Desktop Layout */}
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
      {isDesktop ? (
        <div className="relative w-full max-w-md h-full max-h-[90vh] bg-black rounded-lg overflow-hidden">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {storyGroup.stories.map((_: any, index: number) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
<<<<<<< HEAD
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width: index < currentStoryIndex ? '100%' :
=======
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
                           index === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-white">
                <AvatarImage src={storyGroup.profile?.profile_image_url} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs opacity-70">
<<<<<<< HEAD
                  {new Date(currentStory.created_at).toLocaleTimeString('it-IT', {
                    hour: '2-digit', minute: '2-digit'
=======
                  {new Date(currentStory.created_at).toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
<<<<<<< HEAD
              <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)} className="text-white hover:bg-white/20 p-2">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 p-2">
=======
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseToggle}
                className="text-white hover:bg-white/20 p-2"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              {currentStory.media_type === 'video' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20 p-2"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2"
              >
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full">
<<<<<<< HEAD
            <img
              src={currentStory.image_url || currentStory.media_url}
              alt="Story"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex">
              <div className="flex-1 cursor-pointer" onClick={() => handleMouseDown('left')} />
              <div className="flex-1 cursor-pointer" onClick={() => handleMouseDown('right')} />
=======
            {currentStory.media_type === 'image' || !currentStory.media_type ? (
              <img
                src={currentStory.image_url || currentStory.media_url}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentStory.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
              />
            )}

            {/* Click areas for navigation */}
            <div className="absolute inset-0 flex">
              <div 
                className="flex-1 cursor-pointer"
                onMouseDown={() => handleMouseDown('left')}
              />
              <div 
                className="flex-1 cursor-pointer"
                onMouseDown={() => handleMouseDown('right')}
              />
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
            </div>
          </div>

          {/* Navigation arrows */}
          {currentStoryIndex > 0 && (
<<<<<<< HEAD
            <Button variant="ghost" size="sm" onClick={handlePrevStory}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2">
=======
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevStory}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2"
            >
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

<<<<<<< HEAD
          {currentStoryIndex < storyGroup.stories.length - 1 && (
            <Button variant="ghost" size="sm" onClick={handleNextStory}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2">
=======
          {(currentStoryIndex < storyGroup.stories.length - 1) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextStory}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2"
            >
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

<<<<<<< HEAD
          {/* Bottom actions - INSTAGRAM STYLE VIEWERS */}
          {isOwnStory && viewsCount > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <Button
                variant="ghost"
                onClick={() => setIsViewersSheetOpen(true)}
                className="w-full text-white hover:bg-white/20 flex items-center justify-start gap-3 p-3"
              >
                <div className="flex items-center -space-x-2">
                  {viewers.slice(0, 3).map((viewer, index) => (
                    <Avatar
                      key={viewer.id}
                      className="h-6 w-6 border-2 border-white"
                      style={{ zIndex: 3 - index }}
                    >
                      <AvatarImage src={viewer.profiles?.profile_image_url} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary">
                        {getDisplayName(viewer)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>

                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {viewsCount} {viewsCount === 1 ? 'visualizzazione' : 'visualizzazioni'}
                  </span>
                  {viewers.length > 0 && (
                    <span className="text-xs opacity-70">
                      {getDisplayName(viewers[0])} {viewsCount > 1 && `e altri ${viewsCount - 1}`}
                    </span>
                  )}
                </div>
              </Button>
            </div>
          )}
=======
          {/* Bottom actions */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            {isOwnStory && (
              <div className="flex justify-center mb-4">
                <Button
                  variant="ghost"
                  onClick={handleViewersClick}
                  className="text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{viewsCount} visualizzazioni</span>
                </Button>
              </div>
            )}
          </div>
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
        </div>
      ) : (
        /* Mobile Layout */
        <div className="relative w-full h-full bg-black">
<<<<<<< HEAD
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {storyGroup.stories.map((_: any, index: number) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width: index < currentStoryIndex ? '100%' :
=======
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {storyGroup.stories.map((_: any, index: number) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
                           index === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

<<<<<<< HEAD
=======
          {/* Header */}
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
          <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-white">
                <AvatarImage src={storyGroup.profile?.profile_image_url} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs opacity-70">
<<<<<<< HEAD
                  {new Date(currentStory.created_at).toLocaleTimeString('it-IT', {
                    hour: '2-digit', minute: '2-digit'
=======
                  {new Date(currentStory.created_at).toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
                  })}
                </p>
              </div>
            </div>

<<<<<<< HEAD
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 p-2">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative w-full h-full">
            <img
              src={currentStory.image_url || currentStory.media_url}
              alt="Story"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex">
              <div className="flex-1" onTouchStart={() => handleMouseDown('left')} />
              <div className="flex-1" onTouchStart={() => handleMouseDown('right')} />
            </div>
          </div>

          {/* Bottom viewers for mobile - INSTAGRAM STYLE */}
          {isOwnStory && viewsCount > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <Button
                variant="ghost"
                onClick={() => setIsViewersSheetOpen(true)}
                className="w-full text-white hover:bg-white/20 flex items-center justify-center gap-2 p-3 rounded-full bg-black/20 backdrop-blur-sm"
              >
                <div className="flex items-center -space-x-1.5">
                  {viewers.slice(0, 2).map((viewer, index) => (
                    <Avatar
                      key={viewer.id}
                      className="h-5 w-5 border-2 border-white"
                      style={{ zIndex: 2 - index }}
                    >
                      <AvatarImage src={viewer.profiles?.profile_image_url} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary">
                        {getDisplayName(viewer)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>

                <span className="text-sm font-medium">
                  {viewsCount}
                </span>
              </Button>
            </div>
          )}
=======
            <div className="flex items-center gap-2">
              {isOwnStory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewersClick}
                  className="text-white hover:bg-white/20 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{viewsCount}</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full">
            {currentStory.media_type === 'image' || !currentStory.media_type ? (
              <img
                src={currentStory.image_url || currentStory.media_url}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentStory.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
              />
            )}

            {/* Click areas for navigation */}
            <div className="absolute inset-0 flex">
              <div 
                className="flex-1"
                onTouchStart={() => handleMouseDown('left')}
              />
              <div 
                className="flex-1"
                onTouchStart={() => handleMouseDown('right')}
              />
            </div>
          </div>
>>>>>>> 8ae9404e1d1ba9f5b7080d53f58bbecd30f09517
        </div>
      )}

      {/* Story Viewers Sheet */}
      {isOwnStory && (
        <StoryViewers
          storyId={currentStory.id}
          open={isViewersSheetOpen}
          onOpenChange={setIsViewersSheetOpen}
        />
      )}
    </div>
  );
};

export default StoryViewer;
