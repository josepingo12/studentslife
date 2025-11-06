import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface WebNotificationsProps {
  userId: string | undefined;
  currentConversationId?: string;
}

export const useWebNotifications = ({ userId, currentConversationId }: WebNotificationsProps) => {
  const navigate = useNavigate();
  const notificationPermission = useRef<NotificationPermission>('default');

  // Richiedi permesso notifiche
  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('Browser non supporta le notifiche');
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        notificationPermission.current = permission;
        console.log('Permesso notifiche:', permission);
      });
    } else {
      notificationPermission.current = Notification.permission;
    }
  }, []);

  // Ascolta nuovi messaggi
  useEffect(() => {
    if (!userId) return;

    console.log('🔔 Avvio ascolto notifiche per user:', userId);

    const channel = supabase
      .channel('new-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Non mostrare notifica se:
          // 1. Il messaggio è dell'utente corrente
          // 2. L'utente è già nella conversazione dove è arrivato il messaggio
          if (newMessage.sender_id === userId) {
            console.log('📝 Messaggio inviato da te, nessuna notifica');
            return;
          }

          if (newMessage.conversation_id === currentConversationId) {
            console.log('💬 Sei già nella conversazione, nessuna notifica');
            return;
          }

          // Verifica che l'utente sia parte della conversazione
          const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', newMessage.conversation_id)
            .single();

          if (!conversation) return;

          const isParticipant = 
            conversation.user1_id === userId || 
            conversation.user2_id === userId;

          if (!isParticipant) {
            console.log('❌ Non sei parte della conversazione');
            return;
          }

          // Ottieni info del mittente
          const { data: sender } = await supabase
            .from('profiles')
            .select('first_name, last_name, business_name, profile_image_url')
            .eq('id', newMessage.sender_id)
            .single();

          if (!sender) return;

          const senderName = sender.business_name || `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'Utente';
          
          // Determina il contenuto della notifica
          let messageContent = newMessage.content || '';
          if (newMessage.image_url) {
            messageContent = '📷 Immagine';
          } else if (newMessage.video_url) {
            messageContent = '🎥 Video';
          } else if (newMessage.file_url) {
            messageContent = '📎 File';
          }

          // Mostra notifica
          if (Notification.permission === 'granted') {
            console.log('✅ Mostro notifica per messaggio da:', senderName);
            
            const notification = new Notification(`${senderName}`, {
              body: messageContent,
              icon: sender.profile_image_url || '/logo.png',
              badge: '/logo.png',
              tag: newMessage.conversation_id, // Raggruppa per conversazione
              requireInteraction: false,
              silent: false,
            });

            notification.onclick = () => {
              window.focus();
              navigate(`/chat/${newMessage.conversation_id}`);
              notification.close();
            };

            // Auto-chiudi dopo 5 secondi
            setTimeout(() => notification.close(), 5000);
          } else {
            console.log('⚠️ Permesso notifiche non concesso:', Notification.permission);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Chiudo ascolto notifiche');
      supabase.removeChannel(channel);
    };
  }, [userId, currentConversationId, navigate]);

  return {
    permission: notificationPermission.current,
    isSupported: 'Notification' in window,
  };
};
