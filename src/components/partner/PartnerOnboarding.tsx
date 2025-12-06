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
  FileText, 
  Images, 
  Tag, 
  CreditCard, 
  BarChart3, 
  PartyPopper,
  X
} from "lucide-react";
import { OnboardingStep } from "@/hooks/usePartnerOnboarding";

interface PartnerOnboardingProps {
  currentStep: number;
  totalSteps: number;
  step: OnboardingStep;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  onNavigateTab: (tab: string) => void;
}

const stepIcons: Record<string, React.ReactNode> = {
  welcome: <Sparkles className="w-16 h-16 text-primary" />,
  "profile-intro": <Camera className="w-16 h-16 text-primary" />,
  "profile-photo": <Camera className="w-16 h-16 text-blue-500" />,
  "cover-photo": <Image className="w-16 h-16 text-purple-500" />,
  "business-data": <FileText className="w-16 h-16 text-green-500" />,
  "gallery-photos": <Images className="w-16 h-16 text-orange-500" />,
  "gallery-upload": <Images className="w-16 h-16 text-orange-500" />,
  "events-intro": <Tag className="w-16 h-16 text-red-500" />,
  "create-discount": <Tag className="w-16 h-16 text-red-500" />,
  "loyalty-card": <CreditCard className="w-16 h-16 text-yellow-500" />,
  "stats-intro": <BarChart3 className="w-16 h-16 text-cyan-500" />,
  "stats-explain": <BarChart3 className="w-16 h-16 text-cyan-500" />,
  complete: <PartyPopper className="w-16 h-16 text-primary" />,
};

const PartnerOnboarding = ({
  currentStep,
  totalSteps,
  step,
  progress,
  onNext,
  onPrev,
  onComplete,
  onNavigateTab,
}: PartnerOnboardingProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // Navigate to the correct tab when step changes
  useEffect(() => {
    if (step.targetTab && step.action === "navigate") {
      setTimeout(() => {
        onNavigateTab(step.targetTab!);
      }, 300);
    }
  }, [step, onNavigateTab]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // If step requires navigation, do it first
    if (step.targetTab) {
      onNavigateTab(step.targetTab);
    }
    
    setTimeout(() => {
      if (isLastStep) {
        onComplete();
      } else {
        onNext();
      }
      setIsAnimating(false);
    }, 200);
  };

  const handlePrev = () => {
    if (isAnimating || isFirstStep) return;
    setIsAnimating(true);
    setTimeout(() => {
      onPrev();
      setIsAnimating(false);
    }, 200);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        {/* Spotlight effect for highlighted elements */}
        {step.targetElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="relative w-full h-full">
              {/* Pulsing ring effect */}
              <div 
                className="absolute w-40 h-40 rounded-full border-4 border-primary/50 animate-ping"
                style={{
                  top: step.position === "top" ? "25%" : step.position === "bottom" ? "60%" : "40%",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Main Content Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
          className="relative z-10 mx-4 w-full max-w-md"
        >
          {/* Progress bar at top */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-white/80 text-sm mb-2">
              <span>Paso {currentStep + 1} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>

          {/* Card */}
          <div className="bg-gradient-to-br from-background via-background to-primary/5 rounded-3xl p-8 shadow-2xl border border-primary/20 backdrop-blur-xl">
            {/* Icon with animated background */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full" />
                <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-6">
                  {stepIcons[step.id] || <Sparkles className="w-16 h-16 text-primary" />}
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center mb-4 text-foreground"
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center text-muted-foreground mb-8 leading-relaxed"
            >
              {step.description}
            </motion.p>

            {/* Step indicator dots */}
            <div className="flex justify-center gap-2 mb-8">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * idx }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep 
                      ? "w-8 bg-primary" 
                      : idx < currentStep 
                        ? "w-2 bg-primary/60" 
                        : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={isAnimating}
                  className="flex-1 h-14 rounded-2xl text-lg font-semibold border-2"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Atrás
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={isAnimating}
                className={`${isFirstStep ? "w-full" : "flex-1"} h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25`}
              >
                {isLastStep ? (
                  <>
                    ¡Empezar!
                    <PartyPopper className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Decorative elements */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl pointer-events-none"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none"
          />
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: [0, 1, 0],
              y: [-20, -100],
              x: Math.sin(i) * 50
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="absolute bottom-20 left-1/2 w-2 h-2 bg-primary/60 rounded-full pointer-events-none"
            style={{ left: `${20 + i * 12}%` }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default PartnerOnboarding;
