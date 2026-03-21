'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, UserRole } from '@/store/useAuthStore';
import { Loader } from '@/components/ui/Loader';

interface PermissionGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function PermissionGuard({ allowedRoles, children }: PermissionGuardProps) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in -> Redirect to login
        router.replace('/login');
      } else if (!allowedRoles.includes(user.role)) {
        // Logged in but wrong role -> Redirect based on role
        if (user.role === 'OWNER' || user.role === 'MANAGER') {
          router.replace('/admin/dashboard');
        } else if (user.role === 'TECHNICIAN') {
          router.replace('/staff/dashboard');
        } else if (user.role === 'CUSTOMER') {
          router.replace('/portal/home');
        }
      }
    }
  }, [user, isLoading, allowedRoles, router, pathname]);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  // If user exists and has the right role, render children
  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // Return null briefly while redirecting
  return null;
}
