'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // ⚡ Buscar profile e student em PARALELO
  const [profileResult, studentResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single(),
  ]);

  let profile = profileResult.data as UserProfile | null;

  // Determinar role: super admin sempre é 'admin'
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
  const defaultRole = isSuperAdmin ? 'admin' : 'aluno';

  // Criar profile e student em paralelo se necessário
  const pendingInserts: PromiseLike<any>[] = [];

  if (!profile) {
    pendingInserts.push(
      supabase
        .from('user_profiles')
        .insert([{
          id: userId,
          role: defaultRole,
          display_name: name,
        }])
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Erro ao criar perfil:', error.message);
          } else {
            profile = data as UserProfile;
          }
        })
    );
  }

  if (!studentResult.data) {
    pendingInserts.push(
      supabase
        .from('students')
        .insert([{
          name: name,
          email: email,
          status: 'ativo',
          user_id: userId,
        }])
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao criar registro de aluno:', error.message);
          }
        })
    );
  }

  if (pendingInserts.length > 0) {
    await Promise.all(pendingInserts);
  }

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar sessão via onAuthStateChange (única fonte de verdade)
  useEffect(() => {
    // Listener para TODAS as mudanças de sessão (incluindo INITIAL_SESSION no mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Apenas atualiza sessão — NÃO roda ensureUserSetup
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
        return;
      }

      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);

        // ensureUserSetup só roda em SIGNED_IN e INITIAL_SESSION
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          const userProfile = await ensureUserSetup(newSession.user);
          setProfile(userProfile);
        }
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
  }, []);

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
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) console.error('Erro no signOut:', error.message);
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
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
