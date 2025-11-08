// File: main.tsx

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
// Rimosso: import { useEffect } from 'react'; non è più necessario a questo livello

// --- LOGICA GLOBALE PER LA GESTIONE DEI LISTENER DI PUSH NOTIFICATIONS ---
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client'; // Importa il client Supabase

// Dichiarazioni globali per tenere traccia del token e dell'ID utente
let globalFcmToken: string | undefined = undefined;
let globalUserId: string | undefined = undefined;

// Funzione helper per tentare di salvare il token nel database
// Verrà chiamata ogni volta che globalFcmToken o globalUserId vengono aggiornati
const trySaveFcmToken = async () => {
  if (globalUserId && globalFcmToken && Capacitor.isNativePlatform()) {
    console.log('Attempting to save FCM token globally:', { userId: globalUserId, token: globalFcmToken, platform: Capacitor.getPlatform() });
    try {
      const platform = Capacitor.getPlatform();
      const { error } = await supabase
        .from('user_fcm_tokens')
        .upsert({ user_id: globalUserId, fcm_token: globalFcmToken, platform: platform, updated_at: new Date().toISOString() }, { onConflict: 'user_id,platform' });

      if (error) {
        console.error('❌ Error saving FCM token globally to DB:', error);
      } else {
        console.log('✅ FCM token saved globally to DB for user:', globalUserId);
      }
    } catch (error) {
      console.error('❌ Error during global FCM token upsert to DB:', error);
    }
  } else {
    console.log('ℹ️ Waiting for both userId and fcmToken to be available before saving.');
  }
};


// Inizializzazione globale dei listener di PushNotifications
if (Capacitor.isNativePlatform()) {
  console.log('🚀 Inizializzazione globale PushNotifications su piattaforma nativa');

  PushNotifications.addListener('registration', async (token) => {
    console.log('Global Push registration success, token:', token.value);
    globalFcmToken = token.value;
    await trySaveFcmToken(); // Tenta di salvare quando il token arriva
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Global Error on Push registration:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Global Push notification received (foreground):', notification);
    console.log(`Global Notification: ${notification.title} - ${notification.body}`);
    // Puoi dispatchare un evento globale qui che i componenti React possono ascoltare.
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Global Push notification action performed:', action);
    const conversationId = action.notification.data?.conversationId;
    if (conversationId) {
      console.log(`Global Navigation intent: /chat/${conversationId}`);
      // La navigazione in-app dovrebbe essere gestita dai componenti React.
      // Qui possiamo solo loggare l'intento o dispatchare un evento.
    }
  });

  // Richiedi i permessi e registra l'app DOPO che i listener sono stati configurati
  PushNotifications.requestPermissions().then(permStatus => {
    console.log(`Global Push permissions: ${permStatus.receive}`);
    if (permStatus.receive === 'granted') {
      PushNotifications.register();
    } else {
      console.warn('Global Push permissions not granted.');
    }
  }).catch(error => {
    console.error('Global Error requesting push permissions:', error);
  });
}

// Assicurati di aggiornare globalUserId quando l'utente si autentica
supabase.auth.onAuthStateChange((_event, session) => {
  if (session && session.user) {
    globalUserId = session.user.id;
    trySaveFcmToken(); // Tenta di salvare quando l'ID utente arriva/cambia
  } else {
    globalUserId = undefined;
    globalFcmToken = undefined; // Resetta anche il token al logout
    console.log('ℹ️ User logged out or session ended. Resetting global FCM data.');
    // Rimuovi COMPLETAMENTE la riga seguente, era la causa dei problemi:
    // if (Capacitor.isNativePlatform()) {
    //   PushNotifications.removeAllListeners();
    // }
  }
});


// Renderizza il componente principale dell'app
createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for PWA (se ancora usato)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
