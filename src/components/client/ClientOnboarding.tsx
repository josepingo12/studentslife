import { useEffect, useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { ClientOnboardingStep } from "@/hooks/useClientOnboarding";

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

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
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
    // For required steps with highlight, position near top but below the header
    if (step.highlightElement === "avatar") {
      return "top-32 left-1/2 -translate-x-1/2";
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

  // Get spotlight position based on highlight element
  const getSpotlightPosition = () => {
    switch (step.highlightElement) {
      case "avatar":
        return { top: "1rem", right: "1.5rem", size: "3.5rem" };
      case "wallet":
        return { top: "4.5rem", right: "1.5rem", size: "3rem" };
      case "loyalty-cards":
        return { top: "4.5rem", right: "5rem", size: "3rem" };
      case "upload-button":
        return { bottom: "5rem", left: "50%", transform: "translateX(-50%)", size: "4.5rem" };
      case "partners-tab":
        return { bottom: "1.5rem", left: "30%", size: "3rem" };
      case "chat-tab":
        return { bottom: "1.5rem", right: "1rem", size: "3rem" };
      default:
        return null;
    }
  };

  const spotlightPos = getSpotlightPosition();

  return (
    <AnimatePresence mode="wait">
      <>
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
          
          {/* Spotlight cutout for highlighted element */}
          {spotlightPos && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute rounded-full"
              style={{
                top: spotlightPos.top,
                right: spotlightPos.right,
                bottom: spotlightPos.bottom,
                left: spotlightPos.left,
                transform: spotlightPos.transform,
                width: spotlightPos.size,
                height: spotlightPos.size,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
                border: "3px solid #3b82f6",
                animation: "pulse-ring 2s ease-in-out infinite",
              }}
            />
          )}
        </motion.div>

        {/* Animated arrow pointing to the element */}
        {spotlightPos && step.arrowDirection && (
          <motion.div
            initial={{ opacity: 0, y: step.arrowDirection === "up" ? 10 : -10 }}
            animate={{ 
              opacity: 1, 
              y: [0, step.arrowDirection === "up" ? -8 : 8, 0],
            }}
            transition={{ 
              delay: 0.5,
              y: { repeat: Infinity, duration: 1 }
            }}
            className="fixed z-[95] text-blue-400"
            style={{
              top: step.arrowDirection === "up" 
                ? `calc(${spotlightPos.top} + ${spotlightPos.size} + 0.5rem)` 
                : undefined,
              bottom: step.arrowDirection === "down" 
                ? `calc(${spotlightPos.bottom} + ${spotlightPos.size} + 0.5rem)` 
                : undefined,
              right: spotlightPos.right,
              left: spotlightPos.left,
              transform: spotlightPos.transform,
            }}
          >
            {step.arrowDirection === "up" ? (
              <ArrowUp className="w-8 h-8 drop-shadow-lg" />
            ) : (
              <ArrowDown className="w-8 h-8 drop-shadow-lg" />
            )}
          </motion.div>
        )}

        {/* Floating tooltip card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed z-[100] mx-4 w-[calc(100%-2rem)] max-w-sm ${getPositionClasses()}`}
        >
          {/* Progress indicator */}
          <div className="mb-2 px-1">
            <div className="flex items-center justify-between text-xs text-white/80 mb-1">
              <span className="bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Paso {currentStep + 1} de {totalSteps}
              </span>
              <span className="bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-1.5 bg-white/20" />
          </div>

          {/* Main Card */}
          <div className="bg-background rounded-2xl p-5 shadow-2xl border border-border/50 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full pointer-events-none" />
            
            {/* Required badge */}
            {isRequired && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Obligatorio
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3">
                {stepIcons[step.id] || <Sparkles className="w-10 h-10 text-primary" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Warning message for required steps */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    ¡Debes completar este paso para continuar!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              {!isFirstStep && !isLastStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrev}
                  className="gap-1"
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
                  className="gap-1 text-muted-foreground"
                >
                  Saltar
                  <X className="w-4 h-4" />
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleNext}
                className={`gap-1 ${isRequired && !canProceed 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-primary to-primary/80"
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
            </div>
          </div>
        </motion.div>

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse-ring {
            0%, 100% {
              box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 0 rgba(59, 130, 246, 0.7);
            }
            50% {
              box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 12px rgba(59, 130, 246, 0);
            }
          }
        `}</style>
      </>
    </AnimatePresence>
  );
};

export default ClientOnboarding;
