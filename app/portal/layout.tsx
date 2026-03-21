'use client';

import React from 'react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { CollapsibleSidebar } from '@/components/layout/CollapsibleSidebar';
import { Home, Car, Receipt, User, Star } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BOTTOM_NAV = [
  { href: '/portal/home', icon: Home, label: 'Home' },
  { href: '/portal/vehicles', icon: Car, label: 'Garage' },
  { href: '/portal/invoices', icon: Receipt, label: 'Pay' },
  { href: '/portal/review', icon: Star, label: 'Review' },
  { href: '/portal/profile', icon: User, label: 'Profile' },
];

function PortalLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-cream text-[#1a1a1a]">
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:block">
        <CollapsibleSidebar variant="customer" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden md:transition-all md:duration-200"
        style={{ marginLeft: 'var(--sidebar-w, 0px)' }}>

        {/* Mobile sticky header */}
        <header className="md:hidden bg-white text-[#1a1a1a] px-4 py-4 flex justify-center items-center sticky top-0 z-40 border-b-4 border-[#1a1a1a]">
          <h1 className="text-2xl font-black tracking-widest uppercase">Karigar</h1>
        </header>

        <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-4 border-[#1a1a1a] flex justify-around items-center h-16 z-50 shadow-[0_-4px_0_rgba(0,0,0,0.1)]">
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${active ? 'text-[#1a1a1a] bg-cream border-t-4 border-t-electricYellow' : 'text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-100 border-t-4 border-t-transparent'}`}
            >
              <Icon size={22} strokeWidth={active ? 3 : 2} />
              <span className="text-[9px] font-black tracking-widest uppercase">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard allowedRoles={['CUSTOMER']}>
      <PortalLayoutInner>{children}</PortalLayoutInner>
    </PermissionGuard>
  );
}
