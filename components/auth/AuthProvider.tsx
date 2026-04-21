'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, UserRole } from '@/store/useAuthStore';
import { Toaster } from 'react-hot-toast';

const AUTH_CACHE_KEY = 'karigar:auth-user';
const ROLE_CACHE_KEY = 'karigar:role-cache';
const ROLE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL; // Fallback for owner
  const { setUser, setLoading } = useAuthStore();

  async function resolveRole(email: string, userId: string): Promise<UserRole> {
    const normalizedEmail = email.trim().toLowerCase();
    // 1. Check if the email matches admin override
    if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL.trim().toLowerCase()) return 'OWNER';

    if (typeof window !== 'undefined') {
      const roleCache = safeJsonParse<Record<string, { role: UserRole; expiresAt: number }>>(
        window.localStorage.getItem(ROLE_CACHE_KEY)
      );
      const cached = roleCache?.[normalizedEmail];
      if (cached && cached.expiresAt > Date.now() && cached.role) {
        return cached.role;
      }
    }

    // 2. Query staff_profiles table
    const { data } = await supabase
      .from('staff_profiles')
      .select('id, role, user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (data) {
      // 3. Link user_id on first login
      if (!data.user_id) {
        await supabase
          .from('staff_profiles')
          .update({ user_id: userId })
          .eq('email', normalizedEmail);
      }
      const role = data.role as UserRole;
      if (typeof window !== 'undefined') {
        const roleCache =
          safeJsonParse<Record<string, { role: UserRole; expiresAt: number }>>(
            window.localStorage.getItem(ROLE_CACHE_KEY)
          ) || {};
        roleCache[normalizedEmail] = { role, expiresAt: Date.now() + ROLE_CACHE_TTL_MS };
        window.localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(roleCache));
      }
      return role;
    }

    // 4. Default to customer
    return 'CUSTOMER';
  }

  function cacheUser(user: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    avatar_url?: string;
  } | null) {
    if (typeof window === 'undefined') return;
    if (!user) {
      window.localStorage.removeItem(AUTH_CACHE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
  }

  useEffect(() => {
    let mounted = true;

    const hydrateFromCache = () => {
      if (typeof window === 'undefined') return;
      const parsed = safeJsonParse<{
        id: string;
        email: string;
        role: UserRole;
        name: string;
        avatar_url?: string;
      }>(window.localStorage.getItem(AUTH_CACHE_KEY));
      if (!parsed) return;
      setUser(parsed);
      setLoading(false);
    };

    const setUserFromSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!mounted) return;
      if (session?.user) {
        const role = await resolveRole(session.user.email!, session.user.id);
        if (!mounted) return;
        const nextUser = {
          id: session.user.id,
          email: session.user.email!,
          role,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        setUser(nextUser);
        cacheUser(nextUser);
      } else {
        setUser(null);
        cacheUser(null);
      }
      setLoading(false);
    };

    hydrateFromCache();

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Session error:', error);
        setLoading(false);
        return;
      }
      await setUserFromSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        cacheUser(null);
        setLoading(false);
        return;
      }
      await setUserFromSession(session);
    });

    const refreshOnFocus = async () => {
      if (document.visibilityState === 'visible') {
        await supabase.auth.refreshSession();
      }
    };

    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', refreshOnFocus);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '3px solid #FFE500',
            borderRadius: '0px',
            boxShadow: '4px 4px 0px #FFE500',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          },
          success: { style: { border: '3px solid #639922', boxShadow: '4px 4px 0px #639922' } },
          error: { style: { border: '3px solid #E24B4A', boxShadow: '4px 4px 0px #E24B4A' } }
        }}
      />
    </>
  );
}
