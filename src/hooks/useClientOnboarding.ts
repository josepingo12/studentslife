import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientOnboardingStep {
  id: string;
  title: string;
  description: string;
  targetTab?: "social" | "partners" | "chats";
  checkField?: string;
  position?: "center" | "top" | "bottom";
}

export interface ClientProfileCompletion {
  hasProfilePhoto: boolean;
  hasCoverPhoto: boolean;
}

const ONBOARDING_STEPS: ClientOnboardingStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a StudentsLife! 🎉",
    description: "Te guiaremos para sacar el máximo provecho de la app. ¡Solo unos segundos!",
    position: "center",
  },
  {
    id: "profile-photo",
    title: "📷 Tu Foto de Perfil",
    description: "Sube una foto para que otros te reconozcan. ¡Haz clic en tu avatar en la esquina superior!",
    targetTab: "social",
    checkField: "hasProfilePhoto",
    position: "top",
  },
  {
    id: "cover-photo",
    title: "🖼️ Tu Foto de Portada",
    description: "Personaliza tu perfil con una portada. Ve a tu perfil haciendo clic en tu avatar.",
    targetTab: "social",
    checkField: "hasCoverPhoto",
    position: "top",
  },
  {
    id: "discover-partners",
    title: "🏪 Descubre Negocios",
    description: "En la pestaña 'Socios' encontrarás todos los locales con descuentos exclusivos para estudiantes.",
    targetTab: "partners",
    position: "bottom",
  },
  {
    id: "download-discounts",
    title: "🏷️ Descarga Descuentos",
    description: "Entra en cualquier local, busca eventos activos y descarga el QR. ¡Muéstralo para obtener tu descuento!",
    targetTab: "partners",
    position: "center",
  },
  {
    id: "wallet",
    title: "💼 Tu Wallet",
    description: "Todos tus QR descargados están en el Wallet (ícono de monedero). ¡Acceso rápido a tus descuentos!",
    targetTab: "partners",
    position: "top",
  },
  {
    id: "loyalty-cards",
    title: "🎁 Tarjetas de Fidelidad",
    description: "Al escanear QR de partners, acumulas sellos. ¡Al completar 10, ganas premios gratis!",
    targetTab: "partners",
    position: "top",
  },
  {
    id: "social-feed",
    title: "📱 Feed Social",
    description: "Comparte fotos y videos con la comunidad estudiantil. ¡Haz clic en + para publicar!",
    targetTab: "social",
    position: "center",
  },
  {
    id: "stories",
    title: "📖 Historias",
    description: "Las historias desaparecen en 24h. ¡Comparte tus mejores momentos!",
    targetTab: "social",
    position: "top",
  },
  {
    id: "chat",
    title: "💬 Chat",
    description: "Envía mensajes a otros usuarios y partners. ¡Conecta con la comunidad!",
    targetTab: "chats",
    position: "bottom",
  },
  {
    id: "complete",
    title: "🎊 ¡Todo Listo!",
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
    const isFirstTime = !localStorage.getItem(`client_onboarding_started_${userId}`);
    const wasCompleted = localStorage.getItem(`client_onboarding_completed_${userId}`);
    
    // If already completed, don't show again
    if (wasCompleted) {
      return [];
    }
    
    // If first time, show all steps
    if (isFirstTime) {
      localStorage.setItem(`client_onboarding_started_${userId}`, "true");
      return ONBOARDING_STEPS;
    }

    // If returning user, only show missing profile steps
    const missingSteps: ClientOnboardingStep[] = [];
    
    if (!completion.hasProfilePhoto) {
      missingSteps.push(ONBOARDING_STEPS.find(s => s.id === "profile-photo")!);
    }
    if (!completion.hasCoverPhoto) {
      missingSteps.push(ONBOARDING_STEPS.find(s => s.id === "cover-photo")!);
    }

    return missingSteps;
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
      const currentStepData = steps[currentStep];
      if (currentStepData?.checkField) {
        const isNowComplete = completion[currentStepData.checkField as keyof ClientProfileCompletion];
        if (isNowComplete && currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }
    }
  }, [checkProfileCompletion, currentStep, steps]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
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
  }, [currentStep, steps.length, completeOnboarding]);

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
  };
};
