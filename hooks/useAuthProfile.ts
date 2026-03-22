import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuthProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'loading' | 'login' | 'onboarding' | 'app'>('loading');

  const validateProfile = useCallback(async (userId: string) => {
    try {
      // Single source of truth: users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
      
      if (userData?.role) {
        setUserRole(userData.role);
      }

      if (userData) {
        setView('app');
      } else {
        setView('onboarding');
      }
    } catch (err) {
      console.error('Profile validation error:', err);
      setView('app'); // Default to app on error to avoid blocking
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setView('login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        validateProfile(session.user.id);
      }
    });

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await validateProfile(session.user.id);
      } else {
        setView('login');
        setLoading(false);
      }
    };
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [validateProfile]);

  return { user, userRole, loading, view, setView, setUser, setUserRole };
}
