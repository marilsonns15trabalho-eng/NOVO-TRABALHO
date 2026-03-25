'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, refreshSessionIfStale } from '@/lib/supabase';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'professor' | 'aluno';

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateRole: (userId: string, newRole: UserRole) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Garante linha em students: por user_id, ou vincula e-mail órfão, ou insere.
 * Evita violação de students_email_key (corrida / aluno cadastrado antes sem user_id).
 */
async function ensureStudentRow(userId: string, email: string, name: string): Promise<void> {
  if (!email) return;

  const { data: byUser } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (byUser) return;

  const { data: byEmail } = await supabase
    .from('students')
    .select('id, user_id')
    .eq('email', email)
    .maybeSingle();

  if (byEmail) {
    if (!byEmail.user_id) {
      const { error } = await supabase
        .from('students')
        .update({ user_id: userId, name })
        .eq('id', byEmail.id);

      if (error) {
        console.error('Erro ao vincular aluno ao login:', error.message);
      }
    }

    return;
  }

  const { error } = await supabase.from('students').insert([
    {
      name,
      email,
      status: 'ativo',
      user_id: userId,
    },
  ]);

  if (error?.code === '23505') {
    return;
  }

  if (error) {
    console.error('Erro ao criar registro de aluno:', error.message);
  }
}

/**
 * Garante que user_profiles e students existam para o usuário.
 * Idempotente — perfil primeiro (para is_admin() no RLS), depois aluno.
 */
async function ensureUserSetup(user: User, displayName?: string): Promise<UserProfile | null> {
  const userId = user.id;
  const email = user.email || '';
  const name = displayName || email.split('@')[0] || 'Usuário';

  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
  const defaultRole = isSuperAdmin ? 'admin' : 'aluno';

  let profile: UserProfile | null = null;

  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) {
    profile = existingProfile as UserProfile;
  } else {
    const { data: inserted, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          role: defaultRole,
          display_name: name,
        },
      ])
      .select()
      .single();

    if (error?.code === '23505') {
      const { data: refetch } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      profile = refetch as UserProfile | null;
    } else if (error) {
      console.error('Erro ao criar perfil:', error.message);
    } else {
      profile = inserted as UserProfile;
    }
  }

  ensureStudentRow(userId, email, name).catch((error) => {
    console.error('Erro ao garantir registro de aluno:', error);
  });

  return profile;
}

async function resolveProfile(user: User | null): Promise<UserProfile | null> {
  if (!user) return null;
  return ensureUserSetup(user);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        if (mounted) setLoading(false);
        return;
      }

      const nextProfile = await resolveProfile(nextSession.user);

      if (!mounted) return;

      setProfile(nextProfile);
      setLoading(false);
    };

    const initialize = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        await applySession(initialSession);
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (!mounted) return;
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    void initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const onResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      clearTimeout(debounce);
      debounce = setTimeout(() => {
        void refreshSessionIfStale();
      }, 150);
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);
    window.addEventListener('pageshow', onResume);
    window.addEventListener('online', onResume);

    return () => {
      clearTimeout(debounce);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('pageshow', onResume);
      window.removeEventListener('online', onResume);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: error.message };
    }

    const newUser = data.user;
    if (!newUser) {
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }

    await ensureUserSetup(newUser, name);

    return { error: null };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('Erro no signOut:', error.message);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: UserRole) => {
    if (profile?.role !== 'admin') {
      return { error: 'Apenas administradores podem alterar roles.' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}
