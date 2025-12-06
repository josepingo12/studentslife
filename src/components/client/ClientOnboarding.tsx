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
  BookOpen,
  PartyPopper,
  X,
  SkipForward,
  Share2
} from "lucide-react";
import { ClientOnboardingStep } from "@/hooks/useClientOnboarding";

interface ClientOnboardingProps {
  currentStep: number;
  totalSteps: number;
  step: ClientOnboardingStep | null;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onNavigateTab: (tab: string) => void;
}

const stepIcons: Record<string, React.ReactNode> = {
  welcome: <Sparkles className="w-12 h-12 text-primary" />,
  "profile-photo": <Camera className="w-12 h-12 text-blue-500" />,
  "cover-photo": <Image className="w-12 h-12 text-purple-500" />,
  "discover-partners": <Store className="w-12 h-12 text-green-500" />,
  "download-discounts": <Tag className="w-12 h-12 text-red-500" />,
  "wallet": <Wallet className="w-12 h-12 text-amber-500" />,
  "loyalty-cards": <Gift className="w-12 h-12 text-pink-500" />,
  "social-feed": <Share2 className="w-12 h-12 text-blue-400" />,
  "stories": <BookOpen className="w-12 h-12 text-orange-500" />,
  "chat": <MessageSquare className="w-12 h-12 text-indigo-500" />,
  complete: <PartyPopper className="w-12 h-12 text-primary" />,
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
}: ClientOnboardingProps) => {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!step) return null;

  const isLastStep = step.id === "complete";
  const isFirstStep = currentStep === 0;
  const isWelcome = step.id === "welcome";

  // Navigate to the correct tab
  useEffect(() => {
    if (step.targetTab) {
      onNavigateTab(step.targetTab);
    }
  }, [step.targetTab, onNavigateTab]);

  const handleAction = () => {
    if (isLastStep) {
      onComplete();
    } else if (isWelcome) {
      onNext();
    } else {
      // For action steps, minimize tooltip so user can interact
      setIsVisible(false);
    }
  };

  const getPositionClasses = () => {
    switch (step.position) {
      case "top":
        return "top-20 left-1/2 -translate-x-1/2";
      case "bottom":
        return "bottom-24 left-1/2 -translate-x-1/2";
      default:
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <>
          {/* Semi-transparent backdrop for center positions */}
          {step.position === "center" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
              style={{ 
                paddingTop: 'env(safe-area-inset-top)',
              }}
            />
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
              
              {/* Close/Skip button */}
              {!isWelcome && !isLastStep && (
                <button
                  onClick={onSkip}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
                  title="Saltar"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3">
                  {stepIcons[step.id] || <Sparkles className="w-12 h-12 text-primary" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 pr-6">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

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

                {!isWelcome && !isLastStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsVisible(false);
                      onNext();
                    }}
                    className="gap-1 text-muted-foreground"
                  >
                    Siguiente
                    <SkipForward className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleAction}
                  className="gap-1 bg-gradient-to-r from-primary to-primary/80"
                >
                  {isLastStep ? (
                    <>
                      ¡Empezar!
                      <PartyPopper className="w-4 h-4" />
                    </>
                  ) : isWelcome ? (
                    <>
                      Vamos
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      OK
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Arrow pointer for non-center positions */}
            {step.position === "top" && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-r border-b border-border/50 rotate-45" />
            )}
            {step.position === "bottom" && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-l border-t border-border/50 rotate-45" />
            )}
          </motion.div>
        </>
      )}

      {/* Minimized floating button when tooltip is hidden */}
      {!isVisible && !isLastStep && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => setIsVisible(true)}
          className="fixed bottom-28 right-4 z-[100] bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:scale-105 transition-transform"
        >
          <Sparkles className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ClientOnboarding;
