'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

const CACHE_KEY = 'profile_cache';

function saveProfileCache(profile: UserProfile) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: {
        id: profile.id,
        role: profile.role,
        display_name: profile.display_name
      },
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Erro ao salvar cache', e);
  }
}

function getProfileCache(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const isValid = Date.now() - parsed.timestamp < 1000 * 60 * 10; // 10 minutos

    return isValid ? parsed.data : null;
  } catch {
    return null;
  }
}

function clearProfileCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {}
}

/**
 * Helper para adicionar timeout a uma promise
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout após ${ms}ms`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Garante linha em students: por user_id, ou vincula e-mail órfão, ou insere.
 * Evita violação de students_email_key (corrida / aluno cadastrado antes sem user_id).
 */
async function ensureStudentRow(userId: string, email: string, name: string): Promise<void> {
  if (!email) return;

  try {
    const { data: byUser } = await withTimeout(
      supabase.from('students').select('id').eq('user_id', userId).maybeSingle(),
      5000
    );

    if (byUser) return;

    const { data: byEmail } = await withTimeout(
      supabase.from('students').select('id, user_id').eq('email', email).maybeSingle(),
      5000
    );

    if (byEmail) {
      if (!byEmail.user_id) {
        const { error } = await withTimeout(
          supabase.from('students').update({ user_id: userId, name }).eq('id', byEmail.id),
          5000
        );
        if (error) {
          console.error('Erro ao vincular aluno ao login:', error.message);
        }
      }
      return;
    }

    const { error } = await withTimeout(
      supabase.from('students').insert([{
        name,
        email,
        status: 'ativo',
        user_id: userId,
      }]),
      5000
    );

    if (error?.code === '23505') {
      return;
    }
    if (error) {
      console.error('Erro ao criar registro de aluno:', error.message);
    }
  } catch (err) {
    console.error('Erro de timeout ou rede em ensureStudentRow:', err);
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

  try {
    const { data: existingProfile } = await withTimeout(
      supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      5000
    );

    if (existingProfile) {
      profile = existingProfile as UserProfile;
    } else {
      const { data: inserted, error } = await withTimeout(
        supabase.from('user_profiles').insert([{
          id: userId,
          role: defaultRole,
          display_name: name,
        }]).select().single(),
        5000
      );

      if (error?.code === '23505') {
        const { data: refetch } = await withTimeout(
          supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
          5000
        );
        profile = refetch as UserProfile | null;
      } else if (error) {
        console.error('Erro ao criar perfil:', error.message);
      } else {
        profile = inserted as UserProfile;
      }
    }

    await ensureStudentRow(userId, email, name);
  } catch (err) {
    console.error('Erro de timeout ou rede em ensureUserSetup:', err);
  }

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Carregamento instantâneo (Cache Primeiro)
  useEffect(() => {
    const cached = getProfileCache();
    if (cached) {
      console.log('Usando cache local do profile');
      setProfile(cached);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // Inicializar sessão via onAuthStateChange (única fonte de verdade)
  useEffect(() => {
    // Listener para TODAS as mudanças de sessão (incluindo INITIAL_SESSION no mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      try {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setProfile(null);
          clearProfileCache();
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
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && !hasInitialized.current) {
            hasInitialized.current = true;
            let userProfile = null;

            try {
              userProfile = await Promise.race([
                ensureUserSetup(newSession.user),
                new Promise<UserProfile | null>((_, reject) =>
                  setTimeout(() => reject(new Error('Timeout em ensureUserSetup')), 4000)
                )
              ]);
              
              if (userProfile) {
                // Proteger role (crítico)
                if (profile && profile.role === 'admin') {
                  userProfile.role = 'admin';
                }
                
                setProfile(userProfile);
                saveProfileCache(userProfile);
              }
            } catch (error) {
              console.warn('Erro ao atualizar profile (mantendo cache):', error);

              if (profile) {
                userProfile = profile;
              } else {
                const cached = getProfileCache();
                if (cached) {
                  userProfile = cached;
                  setProfile(cached);
                } else {
                  // Fallback final
                  userProfile = {
                    id: newSession.user.id,
                    role: newSession.user.email === SUPER_ADMIN_EMAIL ? 'admin' : 'aluno',
                    display_name: newSession.user.email?.split('@')[0] ?? 'Usuário',
                    created_at: new Date().toISOString(),
                  };
                  setProfile(userProfile);
                }
              }
            }
          }
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          clearProfileCache();
        }
      } catch (error) {
        console.error('Erro no onAuthStateChange:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  // JWT: em aba em segundo plano o navegador suspende timers; ao voltar o access token pode estar expirado.
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
    // Limpar o estado local imediatamente para evitar travamentos na UI
    if (user) {
      try {
        localStorage.removeItem(`lioness_profile_${user.id}`);
      } catch (e) {}
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) console.error('Erro no signOut:', error.message);
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
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
