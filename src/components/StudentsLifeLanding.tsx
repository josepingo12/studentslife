import React, { useEffect, useRef } from 'react';
import './StudentsLifeLanding.css';

const StudentsLifeLanding: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Parallax effect
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset;
        const heroImage = heroRef.current.querySelector('.hero-image') as HTMLImageElement;
        if (heroImage) {
          heroImage.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
      }
    };

    // Intersection Observer for animations
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

    // Observe animated elements
    const animatedElements = document.querySelectorAll('.feature-item, .gallery-item, .partner-card');
    animatedElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(element);
    });

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleRegisterClick = (): void => {
    window.open('https://studentslife.es/', '_blank');
  };

  const handleLoginClick = (): void => {
    window.open('https://studentslife.es/#/login', '_blank');
  };

  return (
    <div className="studentslife-landing">
      {/* Header Section */}
      <header className="hero" ref={heroRef}>
        <div className="hero-background">
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="Estudiantes Erasmus" 
            className="hero-image"
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-icon">
            <span>🎓</span>
          </div>
          <h1 className="hero-title">StudentsLife</h1>
          <p className="hero-subtitle">Tu experiencia Erasmus comienza aquí</p>
          <button className="cta-button" onClick={handleRegisterClick}>
            Comenzar Aventura
          </button>
        </div>
      </header>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="section-header">
            <h2>¡Quiénes Somos!</h2>
            <p>
              Somos la plataforma líder que conecta estudiantes Erasmus con experiencias únicas, 
              alojamientos perfectos y una comunidad vibrante en toda Europa.
            </p>
          </div>

          <div className="about-content">
            <div className="about-text">
              <h3>¿Qué Hacemos?</h3>
              <div className="feature-list">
                <FeatureItem 
                  icon="🏠" 
                  text="Conectamos estudiantes con alojamientos verificados y seguros" 
                />
                <FeatureItem 
                  icon="👥" 
                  text="Creamos comunidades de estudiantes internacionales" 
                />
                <FeatureItem 
                  icon="🎯" 
                  text="Facilitamos experiencias culturales auténticas" 
                />
              </div>
            </div>
            <div className="about-image">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80" 
                alt="Estudiantes internacionales"
              />
            </div>
          </div>

          {/* Gallery Section */}
          <GallerySection />

          {/* Partners Section */}
          <PartnersSection />
        </div>
      </section>

      {/* App Connection Section */}
      <section className="app-section">
        <div className="container">
          <h2>¡Únete a StudentsLife!</h2>
          <p>Descarga nuestra app y comienza tu aventura Erasmus hoy mismo</p>
          
          <div className="app-buttons">
            <button className="app-button primary" onClick={handleRegisterClick}>
              📱 Registrarse
            </button>
            <button className="app-button secondary" onClick={handleLoginClick}>
              🔑 Iniciar Sesión
            </button>
          </div>

          <div className="app-info">
            <p>Accede directamente a:</p>
            <p className="app-url">studentslife.es</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <h3>StudentsLife</h3>
            <p>Conectando estudiantes, creando experiencias</p>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 StudentsLife. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Sub-components
interface FeatureItemProps {
  icon: string;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, text }) => (
  <div className="feature-item">
    <div className="feature-icon">{icon}</div>
    <p>{text}</p>
  </div>
);

const GallerySection: React.FC = () => {
  const galleryImages = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
  ];

  return (
    <div className="gallery-section">
      <h3>Galería de Experiencias</h3>
      <div className="gallery-grid">
        {galleryImages.map((src, index) => (
          <div key={index} className="gallery-item">
            <img src={src} alt={`Experiencia ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

const PartnersSection: React.FC = () => {
  const partners = [
    'Universidad Madrid',
    'Erasmus+',
    'EU Programs',
    'Student Network'
  ];

  return (
    <div className="partners-section">
      <h3>Nuestros Partners</h3>
      <div className="partners-grid">
        {partners.map((partner, index) => (
          <div key={index} className="partner-card">
            <div className="partner-icon">🤝</div>
            <p>{partner}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsLifeLanding;
