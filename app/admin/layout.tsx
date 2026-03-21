'use client';

import React from 'react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { CollapsibleSidebar } from '@/components/layout/CollapsibleSidebar';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <CollapsibleSidebar variant="admin" />
      {/*
        We use a CSS class approach instead of inline margin to avoid drift.
        The sidebar is 68px collapsed, 220px expanded. We give main a left padding
        matching the collapsed width and let overflow manage itself gracefully.
      */}
      <main className="flex-1 overflow-x-hidden transition-all duration-200 ease-in-out"
        style={{ marginLeft: 'var(--sidebar-w, 68px)' }}>
        <div id="__admin-content" className="p-6 md:p-8 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard allowedRoles={['OWNER', 'MANAGER']}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </PermissionGuard>
  );
}
