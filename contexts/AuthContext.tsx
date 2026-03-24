'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
 * Garante que user_profiles e students existam para o usuário.
 * Idempotente — se já existir, não duplica.
 */
async function ensureUserSetup(user: User, displayName?: string): Promise<UserProfile | null> {
  const userId = user.id;
  const email = user.email || '';
  const name = displayName || email.split('@')[0] || 'Usuário';

  // 1. Verificar/criar user_profiles
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  let profile = existingProfile as UserProfile | null;

  // Determinar role: super admin sempre é 'admin'
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
  const defaultRole = isSuperAdmin ? 'admin' : 'aluno';

  if (!profile) {
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        role: defaultRole,
        display_name: name,
      }])
      .select()
      .single();

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError.message);
    } else {
      profile = newProfile as UserProfile;
    }
  }

  // 2. Verificar/criar students
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!existingStudent) {
    const { error: studentError } = await supabase
      .from('students')
      .insert([{
        name: name,
        email: email,
        status: 'ativo',
        user_id: userId,
      }]);

    if (studentError) {
      console.error('Erro ao criar registro de aluno:', studentError.message);
    }
  }

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar perfil do usuário na tabela user_profiles
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Erro ao buscar perfil:', error.message);
      return null;
    }

    return data as UserProfile | null;
  }, []);

  // Inicializar sessão
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          setUser(currentSession.user);
          setSession(currentSession);
          // ensureUserSetup garante profile + student existem
          const userProfile = await ensureUserSetup(currentSession.user);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Erro ao inicializar auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);
        // ensureUserSetup em toda mudança de sessão (login, token refresh)
        const userProfile = await ensureUserSetup(newSession.user);
        setProfile(userProfile);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Login — ensureUserSetup roda via onAuthStateChange
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  // Cadastro — ensureUserSetup roda via onAuthStateChange + chamada explícita com nome
  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    const newUser = data.user;
    if (!newUser) return { error: 'Erro ao criar conta. Tente novamente.' };

    // Chamada explícita com o nome do formulário
    await ensureUserSetup(newUser, name);

    return { error: null };
  };

  // Logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Promoção de role (apenas admin)
  const updateRole = async (userId: string, newRole: UserRole) => {
    if (profile?.role !== 'admin') {
      return { error: 'Apenas administradores podem alterar roles.' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateRole,
    }}>
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
