import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Camera, 
  Image, 
  Store, 
  Tag, 
  Wallet,
  Gift,
  MessageSquare,
  PartyPopper,
  X,
  Share2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Navigation
} from "lucide-react";
import { ClientOnboardingStep } from "@/hooks/useClientOnboarding";
import confetti from "canvas-confetti";

interface ClientOnboardingProps {
  currentStep: number;
  totalSteps: number;
  step: ClientOnboardingStep | null;
  progress: number;
  onNext: () => boolean | void;
  onPrev: () => void;
  onSkip: () => boolean | void;
  onComplete: () => void;
  onNavigateTab: (tab: string) => void;
  canProceed: boolean;
}

const stepIcons: Record<string, React.ReactNode> = {
  welcome: <Sparkles className="w-10 h-10 text-primary" />,
  "go-to-profile": <Navigation className="w-10 h-10 text-blue-500" />,
  "profile-photo": <Camera className="w-10 h-10 text-blue-500" />,
  "cover-photo": <Image className="w-10 h-10 text-purple-500" />,
  "discover-partners": <Store className="w-10 h-10 text-green-500" />,
  "download-discounts": <Tag className="w-10 h-10 text-red-500" />,
  "wallet": <Wallet className="w-10 h-10 text-amber-500" />,
  "loyalty-cards": <Gift className="w-10 h-10 text-pink-500" />,
  "social-feed": <Share2 className="w-10 h-10 text-blue-400" />,
  "chat": <MessageSquare className="w-10 h-10 text-indigo-500" />,
  complete: <PartyPopper className="w-10 h-10 text-primary" />,
};

const ClientOnboarding = ({
  currentStep,
  totalSteps,
  step,
  progress,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  onNavigateTab,
  canProceed,
}: ClientOnboardingProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<{x: number, y: number, width: number, height: number, isRectangle?: boolean} | null>(null);
  const [prevCanProceed, setPrevCanProceed] = useState(canProceed);
  
  // Detect when canProceed changes from false to true (step completed!)
  useEffect(() => {
    if (canProceed && !prevCanProceed && step?.required) {
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Auto advance after success animation
        onNext();
      }, 1500);
    }
    setPrevCanProceed(canProceed);
  }, [canProceed, prevCanProceed, step?.required, onNext]);

  // Find and track the actual element position
  const updateSpotlightPosition = useCallback(() => {
    if (!step?.highlightElement) {
      setSpotlightRect(null);
      return;
    }

    let element: HTMLElement | null = null;
    
    switch (step.highlightElement) {
      case "avatar":
        element = document.querySelector('[data-onboarding="avatar"]') as HTMLElement;
        break;
      case "profile-avatar":
        element = document.querySelector('[data-onboarding="profile-avatar"]') as HTMLElement;
        break;
      case "cover-photo":
        element = document.querySelector('[data-onboarding="cover-photo"]') as HTMLElement;
        break;
      case "wallet":
        element = document.querySelector('[data-onboarding="wallet"]') as HTMLElement;
        break;
      case "loyalty-cards":
        element = document.querySelector('[data-onboarding="loyalty-cards"]') as HTMLElement;
        break;
      case "upload-button":
        element = document.querySelector('[data-onboarding="upload-button"]') as HTMLElement;
        break;
      case "partners-tab":
        element = document.querySelector('[data-onboarding="partners-tab"]') as HTMLElement;
        break;
      case "chat-tab":
        element = document.querySelector('[data-onboarding="chat-tab"]') as HTMLElement;
        break;
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      // For cover-photo, use rectangle shape; for others use circle (square)
      const isRectangle = step.highlightElement === "cover-photo";
      setSpotlightRect({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: isRectangle ? rect.width + 12 : Math.max(rect.width, rect.height) + 24,
        height: isRectangle ? rect.height + 12 : Math.max(rect.width, rect.height) + 24,
        isRectangle,
      });
    } else {
      setSpotlightRect(null);
    }
  }, [step?.highlightElement]);

  // Update position on mount and window resize
  useEffect(() => {
    updateSpotlightPosition();
    
    const handleResize = () => updateSpotlightPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    // Update frequently for dynamic content
    const interval = setInterval(updateSpotlightPosition, 300);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      clearInterval(interval);
    };
  }, [updateSpotlightPosition, step?.id]);

  if (!step) return null;

  const isLastStep = step.id === "complete";
  const isFirstStep = currentStep === 0;
  const isWelcome = step.id === "welcome";
  const isRequired = step.required;

  // Navigate to the correct tab
  useEffect(() => {
    if (step.targetTab) {
      onNavigateTab(step.targetTab);
    }
  }, [step.targetTab, onNavigateTab]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from the left
      confetti({
        particleCount: Math.floor(particleCount),
        startVelocity: 30,
        spread: 60,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      });

      // Confetti from the right
      confetti({
        particleCount: Math.floor(particleCount),
        startVelocity: 30,
        spread: 60,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      });
    }, 250);
  };

  const handleNext = () => {
    if (isLastStep) {
      triggerConfetti();
      setTimeout(() => {
        onComplete();
      }, 1500);
      return;
    }
    
    if (isRequired && !canProceed) {
      // Show warning that step is required
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }
    
    onNext();
  };

  const handleSkip = () => {
    if (isRequired && !canProceed) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }
    onSkip();
  };

  const getPositionClasses = () => {
    // If we have a spotlight, position relative to it
    if (spotlightRect) {
      // Position below the spotlight for top elements
      if (spotlightRect.y < window.innerHeight / 2) {
        return "top-auto";
      }
      return "bottom-32";
    }
    
    switch (step.position) {
      case "top":
        return "top-20 left-1/2 -translate-x-1/2";
      case "bottom":
        return "bottom-28 left-1/2 -translate-x-1/2";
      default:
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
  };

  const getCardStyle = () => {
    if (spotlightRect && spotlightRect.y < window.innerHeight / 2) {
      return {
        top: `${spotlightRect.y + spotlightRect.height / 2 + 70}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }
    return {};
  };

  return (
    <AnimatePresence mode="wait">
      <>
        {/* Success overlay when step is completed */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="bg-green-500 rounded-full p-8 shadow-2xl"
              >
                <CheckCircle2 className="w-20 h-20 text-white" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute mt-40 text-white text-2xl font-bold"
              >
                ¡Perfecto! ✨
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dark overlay with spotlight cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] pointer-events-none"
          style={{ 
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          {/* Dark background */}
          <div className="absolute inset-0 bg-black/70" />
          
          {/* Spotlight cutout for highlighted element - using actual element position */}
          {spotlightRect && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={spotlightRect.isRectangle ? "absolute rounded-xl" : "absolute rounded-full"}
              style={{
                left: spotlightRect.x - spotlightRect.width / 2,
                top: spotlightRect.y - spotlightRect.height / 2,
                width: spotlightRect.width,
                height: spotlightRect.height,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
                border: "3px solid #3b82f6",
                animation: "spotlight-pulse 2s ease-in-out infinite",
              }}
            />
          )}
        </motion.div>

        {/* Animated arrow pointing to the element */}
        {spotlightRect && step.arrowDirection && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, step.arrowDirection === "up" ? -12 : 12, 0],
            }}
            transition={{ 
              delay: 0.3,
              y: { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
            }}
            className="fixed z-[95]"
            style={{
              left: spotlightRect.x - 20,
              top: step.arrowDirection === "up" 
                ? spotlightRect.y + spotlightRect.height / 2 + 12
                : spotlightRect.y - spotlightRect.height / 2 - 52,
            }}
          >
            <div className="bg-blue-500 rounded-full p-2 shadow-lg">
              {step.arrowDirection === "up" ? (
                <ArrowUp className="w-6 h-6 text-white" />
              ) : (
                <ArrowDown className="w-6 h-6 text-white" />
              )}
            </div>
          </motion.div>
        )}

        {/* Floating tooltip card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`fixed z-[100] mx-4 w-[calc(100%-2rem)] max-w-sm ${!spotlightRect ? getPositionClasses() : ''}`}
          style={getCardStyle()}
        >
          {/* Progress indicator */}
          <div className="mb-3 px-1">
            <div className="flex items-center justify-between text-xs text-white/90 mb-1.5">
              <motion.span 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-blue-500/80 px-3 py-1 rounded-full backdrop-blur-sm font-medium"
              >
                Paso {currentStep + 1} de {totalSteps}
              </motion.span>
              <motion.span 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-blue-500/80 px-3 py-1 rounded-full backdrop-blur-sm font-medium"
              >
                {Math.round(progress)}%
              </motion.span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>

          {/* Main Card */}
          <motion.div 
            className="bg-background rounded-3xl p-6 shadow-2xl border border-border/50 relative overflow-hidden"
            layoutId="onboarding-card"
          >
            {/* Animated gradient background */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10"
              animate={{ 
                background: [
                  "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, transparent 50%, rgba(168,85,247,0.1) 100%)",
                  "linear-gradient(135deg, rgba(168,85,247,0.1) 0%, transparent 50%, rgba(59,130,246,0.1) 100%)",
                  "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, transparent 50%, rgba(168,85,247,0.1) 100%)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            {/* Required badge */}
            {isRequired && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg"
              >
                ⚠️ Obligatorio
              </motion.div>
            )}

            <div className="flex items-start gap-4 relative">
              {/* Icon with animation */}
              <motion.div 
                className="flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {stepIcons[step.id] || <Sparkles className="w-10 h-10 text-primary" />}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-2">
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-bold text-xl mb-2"
                >
                  {step.title}
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {step.description}
                </motion.p>
              </div>
            </div>

            {/* Warning message for required steps */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  </motion.div>
                  <p className="text-sm text-red-700 font-medium">
                    ¡Debes completar este paso para continuar!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex gap-3 mt-5 relative">
              {!isFirstStep && !isLastStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  className="gap-1 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </Button>
              )}
              
              <div className="flex-1" />

              {!isLastStep && !isWelcome && !isRequired && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="gap-1 text-muted-foreground rounded-xl"
                >
                  Saltar
                  <X className="w-4 h-4" />
                </Button>
              )}

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  onClick={handleNext}
                  className={`gap-2 rounded-xl px-6 ${isRequired && !canProceed 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                  }`}
                >
                  {isLastStep ? (
                    <>
                      ¡Empezar!
                      <PartyPopper className="w-4 h-4" />
                    </>
                  ) : isRequired && !canProceed ? (
                    <>
                      Haz clic arriba ↑
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* CSS for animations */}
        <style>{`
          @keyframes spotlight-pulse {
            0%, 100% {
              box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 0 rgba(59, 130, 246, 0.6);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 20px 8px rgba(59, 130, 246, 0.3);
              transform: scale(1.02);
            }
          }
        `}</style>
      </>
    </AnimatePresence>
  );
};

export default ClientOnboarding;