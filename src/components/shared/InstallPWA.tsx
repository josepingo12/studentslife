import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [showAndroidInstall, setShowAndroidInstall] = useState(false);

  useEffect(() => {
    console.log('InstallPWA: Component mounted');
    
    // Verifica se è già installata come PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    console.log('isStandalone:', isStandalone);
    console.log('isIOSStandalone:', isIOSStandalone);
    
    if (isStandalone || isIOSStandalone) {
      console.log('App is already installed, not showing prompt');
      return;
    }

    // Rileva iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSDevice = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    const isAppleDevice = isIOS || isIOSDevice;
    
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('isIOS:', isIOS);
    console.log('isIOSDevice:', isIOSDevice);
    console.log('isAppleDevice:', isAppleDevice);
    
    // Verifica se è Safari su iOS (non Chrome, Firefox, etc.)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS|OPR/.test(navigator.userAgent);
    
    console.log('isSafari:', isSafari);
    
    if (isAppleDevice && isSafari) {
      // Mostra il prompt iOS dopo 1 secondo solo se non è stata già installata
      const iosInstallDismissed = localStorage.getItem('iosInstallDismissed');
      console.log('iosInstallDismissed:', iosInstallDismissed);
      
      if (!iosInstallDismissed) {
        console.log('Showing iOS install prompt in 1 second');
        setTimeout(() => {
          console.log('Showing iOS install prompt now');
          setShowIOSInstall(true);
        }, 1000);
      }
    }

    // Ascolta l'evento beforeinstallprompt per Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const androidInstallDismissed = localStorage.getItem('androidInstallDismissed');
      if (!androidInstallDismissed) {
        setTimeout(() => setShowAndroidInstall(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleIOSInstall = () => {
    setShowIOSInstall(false);
    localStorage.setItem('iosInstallDismissed', 'true');
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installata');
    }
    
    setDeferredPrompt(null);
    setShowAndroidInstall(false);
    localStorage.setItem('androidInstallDismissed', 'true');
  };

  const handleDismissAndroid = () => {
    setShowAndroidInstall(false);
    localStorage.setItem('androidInstallDismissed', 'true');
  };

  if (showIOSInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 backdrop-blur-lg">
          <button
            onClick={handleIOSInstall}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-7 h-7 text-primary" />
            </div>
            
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-lg mb-2">Installa Students Life</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Installa l'app per un'esperienza migliore e accesso rapido
              </p>
              
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <p>Premi il pulsante <Share className="inline w-4 h-4 mx-1" /> Condividi</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <p>Seleziona "Aggiungi a Home"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showAndroidInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 backdrop-blur-lg">
          <button
            onClick={handleDismissAndroid}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-7 h-7 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Installa Students Life</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Installa l'app per un'esperienza migliore, notifiche e accesso rapido
              </p>
              
              <Button 
                onClick={handleAndroidInstall}
                className="w-full"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Installa ora
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
