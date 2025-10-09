import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = (userId: string | undefined) => {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const loadUnreadCount = async () => {
      // Get all conversations where user is participant
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (!convData) return;

      let total = 0;

      for (const conv of convData) {
        // Count unread messages in each conversation
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        total += count || 0;
      }

      setTotalUnread(total);
    };

    loadUnreadCount();

    // Subscribe to messages changes
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return totalUnread;
};
