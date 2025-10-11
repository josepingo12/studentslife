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
    // Animazioni e scroll effects...
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-item, .gallery-item, .partner-card');
    animatedElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleRegisterClick = () => navigate('/register-client');
  const handlePartnerClick = () => navigate('/register-partner');
  const handleLoginClick = () => navigate('/login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden" ref={heroRef}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800">
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Estudiantes Erasmus" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 text-center text-white px-6 max-w-4xl">
          <div className="mb-8">
            <img src={logo} alt="Students Life" className="w-32 h-32 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-3xl p-4" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            StudentsLife
          </h1>
          <p className="text-xl md:text-2xl font-light mb-8 opacity-90">
            {t("auth.welcomeTitle")}
          </p>
          <Button 
            onClick={handleRegisterClick}
            className="ios-button bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full text-lg font-semibold h-auto"
          >
            Comenzar Aventura
          </Button>
        </div>
      </header>

      {/* About Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-blue-800 mb-6">¡Quiénes Somos!</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos la plataforma líder que conecta estudiantes Erasmus con experiencias únicas, 
              alojamientos perfectos y una comunidad vibrante en toda Europa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-blue-700">¿Qué Hacemos?</h3>
              <div className="space-y-4">
                <FeatureItem icon="🏠" text="Conectamos estudiantes con alojamientos verificados y seguros" />
                <FeatureItem icon="👥" text="Creamos comunidades de estudiantes internacionales" />
                <FeatureItem icon="🎯" text="Facilitamos experiencias culturales auténticas" />
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Estudiantes internacionales"
                className="rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>

          {/* Gallery */}
          <GallerySection />
          
          {/* Partners */}
          <PartnersSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-8">¡Únete a StudentsLife!</h2>
          <p className="text-xl mb-12 opacity-90">
            Regístrate y comienza tu aventura Erasmus hoy mismo
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button 
              onClick={handleRegisterClick}
              className="ios-button bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full text-lg font-semibold h-auto"
            >
              📱 {t("auth.registerAsClient")}
            </Button>
            <Button 
              onClick={handlePartnerClick}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-full text-lg font-semibold h-auto"
            >
              🏢 {t("auth.registerAsPartner")}
            </Button>
          </div>

          <div className="text-center">
            <button 
              onClick={handleLoginClick}
              className="text-white/80 hover:text-white underline"
            >
              {t("auth.hasAccount")} <span className="font-semibold">{t("auth.login")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">StudentsLife</h3>
            <p className="opacity-80">Conectando estudiantes, creando experiencias</p>
          </div>
          <div className="border-t border-blue-800 pt-8">
            <p className="opacity-60">&copy; 2024 StudentsLife. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Componenti helper
const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="feature-item flex items-start space-x-4">
    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <p className="text-gray-700">{text}</p>
  </div>
);

const GallerySection: React.FC = () => {
  const images = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
  ];

  return (
    <div className="mb-20">
      <h3 className="text-3xl font-bold text-blue-700 text-center mb-12">Galería de Experiencias</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((src, i) => (
          <div key={i} className="gallery-item relative group overflow-hidden rounded-2xl aspect-square">
            <img src={src} alt={`Experiencia ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
          </div>
        ))}
      </div>
    </div>
  );
};

const PartnersSection: React.FC = () => {
  const partners = ['Universidad Madrid', 'Erasmus+', 'EU Programs', 'Student Network'];

  return (
    <div className="text-center">
      <h3 className="text-3xl font-bold text-blue-700 mb-12">Nuestros Partners</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {partners.map((partner, i) => (
          <div key={i} className="partner-card ios-card p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              🤝
            </div>
            <p className="font-semibold text-blue-800">{partner}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsLifeLanding;
