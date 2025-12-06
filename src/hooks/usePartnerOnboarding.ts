import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetTab?: "social" | "events" | "gallery" | "scanner" | "stats" | "profile";
  targetElement?: string;
  action?: "navigate" | "highlight" | "form" | "upload";
  requiresAction?: boolean;
  position?: "center" | "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a StudentsLife! 🎉",
    description: "Te guiaremos paso a paso para configurar tu perfil de socio y empezar a conectar con miles de estudiantes. ¡Este tutorial solo tomará unos minutos!",
    position: "center",
  },
  {
    id: "profile-intro",
    title: "Primero, tu Perfil Empresarial",
    description: "Vamos a configurar tu perfil. Los estudiantes verán esta información cuando busquen socios en la app. ¡Hagamos que destaque!",
    targetTab: "profile",
    position: "center",
  },
  {
    id: "profile-photo",
    title: "📷 Sube tu Logo o Foto de Perfil",
    description: "Una imagen vale más que mil palabras. Sube el logo de tu negocio o una foto profesional que represente tu marca.",
    targetTab: "profile",
    targetElement: "profile-photo-upload",
    action: "upload",
    requiresAction: false,
    position: "top",
  },
  {
    id: "cover-photo",
    title: "🖼️ Foto de Portada Espectacular",
    description: "La foto de portada es lo primero que verán los estudiantes. Sube una imagen atractiva de tu local, productos o servicio.",
    targetTab: "profile",
    targetElement: "cover-photo-upload",
    action: "upload",
    requiresAction: false,
    position: "top",
  },
  {
    id: "business-data",
    title: "📝 Datos de tu Negocio",
    description: "Completa la información de tu empresa: nombre, dirección, teléfono y categoría. Esto ayudará a los estudiantes a encontrarte.",
    targetTab: "profile",
    targetElement: "business-form",
    action: "form",
    requiresAction: false,
    position: "top",
  },
  {
    id: "gallery-photos",
    title: "📸 Galería de Fotos",
    description: "Sube al menos 4 fotos de tu local, productos o servicios. Las galerías atractivas aumentan las visitas un 80%.",
    targetTab: "gallery",
    action: "navigate",
    position: "center",
  },
  {
    id: "gallery-upload",
    title: "¡Añade tus mejores fotos!",
    description: "Haz clic en el botón + para subir fotos. Muestra tu ambiente, productos estrella y lo que te hace especial.",
    targetTab: "gallery",
    targetElement: "gallery-upload-btn",
    action: "highlight",
    requiresAction: false,
    position: "bottom",
  },
  {
    id: "events-intro",
    title: "🏷️ ¡Hora de crear tu primer Descuento!",
    description: "Los descuentos son la mejor forma de atraer estudiantes. Vamos a la sección de descuentos para crear tu primera oferta.",
    targetTab: "events",
    action: "navigate",
    position: "center",
  },
  {
    id: "create-discount",
    title: "Crea tu Primer Descuento",
    description: "Pulsa 'Crear Nuevo Descuento' para configurar tu primera oferta. Define el porcentaje, fechas y añade una imagen atractiva.",
    targetTab: "events",
    targetElement: "create-event-btn",
    action: "highlight",
    requiresAction: false,
    position: "bottom",
  },
  {
    id: "loyalty-card",
    title: "💳 Tarjeta de Fidelidad",
    description: "¿Quieres fidelizar clientes? Activa la tarjeta de fidelidad. Los estudiantes acumularán sellos con cada visita y ganarán premios.",
    targetTab: "events",
    targetElement: "loyalty-card-section",
    action: "highlight",
    requiresAction: false,
    position: "top",
  },
  {
    id: "stats-intro",
    title: "📊 Estadísticas en Tiempo Real",
    description: "Vamos a ver la sección de estadísticas donde podrás monitorear el rendimiento de tu negocio.",
    targetTab: "stats",
    action: "navigate",
    position: "center",
  },
  {
    id: "stats-explain",
    title: "Métricas Importantes",
    description: "Aquí verás: eventos activos, QR descargados, QR utilizados, tu calificación promedio y tasa de uso. ¡Datos para tomar mejores decisiones!",
    targetTab: "stats",
    targetElement: "stats-cards",
    action: "highlight",
    position: "top",
  },
  {
    id: "complete",
    title: "🎊 ¡Felicidades! Tutorial Completado",
    description: "Ya conoces todas las herramientas. Ahora configura tu perfil, crea descuentos irresistibles y conecta con miles de estudiantes. ¡Éxito!",
    position: "center",
  },
];

export const usePartnerOnboarding = (userId: string | undefined) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if onboarding was completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Check localStorage first (faster)
      const localCompleted = localStorage.getItem(`partner_onboarding_${userId}`);
      if (localCompleted === "completed") {
        setIsOnboardingActive(false);
        setIsLoading(false);
        return;
      }

      // If not in localStorage, show onboarding
      setIsOnboardingActive(true);
      setIsLoading(false);
    };

    checkOnboardingStatus();
  }, [userId]);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(() => {
    if (userId) {
      localStorage.setItem(`partner_onboarding_${userId}`, "completed");
    }
    setIsOnboardingActive(false);
  }, [userId]);

  const resetOnboarding = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`partner_onboarding_${userId}`);
    }
    setCurrentStep(0);
    setIsOnboardingActive(true);
  }, [userId]);

  const getCurrentStep = (): OnboardingStep => {
    return ONBOARDING_STEPS[currentStep];
  };

  const getProgress = (): number => {
    return ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  };

  return {
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    isOnboardingActive,
    isLoading,
    steps: ONBOARDING_STEPS,
    getCurrentStep,
    getProgress,
    nextStep,
    prevStep,
    completeOnboarding,
    resetOnboarding,
    setCurrentStep,
  };
};
