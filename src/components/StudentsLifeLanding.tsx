import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import screen1 from '@/assets/screen1.jpeg';
import screen2 from '@/assets/screen2.jpeg';
import headerVideo from '@/assets/header_video.mp4';
import headerMobile from '@/assets/header-mobile.png';
import robotoAvatar from '@/assets/roboto.png';
import appleStoreIcon from '@/assets/apple_store_icon.png';
import playstoreIcon from '@/assets/playstore_icon.png';
// Aggiungi dopo gli import esistenti
import belinnails from '@/assets/belinnails.jpg';
import elote from '@/assets/elote.jpg';
import viajeserasmus from '@/assets/viajeserasmus.jpg';
import five from '@/assets/five.jpg';
import barbercornervalladolid from '@/assets/barbercornervalladolid.jpg';
import marciasburger from '@/assets/marciasburger.jpg';
import exxencia from '@/assets/exxencia.jpg';
import totoink from '@/assets/totoink.jpg';
import amasia from '@/assets/amasia.jpg';
import purtocanalla from '@/assets/purtocanalla.jpg';
import secreto from '@/assets/secreto.jpg';
import aperitivo from '@/assets/aperitivo.jpg';
import s20 from '@/assets/s20.jpg';
import juanita from '@/assets/juanita.png';
import tenTen from '@/assets/10y10.png';
import malquerida from '@/assets/malquerida.png';
import unnamed from '@/assets/unnamed.png';
import bacterio from '@/assets/bacterio.jpg';

// Array dei partner con i loghi
const partners = [
{ name: "Belinnails", logo: belinnails },
{ name: "Elote", logo: elote },
{ name: "Viajes Erasmus Valladolid", logo: viajeserasmus },
{ name: "Five", logo: five },
{ name: "Barber Corner Valladolid", logo: barbercornervalladolid },
{ name: "Marcias Burger", logo: marciasburger },
{ name: "Exxencia Ibericos", logo: exxencia },
{ name: "Tato Ink", logo: totoink },
{ name: "Amasia Gyros", logo: amasia },
{ name: "Purto Canalla", logo: purtocanalla },
{ name: "Secreto", logo: secreto },
{ name: "Aperitivo", logo: aperitivo },
{ name: "S20", logo: s20 },
{ name: "Juanita Calamidad", logo: juanita },
{ name: "10y10", logo: tenTen },
{ name: "Malquerida", logo: malquerida },
{ name: "Unnamed", logo: unnamed },
{ name: "Bacterio", logo: bacterio }
];
const StudentsLifeLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [deviceType, setDeviceType] = useState<'ios' | 'android'>('ios');
  
  // Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: '¡Hola! Soy el asistente de StudentsLife. ¿En qué puedo ayudarte?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [clickedPartners, setClickedPartners] = useState<Set<string>>(new Set());
  
  const handlePartnerLogoClick = (partnerName: string) => {
  setClickedPartners(prev => {
    const newSet = new Set(prev);
    if (newSet.has(partnerName)) {
      newSet.delete(partnerName); // Se già cliccato, rimuovi (torna grigio)
    } else {
      newSet.add(partnerName); // Se non cliccato, aggiungi (diventa colorato)
    }
    return newSet;
  });
};

  
  // Preguntas predefinidas
  const predefinedQuestions = [
    "¿Qué es StudentsLife?",
    "¿Cómo funcionan los descuentos?",
    "¿Es gratis para estudiantes?",
    "¿Qué servicios incluye?",
    "¿Cómo me registro?",
    "¿Cuánto cuesta para partners?",
    "¿Hay app móvil?",
    "¿Funciona en Valladolid?"
  ];

  // Respuestas automáticas
  const getAutomaticResponse = (question: string): string => {
    const responses: { [key: string]: string } = {
      "¿Qué es StudentsLife?": "StudentsLife es la plataforma líder que conecta estudiantes Erasmus en Valladolid con descuentos exclusivos, red social y chat integrado. ¡Todo en una app! 🎓",
      "¿Cómo funcionan los descuentos?": "Súper fácil: 1️⃣ Encuentra el partner en la app 2️⃣ Genera tu código QR personalizado 3️⃣ Muéstralo en el comercio y ahorra hasta 30% 💰",
      "¿Es gratis para estudiantes?": "¡Completamente GRATIS para estudiantes! Solo paga el partner que quiere ofrecer descuentos. Tú solo disfrutas y ahorras 🎉",
      "¿Qué servicios incluye?": "Incluye: 🍕 Restaurantes y bares 💄 Belleza y bienestar 🎮 Entretenimiento 📱 Electrónica 💪 Sport & fitness 🛍️ Shopping ✈️ Viajes",
      "¿Cómo me registro?": "¡Facilísimo! Solo haz clic en 'Registrarse como Estudiante', completa tus datos y ya puedes empezar a ahorrar. ¡Toma menos de 2 minutos! ⚡",
      "¿Cuánto cuesta para partners?": "Para partners: €19.99/mes los primeros 50, después €29.99/mes. ¡Pero ahora tenemos oferta de lanzamiento con primer mes GRATIS! 🎁",
      "¿Hay app móvil?": "¡Sí! Es una PWA (Progressive Web App) que funciona como app nativa. Puedes añadirla a tu pantalla de inicio desde el navegador 📱",
      "¿Funciona en Valladolid?": "¡Exacto! Estamos especializados en Valladolid para estudiantes Erasmus. Conocemos todos los mejores lugares de la ciudad 🏛️"
    };
    
    return responses[question] || "¡Excelente pregunta! Nuestro equipo te responderá pronto. Mientras tanto, puedes contactarnos al +34 672 908 898 📞";
  };

  // Array delle screenshot
  const screenshots = [
    {
      src: screen1,
      alt: "StudentsLife App - Pantalla Principal",
      title: "Descubre Partners",
      description: "Explora categorías y encuentra los mejores descuentos"
    },
    {
      src: screen2,
      alt: "StudentsLife App - Chat y Social",
      title: "Conecta y Chatea",
      description: "Red social integrada con chat para partners y amigos"
    }
  ];

  // Tutorial steps
  const iosSteps = [
    {
      title: "Paso 1: Abre Safari",
      description: "Visita studentslife.es en Safari",
      icon: "🌐",
      animation: "bounce"
    },
    {
      title: "Paso 2: Toca el botón Compartir",
      description: "Presiona el icono de compartir en la parte inferior",
      icon: "📤",
      animation: "pulse"
    },
    {
      title: "Paso 3: Añadir a Inicio",
      description: "Selecciona 'Añadir a pantalla de inicio'",
      icon: "📱",
      animation: "bounce"
    },
    {
      title: "¡Listo!",
      description: "Ya tienes StudentsLife en tu pantalla de inicio",
      icon: "✅",
      animation: "tada"
    }
  ];

  const androidSteps = [
    {
      title: "Paso 1: Abre Chrome",
      description: "Visita studentslife.es en Google Chrome",
      icon: "🌐",
      animation: "bounce"
    },
    {
      title: "Paso 2: Menú de opciones",
      description: "Toca los tres puntos en la esquina superior derecha",
      icon: "⋮",
      animation: "pulse"
    },
    {
      title: "Paso 3: Añadir a Inicio",
      description: "Selecciona 'Añadir a pantalla de inicio'",
      icon: "📱",
      animation: "bounce"
    },
    {
      title: "¡Perfecto!",
      description: "StudentsLife está ahora en tu pantalla de inicio",
      icon: "✅",
      animation: "tada"
    }
  ];

  useEffect(() => {
    // Auto-slide del carousel
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
    }, 4000);

    // Tutorial auto-advance
    let tutorialInterval: NodeJS.Timeout;
    if (showTutorial) {
      tutorialInterval = setInterval(() => {
        setTutorialStep((prev) => {
          const steps = deviceType === 'ios' ? iosSteps : androidSteps;
          return (prev + 1) % steps.length;
        });
      }, 3000);
    }


    // Animazioni iOS-style fluide
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          setTimeout(() => {
            target.style.opacity = '1';
            target.style.transform = 'translateY(0) scale(1)';
          }, index * 100);
        }
      });
    }, observerOptions);

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const heroImage = document.querySelector('.hero-bg') as HTMLElement;
      const isMobile = window.innerWidth < 768;
      
      if (heroImage && !isMobile) {
        heroImage.style.transform = `translateY(${scrolled * 0.2}px)`;
      }

      if (!isMobile) {
        const cards = document.querySelectorAll('.floating-element');
        cards.forEach((card, index) => {
          const element = card as HTMLElement;
          const speed = 0.3 + (index * 0.1);
          element.style.transform = `translateY(${Math.sin(scrolled * 0.005 + index) * speed}px)`;
        });
      }
    };

    const animatedElements = document.querySelectorAll('.animate-fade-in');
    animatedElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px) scale(0.95)';
      element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(element);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearInterval(slideInterval);
      if (tutorialInterval) clearInterval(tutorialInterval);
    };
  }, [screenshots.length, showTutorial, deviceType]);

// PWA Install Prompt - Aggiungi dopo tutti gli useEffect esistenti
useEffect(() => {
  // PWA Install Logic
  let deferredPrompt;
  let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  let isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  // Android - Prompt automatico
  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(showInstallPrompt, 3000);
  };

  // iOS - Istruzioni manuali in spagnolo
  const showIOSInstallInstructions = () => {
    if (document.querySelector('.ios-install-prompt')) return; // Evita duplicati

    const installPrompt = document.createElement('div');
    installPrompt.className = 'ios-install-prompt';
    installPrompt.innerHTML = `
      <div class="install-header">
        <img src="/logo.png" alt="StudentsLife" class="install-logo">
        <h3>¡Instala StudentsLife!</h3>
        <button class="close-btn" onclick="this.closest('.ios-install-prompt').remove()">×</button>
      </div>
      <div class="install-steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <p>Toca el botón <strong>Compartir</strong></p>
            <div class="share-icon">📤</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <p>Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
            <div class="home-icon">📱</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <p>Confirma tocando <strong>"Añadir"</strong></p>
            <div class="check-icon">✅</div>
          </div>
        </div>
      </div>
      <div class="install-benefits">
        <p>🚀 Acceso rápido • 📱 Como app nativa • 🔔 Notificaciones</p>
      </div>
      <div class="install-footer">
        <button class="install-later" onclick="this.closest('.ios-install-prompt').remove()">
          Más tarde
        </button>
      </div>
    `;
    document.body.appendChild(installPrompt);
  };

  // Android - Prompt nativo
  const showAndroidInstallPrompt = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        deferredPrompt = null;
      });
    }
  };

  // Función principal
  const showInstallPrompt = () => {
    if (isStandalone) return; // Ya está instalada

    if (isIOS) {
      showIOSInstallInstructions();
    } else if (deferredPrompt) {
      showAndroidInstallPrompt();
    }
  };

  // Event listeners
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  // Auto-trigger dopo 3 secondi
  const installTimer = setTimeout(showInstallPrompt, 3000);

  // Cleanup
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    clearTimeout(installTimer);
  };
}, []);


  const handleRegisterClick = () => navigate('/register-client');
  const handlePartnerClick = () => navigate('/register-partner');
  const handleLoginClick = () => navigate('/login');

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const openTutorial = (type: 'ios' | 'android') => {
    setDeviceType(type);
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
  };

  const handleQuestionClick = (question: string) => {
    setChatMessages(prev => [...prev, { type: 'user', text: question }]);
    
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { type: 'bot', text: getAutomaticResponse(question) }]);
    }, 1500);
  };

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Floating Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChatbot}
          className="w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-pulse"
        >
          <img 
            src={robotoAvatar}
            alt="Chat Assistant" 
            className="w-12 h-12 rounded-full border-2 border-white"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </button>
      </div>

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={robotoAvatar} className="w-10 h-10 rounded-full border-2 border-white mr-3" />
                  <div>
                    <h3 className="font-bold">StudentsLife Assistant</h3>
                    <p className="text-xs opacity-90">● En línea</p>
                  </div>
                </div>
                <button 
                  onClick={toggleChatbot}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 bg-gray-50">
              {chatMessages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-xs px-4 py-2 rounded-2xl ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                  }`}>
                    {message.type === 'bot' && (
                      <div className="flex items-center mb-1">
                        <img src={robotoAvatar} className="w-4 h-4 rounded-full mr-2" />
                        <span className="text-xs text-gray-500">Bot</span>
                      </div>
                    )}
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="text-left mb-4">
                  <div className="inline-block bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                    <div className="flex items-center">
                      <img src={robotoAvatar} className="w-4 h-4 rounded-full mr-2" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Predefined Questions */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-600 mb-3">Preguntas frecuentes:</p>
              <div className="grid grid-cols-2 gap-2">
                {predefinedQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors text-left"
                  >
                    {question}
                  </button>
                ))}
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                {predefinedQuestions.slice(4, 8).map((question, index) => (
                  <button
                    key={index + 4}
                    onClick={() => handleQuestionClick(question)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors text-left"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

   {/* Hero Section */}
<header className="relative h-screen flex items-center justify-center overflow-hidden" ref={heroRef}>
  <div className="hero-bg absolute inset-0 w-full h-full">
    <video 
      src={headerVideo}
      autoPlay
      muted
      loop
      playsInline
      className="hidden sm:block w-full h-full object-cover object-center"
    />
    <img 
      src={headerMobile}
      alt="StudentsLife Header Mobile" 
      className="block sm:hidden w-full h-full object-cover object-center"
    />
  </div>
</header>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">
                Añadir a Pantalla de Inicio
              </h3>
              <p className="opacity-90">
                {deviceType === 'ios' ? 'Para iPhone/iPad' : 'Para Android'}
              </p>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`text-6xl mb-4 animate-${(deviceType === 'ios' ? iosSteps : androidSteps)[tutorialStep].animation}`}>
                  {(deviceType === 'ios' ? iosSteps : androidSteps)[tutorialStep].icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {(deviceType === 'ios' ? iosSteps : androidSteps)[tutorialStep].title}
                </h4>
                <p className="text-gray-600">
                  {(deviceType === 'ios' ? iosSteps : androidSteps)[tutorialStep].description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Progreso</span>
                  <span>{tutorialStep + 1}/{(deviceType === 'ios' ? iosSteps : androidSteps).length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((tutorialStep + 1) / (deviceType === 'ios' ? iosSteps : androidSteps).length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-center space-x-2 mb-6">
                {(deviceType === 'ios' ? iosSteps : androidSteps).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setTutorialStep(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === tutorialStep 
                        ? 'bg-blue-500 w-6' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={closeTutorial}
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => setTutorialStep((prev) => (prev + 1) % (deviceType === 'ios' ? iosSteps : androidSteps).length)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                >
                  {tutorialStep === (deviceType === 'ios' ? iosSteps : androidSteps).length - 1 ? 'Reiniciar' : 'Siguiente'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section - Bianco e Azzurro */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-6 py-2 rounded-full font-semibold mb-6">
              🎉 ¡Oferta de Lanzamiento!
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Para Estudiantes: ¡GRATIS!
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">
              Los estudiantes nunca pagan. Solo los partners que quieren ofrecer descuentos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 animate-fade-in mb-16">
            {/* Plan Estudiantes */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-200 transform hover:scale-105 transition-all duration-300 floating-element">
              <div className="text-center">
                <div className="text-6xl mb-6">🎓</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Estudiantes</h3>
                <div className="text-5xl font-black mb-2 text-blue-600">GRATIS</div>
                <p className="text-blue-600 mb-8">Siempre y para siempre</p>
                
                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Acceso a todos los descuentos</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Red social integrada</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Chat con partners y amigos</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Códigos QR ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Soporte 24/7</span>
                  </li>
                </ul>

                <Button
                  onClick={handleRegisterClick}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full text-lg font-bold transform hover:scale-105 transition-all duration-300"
                >
                  Registrarse Gratis
                </Button>
              </div>
            </div>

            {/* Plan Partners */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-200 transform hover:scale-105 transition-all duration-300 floating-element">
              <div className="text-center">
                <div className="text-6xl mb-6">🏪</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Para Partners</h3>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">Primeros 50 Partners</div>
                  <div className="text-4xl font-black text-gray-900">€19.99<span className="text-lg font-normal">/mes</span></div>
                  <p className="text-blue-600 font-semibold">Después: €29.99/mes</p>
                </div>
                
                <div className="bg-blue-100 border border-blue-300 rounded-2xl p-4 mb-8">
                  <div className="text-blue-800 font-bold mb-2">🎁 ¡Oferta Especial!</div>
                  <p className="text-blue-700 text-sm">Regístrate ahora y obtén:</p>
                  <p className="text-blue-800 font-bold">Primer mes GRATIS + €10 descuento/mes</p>
                </div>

                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Panel de control completo</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Gestión de descuentos</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Chat directo con estudiantes</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Estadísticas detalladas</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-2xl mr-3 text-blue-500">✅</span>
                    <span>Promoción en la app</span>
                  </li>
                </ul>

                <Button
                  onClick={handlePartnerClick}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full text-lg font-bold transform hover:scale-105 transition-all duration-300"
                >
                  Registrarse como Partner
                </Button>
              </div>
            </div>
          </div>

          {/* Launch Offer Banner - Bianco e Azzurro */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-2xl p-8 text-center text-white animate-fade-in">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              🚀 Antes del Lanzamiento Oficial
            </h3>
            <p className="text-lg sm:text-xl mb-6 opacity-90">
              La app será completamente GRATUITA para todos durante el período de prueba
            </p>
            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-2">Para Estudiantes</h4>
                <p className="text-blue-100">Acceso anticipado gratuito + beneficios exclusivos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-2">Para Partners</h4>
                <p className="text-blue-100">Período de prueba gratuito + descuento permanente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

  {/* App Download Section - Sostituisce la sezione precedente */}
<section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
  <div className="max-w-6xl mx-auto px-4 sm:px-6">
    <div className="text-center mb-12 sm:mb-16 animate-fade-in">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
        Descarga la App StudentsLife
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 px-4">
        Disponible en iOS y Android - Acceso rápido desde tu pantalla principal
      </p>
    </div>

    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* App Store Buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-12">
        <a 
          href="#" 
          className="transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
        >
          <img 
            src={appleStoreIcon} 
            alt="Download on the App Store" 
            className="h-16 sm:h-20 w-auto rounded-xl shadow-lg"
          />
        </a>
        <a 
          href="#" 
          className="transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
        >
          <img 
            src={playstoreIcon} 
            alt="Get it on Google Play" 
            className="h-16 sm:h-20 w-auto rounded-xl shadow-lg"
          />
        </a>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center floating-element">
          <div className="text-3xl mb-4">⚡</div>
          <h4 className="font-bold text-gray-900 mb-2">Acceso Instantáneo</h4>
          <p className="text-gray-600 text-sm">Un toque y ya estás dentro de la app</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center floating-element">
          <div className="text-3xl mb-4">📱</div>
          <h4 className="font-bold text-gray-900 mb-2">Experiencia Nativa</h4>
          <p className="text-gray-600 text-sm">Interfaz optimizada para móvil</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center floating-element">
          <div className="text-3xl mb-4">🔔</div>
          <h4 className="font-bold text-gray-900 mb-2">Notificaciones Push</h4>
          <p className="text-gray-600 text-sm">Recibe actualizaciones en tiempo real</p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">
            🚀 ¡Descarga Ahora y Empieza a Ahorrar!
          </h3>
          <p className="text-lg opacity-90 mb-6">
            Únete a miles de estudiantes que ya ahorran con StudentsLife
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📱</span>
              <span>Disponible en todos los dispositivos</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🆓</span>
              <span>Descarga gratuita</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* App Preview Carousel Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Vista Previa de la App
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">
              Descubre la interfaz moderna e intuitiva de StudentsLife
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center animate-fade-in">
            {/* Carousel */}
            <div className="relative floating-element order-2 lg:order-1">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 border border-gray-100 mx-auto max-w-sm sm:max-w-none">
                <div className="relative">
                  <div className="aspect-[9/16] bg-black rounded-2xl sm:rounded-3xl p-1 sm:p-2 shadow-inner">
                    <div className="relative w-full h-full bg-white rounded-xl sm:rounded-2xl overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-6 sm:h-8 bg-black rounded-t-xl sm:rounded-t-2xl flex items-center justify-center">
                        <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-white rounded-full"></div>
                      </div>
                      
                      <div className="relative w-full h-full pt-6 sm:pt-8 overflow-hidden">
                        <div 
                          className="flex transition-transform duration-500 ease-in-out h-full"
                          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                          {screenshots.map((screenshot, index) => (
                            <div key={index} className="w-full h-full flex-shrink-0">
                              <img 
                                src={screenshot.src}
                                alt={screenshot.alt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={prevSlide}
                    className="hidden sm:flex absolute left-1 lg:left-2 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-gray-600 text-sm lg:text-lg">‹</span>
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="hidden sm:flex absolute right-1 lg:right-2 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-gray-600 text-sm lg:text-lg">›</span>
                  </button>
                </div>
                
                <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-blue-500 w-4 sm:w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="absolute -inset-2 sm:-inset-4 bg-blue-400/10 sm:bg-blue-400/20 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl opacity-50"></div>
            </div>

            <div className="space-y-6 sm:space-y-8 order-1 lg:order-2 px-4 sm:px-0">
              <div className="animate-fade-in text-center lg:text-left">
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                  {screenshots[currentSlide].title}
                </h3>
                <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                  {screenshots[currentSlide].description}
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                {appFeatures.map((feature, index) => (
                  <AppFeatureItem key={index} {...feature} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 sm:mb-6">
              Todo lo que necesitas
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Una plataforma completa que revoluciona la experiencia de los estudiantes Erasmus en Valladolid
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20 lg:mb-24">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>

          <div className="animate-fade-in mb-16 sm:mb-20 lg:mb-24">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12 sm:mb-16">
              Categorías Disponibles
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 sm:gap-6">
              {categories.map((category, index) => (
                <CategoryCard key={index} {...category} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

{/* Partners Section - Carosello Semplice */}
<section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
    <div className="animate-fade-in">
      <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
        Partners con Descuentos
      </h3>
      <p className="text-lg sm:text-xl text-gray-600 mb-12 sm:mb-16 max-w-3xl mx-auto px-4">
        Comercios locales que ofrecen descuentos exclusivos a estudiantes Erasmus
      </p>
      
      {/* Partners Carousel ANIMATO */}
      <div className="relative overflow-hidden mb-12">
        <div className="flex animate-scroll-left space-x-8 py-8">
          {/* Duplicamos el array per un loop infinito */}
          {[...partners, ...partners].map((partner, index) => {
            const isClicked = clickedPartners.has(partner.name);
            return (
              <button
                key={`${partner.name}-${index}`}
                onClick={() => handlePartnerLogoClick(partner.name)}
                onMouseEnter={() => handlePartnerLogoClick(partner.name)}
                className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-500 p-3 sm:p-4 flex items-center justify-center cursor-pointer"
              >
                <img 
                  src={partner.logo}
                  alt={partner.name}
                  className={`w-full h-full object-contain rounded-full transition-all duration-500 ${
                    isClicked ? 'grayscale-0 brightness-100' : 'grayscale brightness-75'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Partners Count - SOLO TOTALE */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mx-auto max-w-md">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {partners.length}+
        </div>
        <p className="text-gray-600">
          Partners verificados ofreciendo descuentos exclusivos
        </p>
      </div>
    </div>
  </div>
</section>

      {/* Contact Section - Bianco e Azzurro */}
<section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
  <div className="max-w-6xl mx-auto px-4 sm:px-6">
    <div className="text-center mb-12 sm:mb-16 animate-fade-in">
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">
        ¿Necesitas Ayuda?
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 px-4">
        Estamos aquí para ayudarte. Contáctanos por cualquier duda
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-8 sm:gap-12 animate-fade-in">
      {/* Contact Info */}
      <div className="space-y-8">
        <div className="text-center md:text-left">
          <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
            Ponte en Contacto
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Nuestro equipo está disponible para resolver todas tus dudas sobre StudentsLife
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1 text-gray-900">Teléfono</h4>
              <a 
                href="tel:+34672908898" 
                className="text-blue-600 hover:text-blue-700 transition-colors text-lg"
              >
                +34 672 908 898
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1 text-gray-900">Email</h4>
              <a 
                href="mailto:j.pingo.development@gmail.com" 
                className="text-blue-600 hover:text-blue-700 transition-colors text-lg break-all"
              >
                j.pingo.development@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1 text-gray-900">Horario</h4>
              <p className="text-gray-600">Lunes a Viernes: 9:00 - 18:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-200 shadow-xl">
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Envíanos un Mensaje
        </h3>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input 
              type="text" 
              className="w-full bg-blue-50 text-gray-900 px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input 
              type="email" 
              className="w-full bg-blue-50 text-gray-900 px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje
            </label>
            <textarea 
              rows={4}
              className="w-full bg-blue-50 text-gray-900 px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              placeholder="¿En qué podemos ayudarte?"
            />
          </div>

          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300">
            Enviar Mensaje
          </Button>
        </form>
      </div>
    </div>
  </div>
</section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            ¡Únete a StudentsLife!
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 px-4">
            Descubre Valladolid, ahorra dinero y conecta con otros estudiantes
          </p>
          
          <div className="flex flex-col gap-4 sm:gap-6 justify-center mb-8 sm:mb-12 px-4">
            <Button 
              onClick={handleRegisterClick}
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              📱 Registrarse como Estudiante
            </Button>
            <Button 
              onClick={handlePartnerClick}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              🏪 Registrarse como Partner
            </Button>
          </div>

          <button 
            onClick={handleLoginClick}
            className="text-blue-100 hover:text-white text-base sm:text-lg underline underline-offset-4 transition-all duration-300 px-4"
          >
            ¿Ya tienes cuenta? <span className="font-semibold">Inicia Sesión</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 sm:py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">StudentsLife</h3>
          <p className="text-gray-600 mb-6 sm:mb-8 px-4">
            Conectando estudiantes en Valladolid con los mejores descuentos y experiencias
          </p>
          {/* Social Media Icons */}
          <div className="flex justify-center space-x-6 mb-6">
            <a href="https://www.instagram.com/students.1ife/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors duration-300">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.715.01 3.655.045.92.035 1.78.18 2.445.42.66.25 1.127.535 1.57.97.443.44.728.91 1.003 1.57.24.665.385 1.525.42 2.445.035.94.045 1.225.045 3.655s-.01 2.715-.045 3.655c-.035.92-.18 1.78-.42 2.445-.25.66-.535 1.127-.97 1.57-.44.443-.91.728-1.57 1.003-.665.24-1.525.385-2.445.42-.94.035-1.225.045-3.655.045s-2.715-.01-3.655-.045c-.92-.035-1.78-.18-2.445-.42-.66-.25-1.127-.535-1.57-.97-.443-.44-.728-.91-1.003-1.57-.24-.665-.385-1.525-.42-2.445-.035-.94-.045-1.225-.045-3.655s.01-2.715.045-3.655c.035-.92.18-1.78.42-2.445.25-.66.535-1.127.97-1.57.44-.443.91-.728 1.57-1.003.665-.24 1.525-.385 2.445-.42.94-.035 1.225-.045 3.655-.045zm0-2c-2.747 0-3.085.01-4.122.05-.99.04-1.7.19-2.31.43-.63.24-1.17.56-1.61.99-.44.44-.76.98-1 .61-.24.63-.43 1.34-.47 2.33-.04 1.03-.05 1.37-.05 4.12s.01 3.08.05 4.12c.04.99.19 1.7.43 2.31.24.63.56 1.17.99 1.61.44.44.98.76 1.61 1 .63.24 1.34.43 2.31.47 1.03.04 1.37.05 4.12.05s3.08-.01 4.12-.05c.99-.04 1.7-.19 2.31-.43.63-.24 1.17-.56 1.61-.99.44-.44.76-.98 1-1.61.24-.63.43-1.34.47-2.31.04-1.03.05-1.37.05-4.12s-.01-3.08-.05-4.12c-.04-.99-.19-1.7-.43-2.31-.24-.63-.56-1.17-.99-1.61-.44-.44-.98-.76-1.61-1-.63-.24-1.34-.43-2.31-.47-1.03-.04-1.37-.05-4.12-.05zM12 7.77a4.23 4.23 0 100 8.46 4.23 4.23 0 000-8.46zM12 9.23a2.77 2.77 0 110 5.54 2.77 2.77 0 010-5.54zm5.725-4.63c0-.79-.64-1.43-1.43-1.43s-1.43.64-1.43 1.43c0 .79.64 1.43 1.43 1.43s1.43-.64 1.43-1.43z" clipRule="evenodd" />
              </svg>
            </a>
            {/* Add other social media icons here if needed */}
          </div>
          <p className="text-gray-400 text-sm sm:text-base">&copy; 2024 StudentsLife. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

// Componenti helper
const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  index: number;
}> = ({ icon, title, description, index }) => (
  <div 
    className="animate-fade-in bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg sm:shadow-xl border border-gray-100 hover:shadow-xl sm:hover:shadow-2xl transform hover:scale-105 transition-all duration-300 floating-element"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">{icon}</div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{description}</p>
  </div>
);

const CategoryCard: React.FC<{
  icon: string;
  name: string;
  color: string;
  index: number;
}> = ({ icon, name, color, index }) => (
  <div 
    className="animate-fade-in group cursor-pointer"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className={`bg-gradient-to-br ${color} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transform group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
      <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{icon}</div>
      <p className="text-white font-semibold text-xs sm:text-sm">{name}</p>
    </div>
  </div>
);

const AppFeatureItem: React.FC<{
  icon: string;
  title: string;
  description: string;
  index: number;
}> = ({ icon, title, description, index }) => (
  <div 
    className="flex items-start space-x-3 sm:space-x-4 group"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 text-lg sm:text-xl group-hover:scale-110 group-hover:bg-blue-200 transition-all duration-300">
      {icon}
    </div>
    <div>
      <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h4>
      <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{description}</p>
    </div>
  </div>
);

// Dati
const features = [
  {
    icon: "💰",
    title: "Descuentos Exclusivos",
    description: "Accede a ofertas especiales de partners locales con códigos QR únicos"
  },
  {
    icon: "📱",
    title: "Social Network",
    description: "Comparte fotos, historias y conecta con otros estudiantes Erasmus"
  },
  {
    icon: "💬",
    title: "Chat Integrado",
    description: "Habla con partners y amigos, guarda chats en favoritos"
  },
  {
    icon: "👤",
    title: "Perfil Personal",
    description: "Personaliza tu perfil y gestiona tus preferencias"
  },
  {
    icon: "📂",
    title: "Categorías Guardadas",
    description: "Tus búsquedas se guardan automáticamente para uso futuro"
  },
  {
    icon: "📍",
    title: "Enfoque Local",
    description: "Especializado en Valladolid para estudiantes Erasmus"
  }
];

const categories = [
  { icon: "💄", name: "Bellezza", color: "from-pink-400 to-rose-400" },
  { icon: "🎮", name: "Entretenimiento", color: "from-purple-400 to-indigo-400" },
  { icon: "📱", name: "Electrónica", color: "from-blue-400 to-cyan-400" },
  { icon: "💪", name: "Sport & Fitness", color: "from-green-400 to-emerald-400" },
  { icon: "🍕", name: "Bar & Restaurantes", color: "from-orange-400 to-red-400" },
  { icon: "🛍️", name: "Shopping", color: "from-yellow-400 to-orange-400" },
  { icon: "✈️", name: "Viajes", color: "from-teal-400 to-cyan-400" }
];

const appFeatures = [
  {
    icon: "📱",
    title: "Descarga QR con Descuentos",
    description: "Entra en el perfil del partner y descarga tu código QR con descuento exclusivo"
  },
  {
    icon: "⭐",
    title: "Sistema de Favoritos",
    description: "Guarda chats, partners y categorías en favoritos para acceso rápido"
  },
  {
    icon: "🔄",
    title: "Historial Inteligente",
    description: "Las categorías que visitas se guardan automáticamente"
  },
  {
    icon: "🎯",
    title: "Búsqueda Avanzada",
    description: "Encuentra exactamente lo que buscas por categoría y ubicación"
  }
];

export default StudentsLifeLanding;
