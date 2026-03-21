'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, UserRole } from '@/store/useAuthStore';
import { Toaster } from 'react-hot-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL; // Fallback for owner
  const { setUser, setLoading } = useAuthStore();

  async function resolveRole(email: string, userId: string): Promise<UserRole> {
    // 1. Check if the email matches admin override
    if (ADMIN_EMAIL && email === ADMIN_EMAIL) return 'OWNER';

    // 2. Query staff_profiles table
    const { data } = await supabase
      .from('staff_profiles')
      .select('id, role, user_id')
      .eq('email', email)
      .maybeSingle();

    if (data) {
      // 3. Link user_id on first login
      if (!data.user_id) {
        await supabase
          .from('staff_profiles')
          .update({ user_id: userId })
          .eq('email', email);
      }
      return data.role as UserRole;
    }

    // 4. Default to customer
    return 'CUSTOMER';
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        setUser(null);
        return;
      }

      if (session?.user) {
        const role = await resolveRole(session.user.email!, session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = await resolveRole(session.user.email!, session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
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
