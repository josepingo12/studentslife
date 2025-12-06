import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientOnboardingStep {
  id: string;
  title: string;
  description: string;
  targetTab?: "social" | "partners" | "chats";
  checkField?: string;
  position?: "center" | "top" | "bottom";
  required?: boolean;
  highlightElement?: string;
  arrowDirection?: "up" | "down" | "left" | "right";
}

export interface ClientProfileCompletion {
  hasProfilePhoto: boolean;
  hasCoverPhoto: boolean;
}

const ONBOARDING_STEPS: ClientOnboardingStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a StudentsLife! 🎉",
    description: "Te guiaremos para conocer todas las funciones de la app. ¡Vamos!",
    position: "center",
  },
  {
    id: "profile-photo",
    title: "📷 Tu Perfil",
    description: "Desde tu avatar puedes personalizar tu foto de perfil y portada. ¡Dale tu toque personal!",
    targetTab: "social",
    position: "top",
    highlightElement: "avatar",
    arrowDirection: "up",
  },
  {
    id: "discover-partners",
    title: "🏪 Sección Socios",
    description: "Aquí encontrarás todos los locales con descuentos exclusivos. ¡Explora el mapa y las categorías!",
    targetTab: "partners",
    position: "center",
  },
  {
    id: "download-discounts",
    title: "🏷️ Descargar Descuentos",
    description: "Entra en cualquier local → ve a sus eventos → descarga el QR. ¡Muéstralo en el local para tu descuento!",
    targetTab: "partners",
    position: "center",
  },
  {
    id: "wallet",
    title: "💼 Tu Wallet",
    description: "¡Mira! Aquí se guardan todos tus QR descargados. Acceso rápido a tus descuentos activos.",
    targetTab: "partners",
    position: "center",
  },
  {
    id: "loyalty-cards",
    title: "🎁 Tarjetas de Fidelidad",
    description: "¡Mira! Cada vez que uses un QR, acumulas sellos. ¡Con 10 sellos ganas premios gratis!",
    targetTab: "partners",
    position: "center",
  },
  {
    id: "social-feed",
    title: "📱 Feed Social",
    description: "Comparte fotos y videos con la comunidad. ¡Usa el botón + para publicar!",
    targetTab: "social",
    position: "center",
  },
  {
    id: "chat",
    title: "💬 Chat",
    description: "Envía mensajes a otros usuarios y partners. ¡Conecta con la comunidad!",
    targetTab: "chats",
    position: "center",
  },
  {
    id: "complete",
    title: "🎊 ¡Listo!",
    description: "Ya conoces StudentsLife. ¡Disfruta de tus descuentos exclusivos!",
    position: "center",
  },
];

export const useClientOnboarding = (userId: string | undefined) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState<ClientProfileCompletion | null>(null);
  const [steps, setSteps] = useState<ClientOnboardingStep[]>([]);

  // Check profile completion status
  const checkProfileCompletion = useCallback(async () => {
    if (!userId) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_image_url, cover_image_url")
      .eq("id", userId)
      .single();

    const completion: ClientProfileCompletion = {
      hasProfilePhoto: !!profile?.profile_image_url,
      hasCoverPhoto: !!profile?.cover_image_url,
    };

    setProfileCompletion(completion);
    return completion;
  }, [userId]);

  // Build the steps list based on completion
  const calculateSteps = useCallback(() => {
    const wasCompleted = localStorage.getItem(`client_onboarding_completed_${userId}`);
    
    // If already completed, don't show again
    if (wasCompleted) {
      return [];
    }
    
    // Always show all steps
    localStorage.setItem(`client_onboarding_started_${userId}`, "true");
    return ONBOARDING_STEPS;
  }, [userId]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      await checkProfileCompletion();
      const stepsToShow = calculateSteps();
      setSteps(stepsToShow);
      setIsOnboardingActive(stepsToShow.length > 0);
      setIsLoading(false);
    };

    init();
  }, [userId, checkProfileCompletion, calculateSteps]);

  // Refresh completion status
  const refreshCompletion = useCallback(async () => {
    const completion = await checkProfileCompletion();
    if (completion) {
      setProfileCompletion(completion);
    }
  }, [checkProfileCompletion]);

  // All steps are now demonstrative, always can proceed
  const canProceed = useCallback(() => {
    return true;
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return true;
    }
    return true;
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(() => {
    if (userId) {
      localStorage.setItem(`client_onboarding_completed_${userId}`, "true");
    }
    setIsOnboardingActive(false);
  }, [userId]);

  const skipCurrentStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
    return true;
  }, [currentStep, steps, completeOnboarding]);

  const getCurrentStep = (): ClientOnboardingStep | null => {
    return steps[currentStep] || null;
  };

  const getProgress = (): number => {
    if (steps.length === 0) return 100;
    return ((currentStep + 1) / steps.length) * 100;
  };

  return {
    currentStep,
    totalSteps: steps.length,
    isOnboardingActive,
    isLoading,
    steps,
    profileCompletion,
    getCurrentStep,
    getProgress,
    nextStep,
    prevStep,
    skipCurrentStep,
    completeOnboarding,
    refreshCompletion,
    setCurrentStep,
    canProceed,
  };
};
