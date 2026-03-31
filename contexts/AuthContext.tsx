'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getSafeSession,
  getUserProfileSafe,
  refreshSessionIfStale,
  supabase,
} from '@/lib/supabase';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import type { Session, User } from '@supabase/supabase-js';
import { clearAlunosCache } from '@/lib/cache/alunosCache';
import { clearTreinosCache } from '@/lib/cache/treinosCache';

export type UserRole = 'admin' | 'professor' | 'aluno';

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name?: string | null;
  created_at?: string;
  is_super_admin?: boolean;
  must_change_password?: boolean;
  secret_question?: string | null;
  password_recovery_enabled?: boolean;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  authError: string | null;
  loading: boolean;
  loadingSession: boolean;
  loadingProfile: boolean;
  isReady: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isProfessor: boolean;
  isAluno: boolean;
  clearAuthError: () => void;
  patchProfile: (patch: Partial<UserProfile>) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateRole: (userId: string, newRole: UserRole) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY = (userId: string) => `profile_cache_${userId}`;
const CACHE_TTL = 1000 * 60 * 10;
const PROFILE_SYNC_COOLDOWN_MS = 1000 * 60;
const INACTIVITY_TIMEOUT_MS = 1000 * 60 * 60 * 2;
const AUTH_FLASH_MESSAGE_KEY = 'lioness-auth-flash-message';

function isValidRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'professor' || value === 'aluno';
}

function normalizeProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || !isValidRole(candidate.role)) return null;

  return {
    id: candidate.id,
    role: candidate.role,
    display_name:
      typeof candidate.display_name === 'string' || candidate.display_name === null
        ? candidate.display_name
        : undefined,
    created_at: typeof candidate.created_at === 'string' ? candidate.created_at : undefined,
    is_super_admin: Boolean(candidate.is_super_admin),
    must_change_password: Boolean(candidate.must_change_password),
    secret_question:
      typeof candidate.secret_question === 'string' || candidate.secret_question === null
        ? candidate.secret_question
        : null,
    password_recovery_enabled: Boolean(candidate.password_recovery_enabled),
    avatar_path:
      typeof candidate.avatar_path === 'string' || candidate.avatar_path === null
        ? candidate.avatar_path
        : null,
    avatar_updated_at:
      typeof candidate.avatar_updated_at === 'string' || candidate.avatar_updated_at === null
        ? candidate.avatar_updated_at
        : null,
  };
}

function saveAuthFlashMessage(message: string) {
  try {
    sessionStorage.setItem(AUTH_FLASH_MESSAGE_KEY, message);
  } catch {}
}

function saveProfileCache(profile: UserProfile) {
  try {
    localStorage.setItem(
      CACHE_KEY(profile.id),
      JSON.stringify({
        data: profile,
        timestamp: Date.now(),
      })
    );
  } catch {}
}

function getProfileCache(userId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { data?: unknown; timestamp?: number };
    if (typeof parsed.timestamp !== 'number') return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null;

    return normalizeProfile(parsed.data);
  } catch {
    return null;
  }
}

function clearProfileCache(userId: string) {
  try {
    localStorage.removeItem(CACHE_KEY(userId));
  } catch {}
}

async function ensureUserSetup(user: User, displayName?: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, role, display_name, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao buscar user_profiles:', error);
      return null;
    }

    const existingProfile = normalizeProfile(data);
    if (existingProfile) return existingProfile;

    const role: UserRole = user.email === SUPER_ADMIN_EMAIL ? 'admin' : 'aluno';

    const { data: created, error: createError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: user.id,
          role,
          display_name: displayName || user.user_metadata?.name || user.email,
        },
      ])
      .select('id, role, display_name, created_at')
      .single();

    if (createError) {
      console.warn('Erro ao criar user_profiles:', createError);
      return null;
    }

    return normalizeProfile(created);
  } catch (err) {
    console.warn('ensureUserSetup falhou:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const latestRequestRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);
  const lastProfileSyncRef = useRef<Record<string, number>>({});
  const profileRef = useRef<UserProfile | null>(null);

  const clearUserCaches = useCallback((userId: string) => {
    clearProfileCache(userId);
    clearAlunosCache(userId);
    clearTreinosCache(userId);
  }, []);

  const resetAuthState = useCallback(() => {
    currentUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setAuthError(null);
    setLoadingProfile(false);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const patchProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((current) => {
      if (!current) return current;

      const nextProfile = {
        ...current,
        ...patch,
      };

      saveProfileCache(nextProfile);
      return nextProfile;
    });
  }, []);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const syncProfileForUser = useCallback(
    async (currentUser: User) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      currentUserIdRef.current = currentUser.id;

      const cachedProfile = getProfileCache(currentUser.id);
      setProfile(cachedProfile);
      setAuthError(null);
      setLoadingProfile(true);

      try {
        let syncedProfile: UserProfile | null = null;
        const lastSyncAt = lastProfileSyncRef.current[currentUser.id] ?? 0;
        const shouldUseNetworkSync =
          !cachedProfile || Date.now() - lastSyncAt >= PROFILE_SYNC_COOLDOWN_MS;

        if (shouldUseNetworkSync) {
          try {
            const safeProfile = await getUserProfileSafe();
            if (safeProfile?.id === currentUser.id) {
              syncedProfile = normalizeProfile(safeProfile);
            }
          } catch (error) {
            console.warn('Falha ao buscar profile seguro:', error);
            if (!cachedProfile) {
              setAuthError('Nao foi possivel carregar seu perfil de acesso. Faca login novamente.');
            }
          }
        } else {
          syncedProfile = cachedProfile;
        }

        if (latestRequestRef.current !== requestId || currentUserIdRef.current !== currentUser.id) {
          return;
        }

        if (!syncedProfile) {
          if (!cachedProfile) {
            clearProfileCache(currentUser.id);
            setProfile(null);
          }
          return;
        }

        saveProfileCache(syncedProfile);
        lastProfileSyncRef.current[currentUser.id] = Date.now();
        setProfile(syncedProfile);
        setAuthError(null);
      } finally {
        if (latestRequestRef.current === requestId && currentUserIdRef.current === currentUser.id) {
          setLoadingProfile(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    const applySession = async (newSession: Session | null) => {
      if (!active) return;

      setSession(newSession);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        resetAuthState();
        if (active) setLoadingSession(false);
        return;
      }

      await syncProfileForUser(nextUser);
      if (active) setLoadingSession(false);
    };

    void (async () => {
      try {
        const initialSession = await getSafeSession();
        await applySession(initialSession);
      } catch (error) {
        console.warn('Falha ao recuperar sessao inicial:', error);
        if (active) {
          resetAuthState();
          setLoadingSession(false);
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;

      if (!newSession?.user) {
        const previousUserId = currentUserIdRef.current;
        if (previousUserId) clearUserCaches(previousUserId);
        latestRequestRef.current += 1;
        resetAuthState();
        setLoadingSession(false);
        return;
      }

      const isSameUser = currentUserIdRef.current === newSession.user.id;
      const alreadyHydratedProfile =
        isSameUser && !!profileRef.current && profileRef.current.id === newSession.user.id;

      if (event === 'TOKEN_REFRESHED' && alreadyHydratedProfile) {
        setSession(newSession);
        setUser(newSession.user);
        setLoadingSession(false);
        return;
      }

      void applySession(newSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [clearUserCaches, resetAuthState, syncProfileForUser]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        void refreshSessionIfStale().catch((error) => {
          console.warn('Falha ao renovar sessao em foco:', error);
        });
      }
    };

    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);

    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) return { error: error.message };

    if (data.user) {
      await ensureUserSetup(data.user, name);
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (currentUserIdRef.current) {
      clearUserCaches(currentUserIdRef.current);
    }

    latestRequestRef.current += 1;
    resetAuthState();
    await supabase.auth.signOut();
  }, [clearUserCaches, resetAuthState]);

  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const armIdleTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        saveAuthFlashMessage('Sua sessao foi encerrada apos 2 horas de inatividade.');
        void signOut();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const registerActivity = () => {
      armIdleTimeout();
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'focus',
    ];

    armIdleTimeout();

    events.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true });
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      events.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
    };
  }, [signOut, user]);

  const updateRole = useCallback(
    async (userId: string, newRole: UserRole) => {
      if (profile?.role !== 'admin') {
        return { error: 'Sem permissao' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (!error && user?.id === userId) {
        const updatedProfile =
          profile && profile.id === userId ? { ...profile, role: newRole } : profile;
        if (updatedProfile) {
          saveProfileCache(updatedProfile);
          setProfile(updatedProfile);
        }
      }

      return { error: error?.message ?? null };
    },
    [profile, user]
  );

  const role = profile?.role ?? null;
  const isReady = !loadingSession && (!user || !loadingProfile);
  const loading = !isReady;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      role,
      authError,
      loading,
      loadingSession,
      loadingProfile,
      isReady,
      isAdmin: role === 'admin',
      isSuperAdmin: !!profile?.is_super_admin,
      isProfessor: role === 'professor',
      isAluno: role === 'aluno',
      clearAuthError,
      patchProfile,
      signIn,
      signUp,
      signOut,
      updateRole,
    }),
    [
      authError,
      clearAuthError,
      isReady,
      loading,
      loadingProfile,
      loadingSession,
      patchProfile,
      profile,
      role,
      session,
      signIn,
      signOut,
      signUp,
      updateRole,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do provider');
  return ctx;
}
