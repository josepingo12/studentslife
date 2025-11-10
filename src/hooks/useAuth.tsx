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

      // Se la RPC fallisce, usa una query diretta
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile && !profileError) {
        setUserRole(profile.role);
      } else {
        setUserRole('client'); // default
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('client');
    }
  };

  useEffect(() => {
    // PRIMA imposta il listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }

        // IMPORTANTE: imposta loading a false solo DOPO aver processato tutto
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

        // Se c'è già una sessione, aggiorna lo stato
        if (session) {
          setSession(session);
          setUser(session.user);
          await fetchUserRole(session.user.id);
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
