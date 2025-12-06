import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetTab?: "social" | "events" | "gallery" | "scanner" | "stats" | "profile";
  checkField?: string;
  position?: "center" | "top" | "bottom";
}

export interface ProfileCompletion {
  hasProfilePhoto: boolean;
  hasCoverPhoto: boolean;
  hasBusinessName: boolean;
  hasBusinessAddress: boolean;
  hasBusinessCategory: boolean;
  hasGalleryPhotos: boolean;
  hasEvents: boolean;
  galleryCount: number;
  eventsCount: number;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a StudentsLife! 🎉",
    description: "Te guiaremos paso a paso para configurar tu perfil. ¡Solo tomará unos minutos!",
    position: "center",
  },
  {
    id: "profile-photo",
    title: "📷 Sube tu Logo o Foto de Perfil",
    description: "Los estudiantes te reconocerán por esta imagen. ¡Haz clic en el área de foto para subirla!",
    targetTab: "profile",
    checkField: "hasProfilePhoto",
    position: "top",
  },
  {
    id: "cover-photo",
    title: "🖼️ Foto de Portada",
    description: "Una portada atractiva aumenta las visitas. ¡Sube una imagen de tu local o productos!",
    targetTab: "profile",
    checkField: "hasCoverPhoto",
    position: "top",
  },
  {
    id: "business-data",
    title: "📝 Completa tus Datos",
    description: "Nombre del negocio, dirección y categoría son esenciales para que te encuentren.",
    targetTab: "profile",
    checkField: "hasBusinessName",
    position: "top",
  },
  {
    id: "gallery-photos",
    title: "📸 Añade Fotos a tu Galería",
    description: "Sube al menos 2 fotos de tu local. ¡Las galerías aumentan las visitas un 80%!",
    targetTab: "gallery",
    checkField: "hasGalleryPhotos",
    position: "center",
  },
  {
    id: "create-discount",
    title: "🏷️ Crea tu Primer Descuento",
    description: "Los descuentos atraen estudiantes. ¡Crea tu primera oferta ahora!",
    targetTab: "events",
    checkField: "hasEvents",
    position: "center",
  },
  {
    id: "complete",
    title: "🎊 ¡Perfil Completado!",
    description: "Ya estás listo para conectar con miles de estudiantes. ¡Éxito!",
    position: "center",
  },
];

export const usePartnerOnboarding = (userId: string | undefined) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [missingSteps, setMissingSteps] = useState<OnboardingStep[]>([]);

  // Check profile completion status
  const checkProfileCompletion = useCallback(async () => {
    if (!userId) return null;

    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Get gallery count
    const { count: galleryCount } = await supabase
      .from("gallery")
      .select("*", { count: "exact", head: true })
      .eq("partner_id", userId);

    // Get events count
    const { count: eventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("partner_id", userId);

    const completion: ProfileCompletion = {
      hasProfilePhoto: !!profile?.profile_image_url,
      hasCoverPhoto: !!profile?.cover_image_url,
      hasBusinessName: !!profile?.business_name?.trim(),
      hasBusinessAddress: !!profile?.business_address?.trim(),
      hasBusinessCategory: !!profile?.business_category?.trim(),
      hasGalleryPhotos: (galleryCount || 0) >= 2,
      hasEvents: (eventsCount || 0) >= 1,
      galleryCount: galleryCount || 0,
      eventsCount: eventsCount || 0,
    };

    setProfileCompletion(completion);
    return completion;
  }, [userId]);

  // Determine which steps are missing
  const calculateMissingSteps = useCallback((completion: ProfileCompletion) => {
    const missing: OnboardingStep[] = [];

    // Always start with welcome if first time
    const isFirstTime = !localStorage.getItem(`partner_onboarding_started_${userId}`);
    if (isFirstTime) {
      missing.push(ONBOARDING_STEPS[0]); // welcome
      localStorage.setItem(`partner_onboarding_started_${userId}`, "true");
    }

    // Check each step that has a checkField
    ONBOARDING_STEPS.forEach((step) => {
      if (step.checkField) {
        const isComplete = completion[step.checkField as keyof ProfileCompletion];
        if (!isComplete) {
          missing.push(step);
        }
      }
    });

    // If nothing is missing and user has seen welcome, add complete step
    if (missing.length === 0 || (missing.length === 1 && missing[0].id === "welcome")) {
      // Check if already completed before
      const wasCompleted = localStorage.getItem(`partner_onboarding_completed_${userId}`);
      if (!wasCompleted && missing.length > 0) {
        missing.push(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1]); // complete
      }
    }

    return missing;
  }, [userId]);

  // Initialize and check status
  useEffect(() => {
    const init = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const completion = await checkProfileCompletion();
      if (completion) {
        const missing = calculateMissingSteps(completion);
        setMissingSteps(missing);
        setIsOnboardingActive(missing.length > 0);
      }
      setIsLoading(false);
    };

    init();
  }, [userId, checkProfileCompletion, calculateMissingSteps]);

  // Refresh completion status
  const refreshCompletion = useCallback(async () => {
    const completion = await checkProfileCompletion();
    if (completion) {
      const missing = calculateMissingSteps(completion);
      setMissingSteps(missing);
      
      // Auto-advance if current step is now complete
      if (missing.length > 0) {
        const currentStepData = missingSteps[currentStep];
        if (currentStepData?.checkField) {
          const isNowComplete = completion[currentStepData.checkField as keyof ProfileCompletion];
          if (isNowComplete) {
            // Move to next step
            if (currentStep < missing.length - 1) {
              setCurrentStep(currentStep + 1);
            }
          }
        }
      }

      if (missing.length === 0) {
        setIsOnboardingActive(false);
      }
    }
  }, [checkProfileCompletion, calculateMissingSteps, currentStep, missingSteps]);

  const nextStep = useCallback(() => {
    if (currentStep < missingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, missingSteps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(() => {
    if (userId) {
      localStorage.setItem(`partner_onboarding_completed_${userId}`, "true");
    }
    setIsOnboardingActive(false);
  }, [userId]);

  const skipCurrentStep = useCallback(() => {
    if (currentStep < missingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, missingSteps.length, completeOnboarding]);

  const getCurrentStep = (): OnboardingStep | null => {
    return missingSteps[currentStep] || null;
  };

  const getProgress = (): number => {
    if (missingSteps.length === 0) return 100;
    return ((currentStep + 1) / missingSteps.length) * 100;
  };

  return {
    currentStep,
    totalSteps: missingSteps.length,
    isOnboardingActive,
    isLoading,
    steps: missingSteps,
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
