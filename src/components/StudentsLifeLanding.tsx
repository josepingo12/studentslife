import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import screen1 from '@/assets/screen1.jpeg';
import screen2 from '@/assets/screen2.jpeg';

const StudentsLifeLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    // Auto-slide del carousel
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
    }, 4000);

    // Animazioni iOS-style fluide
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          setTimeout(() => {
            target.style.opacity = '1';
            target.style.transform = 'translateY(0) scale(1)';
          }, index * 150);
        }
      });
    }, observerOptions);

    // Parallax suave iOS-style
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const heroImage = document.querySelector('.hero-bg') as HTMLElement;
      if (heroImage) {
        heroImage.style.transform = `translateY(${scrolled * 0.2}px)`;
      }

      const cards = document.querySelectorAll('.floating-element');
      cards.forEach((card, index) => {
        const element = card as HTMLElement;
        const speed = 0.3 + (index * 0.1);
        element.style.transform = `translateY(${Math.sin(scrolled * 0.005 + index) * speed}px)`;
      });
    };

    const animatedElements = document.querySelectorAll('.animate-fade-in');
    animatedElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px) scale(0.95)';
      element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(element);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearInterval(slideInterval);
    };
  }, [screenshots.length]);

  const handleRegisterClick = () => navigate('/register-client');
  const handlePartnerClick = () => navigate('/register-partner');
  const handleLoginClick = () => navigate('/login');

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Hero Section iOS Style */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden" ref={heroRef}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent"></div>
        <div className="hero-bg absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Valladolid Universidad" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="floating-element mb-12">
            <div className="relative">
              <img 
                src={logo} 
                alt="Students Life" 
                className="w-32 h-32 mx-auto mb-8 rounded-3xl shadow-2xl bg-white/90 backdrop-blur-xl p-4 hover:scale-105 transition-all duration-500" 
              />
              <div className="absolute -inset-2 bg-blue-400/20 rounded-3xl blur-xl animate-pulse"></div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 text-gray-900 tracking-tight">
            StudentsLife
          </h1>
          <p className="text-xl md:text-2xl font-medium mb-4 text-blue-600">
            Tu experiencia Erasmus en Valladolid
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plataforma que conecta estudiantes con los mejores comercios y descuentos de la ciudad
          </p>
          
          <Button 
            onClick={handleRegisterClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 border-0"
          >
            Comenzar Aventura
          </Button>
        </div>
      </header>

      {/* App Preview Carousel Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Anteprima dell'App
            </h2>
            <p className="text-xl text-gray-600">
              Scopri l'interfaccia moderna e intuitiva di StudentsLife
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center animate-fade-in">
            {/* Carousel */}
            <div className="relative floating-element">
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                {/* Phone Frame */}
                <div className="relative">
                  <div className="aspect-[9/16] bg-black rounded-3xl p-2 shadow-inner">
                    <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden">
                      {/* Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-8 bg-black rounded-t-2xl flex items-center justify-center">
                        <div className="w-20 h-1 bg-white rounded-full"></div>
                      </div>
                      
                      {/* Screenshot Carousel */}
                      <div className="relative w-full h-full pt-8 overflow-hidden">
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
                  
                  {/* Navigation Arrows */}
                  <button 
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-gray-600 text-lg">‹</span>
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-gray-600 text-lg">›</span>
                  </button>
                </div>
                
                {/* Dots Indicator */}
                <div className="flex justify-center mt-6 space-x-2">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-blue-500 w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-blue-400/20 rounded-3xl blur-xl opacity-50"></div>
            </div>

            {/* Content */}
            <div className="space-y-8">
              <div className="animate-fade-in">
                <h3 className="text-4xl font-bold text-gray-900 mb-6">
                  {screenshots[currentSlide].title}
                </h3>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {screenshots[currentSlide].description}
                </p>
              </div>

              <div className="space-y-6 animate-fade-in">
                {appFeatures.map((feature, index) => (
                  <AppFeatureItem key={index} {...feature} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Todo lo que necesitas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Una plataforma completa que revoluciona la experiencia de los estudiantes Erasmus en Valladolid
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>

          {/* Categories Preview */}
          <div className="animate-fade-in mb-24">
            <h3 className="text-3xl font-bold text-gray-900 text-center mb-16">
              Categorías Disponibles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category, index) => (
                <CategoryCard key={index} {...category} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Partners con Descuentos
            </h3>
            <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
              Comercios locales que ofrecen descuentos exclusivos a estudiantes Erasmus
            </p>
            
            <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100 floating-element">
              <div className="text-6xl mb-8">🎯</div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Próximamente!
              </h4>
              <p className="text-gray-600 text-lg mb-8">
                Estamos cerrando acuerdos con los mejores comercios de Valladolid para ofrecerte descuentos exclusivos
              </p>
              <div className="flex justify-center space-x-4">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-12 h-12 bg-blue-100 rounded-2xl animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¡Únete a StudentsLife!
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Descubre Valladolid, ahorra dinero y conecta con otros estudiantes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button 
              onClick={handleRegisterClick}
              className="bg-white text-blue-600 hover:bg-gray-50 px-10 py-4 rounded-full text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              📱 Registrarse como Estudiante
            </Button>
            <Button 
              onClick={handlePartnerClick}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-4 rounded-full text-lg font-semibold transform hover:scale-105 transition-all duration-300"
            >
              🏪 Registrarse como Partner
            </Button>
          </div>

          <button 
            onClick={handleLoginClick}
            className="text-blue-100 hover:text-white text-lg underline underline-offset-4 transition-all duration-300"
          >
            ¿Ya tienes cuenta? <span className="font-semibold">Inicia Sesión</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">StudentsLife</h3>
          <p className="text-gray-600 mb-8">
            Conectando estudiantes en Valladolid con los mejores descuentos y experiencias
          </p>
          <p className="text-gray-400">&copy; 2024 StudentsLife. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

// Resto dei dati (features, categories, appFeatures) rimangono uguali...
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
  { icon: "💄", name: "Belleza", color: "from-pink-400 to-rose-400" },
  { icon: "🎮", name: "Entretenimiento", color: "from-purple-400 to-indigo-400" },
  { icon: "📱", name: "Electrónica", color: "from-blue-400 to-cyan-400" },
  { icon: "💪", name: "Sport & Fitness", color: "from-green-400 to-emerald-400" },
  { icon: "🍕", name: "Bar & Restaurantes", color: "from-orange-400 to-red-400" },
  { icon: "🛍️", name: "Shopping", color: "from-yellow-400 to-orange-400" }
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

// Componenti helper (FeatureCard, CategoryCard, AppFeatureItem) rimangono uguali...
const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  index: number;
}> = ({ icon, title, description, index }) => (
  <div 
    className="animate-fade-in bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 floating-element"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="text-4xl mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
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
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-center transform group-hover:scale-105 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-white font-semibold text-sm">{name}</p>
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
    className="flex items-start space-x-4 group"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl group-hover:scale-110 group-hover:bg-blue-200 transition-all duration-300">
      {icon}
    </div>
    <div>
      <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
        {title}
      </h4>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default StudentsLifeLanding;
