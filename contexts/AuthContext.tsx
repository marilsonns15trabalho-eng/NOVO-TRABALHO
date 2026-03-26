'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, refreshSessionIfStale } from '@/lib/supabase';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import type { User, Session } from '@supabase/supabase-js';

import { clearAlunosCache } from '@/lib/cache/alunosCache';
import { clearTreinosCache } from '@/lib/cache/treinosCache';

export type UserRole = 'admin' | 'professor' | 'aluno' | 'unknown';

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name?: string;
  created_at?: string;
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

const CACHE_KEY = (userId: string) => `profile_cache_${userId}`;
const CACHE_TTL = 1000 * 60 * 10;

// ================= CACHE =================

function saveProfileCache(profile: UserProfile) {
  try {
    localStorage.setItem(
      CACHE_KEY(profile.id),
      JSON.stringify({
        data: profile,
        timestamp: Date.now()
      })
    );
  } catch {}
}

function getProfileCache(userId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

function clearProfileCache(userId: string) {
  try {
    localStorage.removeItem(CACHE_KEY(userId));
  } catch {}
}

// ================= BACKEND =================

async function ensureUserSetup(user: User, displayName?: string): Promise<UserProfile | null> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) return data;

    const role = user.email === SUPER_ADMIN_EMAIL ? 'admin' : 'aluno';

    const { data: created } = await supabase
      .from('user_profiles')
      .insert([{
        id: user.id,
        role,
        display_name: displayName || user.email
      }])
      .select()
      .single();

    return created;
  } catch (err) {
    console.warn('ensureUserSetup falhou:', err);
    return null;
  }
}

// ================= PROVIDER =================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const initialized = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {

      // ===== LOGOUT =====
      if (event === 'SIGNED_OUT') {
        if (user) {
          clearProfileCache(user.id);
          clearAlunosCache(user.id);
          clearTreinosCache(user.id);
        }

        initialized.current = null;
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // ===== LOGIN / RESTORE =====
      if (newSession?.user) {
        const currentUser = newSession.user;

        setUser(currentUser);
        setSession(newSession);

        // 🔥 evita reprocessar mesmo usuário
        if (initialized.current === currentUser.id) {
          setLoading(false);
          return;
        }

        initialized.current = currentUser.id;

        // ===== CACHE FIRST =====
        const cached = getProfileCache(currentUser.id);

        if (cached) {
          setProfile(cached);
        } else {
          // fallback seguro
          setProfile({
            id: currentUser.id,
            role: 'unknown',
            display_name: currentUser.email ?? 'Usuário'
          });
        }

        // ===== BACKGROUND SYNC =====
        Promise.race([
          ensureUserSetup(currentUser),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 4000)
          )
        ])
        .then((data) => {
          if (!data) return;

          setProfile((prev) => {
            if (!prev) {
              saveProfileCache(data);
              return data;
            }

            // 🔥 NÃO SOBRESCREVE ADMIN
            if (prev.role === 'admin') {
              data.role = 'admin';
            }

            const changed =
              prev.role !== data.role ||
              prev.display_name !== data.display_name;

            if (changed) {
              saveProfileCache(data);
              return data;
            }

            return prev;
          });
        })
        .catch((err) => {
          console.warn('Profile sync falhou (ok):', err);
        });
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ===== SESSION RECOVERY =====
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        refreshSessionIfStale();
      }
    };

    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);

    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);

  // ===== ACTIONS =====

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { error: error.message };

    if (data.user) {
      ensureUserSetup(data.user, name);
    }

    return { error: null };
  };

  const signOut = async () => {
    if (user) {
      clearProfileCache(user.id);
      clearAlunosCache(user.id);
      clearTreinosCache(user.id);
    }

    initialized.current = null;

    setUser(null);
    setSession(null);
    setProfile(null);

    await supabase.auth.signOut();
  };

  const updateRole = async (userId: string, newRole: UserRole) => {
    if (profile?.role !== 'admin') {
      return { error: 'Sem permissão' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    return { error: error?.message ?? null };
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
      updateRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do provider');
  return ctx;
}