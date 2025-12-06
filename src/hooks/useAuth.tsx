import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      // Prova prima con la funzione RPC
      const { data: rpcRole, error: rpcError } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      if (rpcRole && !rpcError) {
        setUserRole(rpcRole as string);
        return;
      }

      // Se la RPC fallisce, imposta ruolo di default
      setUserRole('client'); // default
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('client');
    }
  };

  const logAccess = async (userId: string) => {
    try {
      await supabase.from('access_logs').insert({ user_id: userId });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  };

  useEffect(() => {
    // PRIMA imposta il listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer async calls to avoid deadlocks on native (iOS)
          setTimeout(() => {
            fetchUserRole(session.user!.id);
            // Log access on SIGNED_IN event
            if (event === 'SIGNED_IN') {
              logAccess(session.user!.id);
            }
          }, 0);
        } else {
          setUserRole(null);
        }

        // Set loading to false immediately after processing sync updates
        setLoading(false);
      }
    );

    // POI controlla la sessione esistente
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('Initial session:', session?.user?.id);

        // Se c'è già una sessione, aggiorna lo stato senza bloccare il rendering
        if (session) {
          setSession(session);
          setUser(session.user);
          setTimeout(() => { fetchUserRole(session.user.id); }, 0);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    userRole,
    signOut,
    isAuthenticated: !!user,
  };
};
