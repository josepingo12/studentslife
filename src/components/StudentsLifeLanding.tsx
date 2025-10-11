import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const StudentsLifeLanding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Animazioni avanzate
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
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

    // Parallax scroll effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const heroImage = document.querySelector('.hero-bg') as HTMLElement;
      if (heroImage) {
        heroImage.style.transform = `translateY(${scrolled * 0.3}px) scale(${1 + scrolled * 0.0002})`;
      }

      // Floating animation for cards
      const cards = document.querySelectorAll('.floating-card');
      cards.forEach((card, index) => {
        const element = card as HTMLElement;
        const speed = 0.5 + (index * 0.1);
        element.style.transform = `translateY(${Math.sin(scrolled * 0.01 + index) * speed}px)`;
      });
    };

    // Observe animated elements
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(50px) scale(0.9)';
      element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(element);
    });

    window.addEventListener('scroll', handleScroll);
    
    // Gradient animation
    const gradientAnimation = () => {
      const hero = document.querySelector('.hero-gradient') as HTMLElement;
      if (hero) {
        const time = Date.now() * 0.001;
        const hue1 = (time * 20) % 360;
        const hue2 = (time * 30 + 60) % 360;
        hero.style.background = `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 80%, 50%))`;
      }
    };

    const gradientInterval = setInterval(gradientAnimation, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearInterval(gradientInterval);
    };
  }, []);

  const handleRegisterClick = () => navigate('/register-client');
  const handlePartnerClick = () => navigate('/register-partner');
  const handleLoginClick = () => navigate('/login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-x-hidden">
      {/* Hero Section Ultra Moderno */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden" ref={heroRef}>
        <div className="hero-gradient absolute inset-0 opacity-90"></div>
        <div className="hero-bg absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Valladolid Universidad" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Elementos flotantes animados */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-5xl">
          <div className="mb-12 animate-bounce">
            <div className="relative">
              <img 
                src={logo} 
                alt="Students Life" 
                className="w-40 h-40 mx-auto mb-6 rounded-3xl p-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:scale-110 transition-all duration-500" 
              />
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-xl animate-pulse"></div>
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black mb-8 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent animate-pulse">
            StudentsLife
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-4 opacity-90">
            Tu experiencia Erasmus en Valladolid comienza aquí
          </p>
          <p className="text-lg md:text-xl mb-12 opacity-70">
            Conectando estudiantes con los mejores servicios de la ciudad
          </p>
          
          <Button 
            onClick={handleRegisterClick}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-6 rounded-full text-xl font-bold shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
          >
            <span className="relative z-10">🚀 Comenzar Aventura</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </Button>
        </div>
      </header>

      {/* About Section Súper Moderno */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/30 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 animate-on-scroll">
            <h2 className="text-6xl md:text-7xl font-black text-white mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ¡Quiénes Somos!
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              La plataforma tecnológica más avanzada que conecta estudiantes Erasmus en Valladolid 
              con restaurantes, peluquerías, servicios y experiencias únicas de la ciudad.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="space-y-8 animate-on-scroll">
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-8">¿Qué Hacemos?</h3>
              <div className="space-y-6">
                <FeatureItem 
                  icon="🍽️" 
                  text="Conectamos con los mejores restaurantes y bares de Valladolid"
                  delay="0ms"
                />
                <FeatureItem 
                  icon="💇‍♀️" 
                  text="Acceso a peluquerías y centros de belleza modernos"
                  delay="200ms"
                />
                <FeatureItem 
                  icon="🏪" 
                  text="Red de comercios y servicios para estudiantes"
                  delay="400ms"
                />
                <FeatureItem 
                  icon="🎯" 
                  text="Experiencias culturales auténticas en Valladolid"
                  delay="600ms"
                />
              </div>
            </div>
            
            <div className="relative animate-on-scroll">
              <div className="floating-card relative">
                <img 
                  src="https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                  alt="Estudiantes en Valladolid"
                  className="rounded-3xl shadow-2xl w-full transform hover:scale-105 transition-all duration-500"
                />
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl"></div>
              </div>
            </div>
          </div>

          {/* Gallery Section Ultra Tech */}
          <div className="mb-32 animate-on-scroll">
            <h3 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
              Servicios en Valladolid
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {galleryData.map((item, i) => (
                <div 
                  key={i} 
                  className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer transform hover:scale-105 transition-all duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <img 
                    src={item.src} 
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-white font-bold text-lg">{item.title}</h4>
                      <p className="text-blue-200 text-sm">{item.category}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 rounded-2xl transition-all duration-300"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Partners Section */}
          <div className="text-center animate-on-scroll">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-16">Nuestros Partners</h3>
            <div className="floating-card bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
              <div className="text-6xl mb-8">🚀</div>
              <h4 className="text-2xl font-bold text-white mb-4">¡Próximamente!</h4>
              <p className="text-blue-200 text-lg">
                Estamos estableciendo alianzas con los mejores comercios de Valladolid
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section Ultra Futurista */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Elementos animados de fondo */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto text-center px-6 relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
            ¡Únete a StudentsLife!
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-16 opacity-90">
            Descubre Valladolid como nunca antes y conecta con los mejores servicios
          </p>
          
          <div className="flex flex-col md:flex-row gap-8 justify-center mb-16">
            <Button 
              onClick={handleRegisterClick}
              className="group relative overflow-hidden bg-white text-blue-600 hover:bg-blue-50 px-10 py-6 rounded-full text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10">📱 Registrarse como Estudiante</span>
            </Button>
            <Button 
              onClick={handlePartnerClick}
              className="group relative overflow-hidden bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-6 rounded-full text-xl font-bold transform hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10">🏢 Registrarse como Partner</span>
            </Button>
          </div>

          <div className="text-center">
            <button 
              onClick={handleLoginClick}
              className="text-blue-200 hover:text-white text-lg underline underline-offset-4 hover:underline-offset-8 transition-all duration-300"
            >
              ¿Ya tienes cuenta? <span className="font-bold">Inicia Sesión</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer Futurista */}
      <footer className="bg-black/50 backdrop-blur-xl text-white py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-12">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              StudentsLife
            </h3>
            <p className="text-blue-200">Conectando estudiantes en Valladolid, creando experiencias únicas</p>
          </div>
          <div className="border-t border-white/10 pt-8">
            <p className="text-blue-300/60">&copy; 2024 StudentsLife. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Datos de la gallería con servicios de Valladolid
const galleryData = [
  {
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Restaurante moderno",
    title: "Restaurantes",
    category: "Gastronomía"
  },
  {
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Peluquería moderna",
    title: "Peluquerías",
    category: "Belleza"
  },
  {
    src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Tienda moderna",
    title: "Comercios",
    category: "Shopping"
  },
  {
    src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Café moderno",
    title: "Cafeterías",
    category: "Ocio"
  },
  {
    src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Gimnasio",
    title: "Fitness",
    category: "Deporte"
  },
  {
    src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Centro estético",
    title: "Estética",
    category: "Belleza"
  },
  {
    src: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Bar moderno",
    title: "Bares",
    category: "Vida Nocturna"
  },
  {
    src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    alt: "Servicios",
    title: "Servicios",
    category: "Varios"
  }
];

// Componente FeatureItem mejorado
const FeatureItem: React.FC<{ icon: string; text: string; delay: string }> = ({ icon, text, delay }) => (
  <div 
    className="flex items-start space-x-6 group hover:transform hover:scale-105 transition-all duration-300"
    style={{ animationDelay: delay }}
  >
    <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 transition-all duration-300 border border-white/10">
      {icon}
    </div>
    <p className="text-blue-100 text-lg leading-relaxed group-hover:text-white transition-colors duration-300">
      {text}
    </p>
  </div>
);

export default StudentsLifeLanding;
