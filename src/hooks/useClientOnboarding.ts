import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientOnboardingStep {
  id: string;
  title: string;
  description: string;
  targetTab?: "social" | "partners" | "chats";
  checkField?: string;
  position?: "center" | "top" | "bottom";
  required?: boolean; // If true, user must complete this step to proceed
  highlightElement?: string; // CSS selector or identifier for spotlight
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
    description: "Te guiaremos para configurar tu perfil. ¡Solo unos segundos!",
    position: "center",
  },
  {
    id: "go-to-profile",
    title: "📷 Tu Perfil",
    description: "Haz clic en tu avatar para ir a tu perfil y configurar tus fotos. ¡Es obligatorio!",
    targetTab: "social",
    position: "top",
    highlightElement: "avatar",
    arrowDirection: "up",
  },
  {
    id: "profile-photo",
    title: "📷 Tu Foto de Perfil",
    description: "Haz clic en el botón de edición sobre tu avatar para subir una foto de perfil. ¡Personaliza tu cuenta!",
    position: "top",
    highlightElement: "profile-avatar",
    arrowDirection: "up",
  },
  {
    id: "cover-photo",
    title: "🖼️ Tu Foto de Portada",
    description: "Haz clic en la imagen de portada arriba para subir tu foto de fondo. ¡Dale estilo a tu perfil!",
    position: "top",
    highlightElement: "cover-photo",
    arrowDirection: "up",
  },
  {
    id: "discover-partners",
    title: "🏪 Descubre Negocios",
    description: "En la pestaña 'Socios' encontrarás locales con descuentos exclusivos para estudiantes.",
    targetTab: "partners",
    position: "bottom",
    highlightElement: "partners-tab",
    arrowDirection: "down",
  },
  {
    id: "download-discounts",
    title: "🏷️ Cómo Descargar Descuentos",
    description: "Entra en cualquier local, busca sus eventos y descarga el código QR. ¡Muéstralo para tu descuento!",
    targetTab: "partners",
    position: "center",
  },
  {
    id: "wallet",
    title: "💼 Tu Wallet",
    description: "Tus QR descargados están aquí en el Wallet. ¡Acceso rápido a todos tus descuentos!",
    targetTab: "partners",
    position: "top",
    highlightElement: "wallet",
    arrowDirection: "up",
  },
  {
    id: "loyalty-cards",
    title: "🎁 Tarjetas de Fidelidad",
    description: "Al usar QR de partners, acumulas sellos. ¡Al completar 10, ganas premios gratis!",
    targetTab: "partners",
    position: "top",
    highlightElement: "loyalty-cards",
    arrowDirection: "up",
  },
  {
    id: "social-feed",
    title: "📱 Feed Social",
    description: "Comparte fotos y videos con la comunidad. ¡Haz clic en + para publicar!",
    targetTab: "social",
    position: "center",
    highlightElement: "upload-button",
    arrowDirection: "down",
  },
  {
    id: "chat",
    title: "💬 Chat",
    description: "Envía mensajes a otros usuarios y partners. ¡Conecta con la comunidad!",
    targetTab: "chats",
    position: "bottom",
    highlightElement: "chat-tab",
    arrowDirection: "down",
  },
  {
    id: "complete",
    title: "🎊 ¡Perfil Completado!",
    description: "Ya conoces las funciones principales. ¡Disfruta de StudentsLife!",
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
  const calculateSteps = useCallback((completion: ClientProfileCompletion) => {
    const wasCompleted = localStorage.getItem(`client_onboarding_completed_${userId}`);
    
    // If already completed, don't show again
    if (wasCompleted) {
      return [];
    }
    
    // Always show all steps for first time or returning user who hasn't completed
    // Mark as started
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

      const completion = await checkProfileCompletion();
      if (completion) {
        const stepsToShow = calculateSteps(completion);
        setSteps(stepsToShow);
        setIsOnboardingActive(stepsToShow.length > 0);
      }
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

  // Check if current step can proceed
  const canProceed = useCallback(() => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return true;
    
    // If step is required and has a checkField, verify it's complete
    if (currentStepData.required && currentStepData.checkField && profileCompletion) {
      return profileCompletion[currentStepData.checkField as keyof ClientProfileCompletion];
    }
    
    return true;
  }, [currentStep, steps, profileCompletion]);

  const nextStep = useCallback(() => {
    // Check if can proceed (required steps must be completed)
    if (!canProceed()) {
      return false; // Cannot proceed
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return true;
    }
    return true;
  }, [currentStep, steps.length, canProceed]);

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
    const currentStepData = steps[currentStep];
    // Cannot skip required steps
    if (currentStepData?.required) {
      return false;
    }
    
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
