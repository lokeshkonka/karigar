'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Wrench, Car, Users, Package, Receipt,
  CalendarDays, Map, BarChart, UserSquare2, Settings,
  LogOut, Star, DollarSign, QrCode, Home, PanelLeftClose, PanelLeft, PanelRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// ─── Nav item definitions per role ───────────────────────────────────────────

const ADMIN_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/admin/dashboard' },
  { icon: Wrench,          label: 'Work Orders',  href: '/admin/jobs' },
  { icon: DollarSign,      label: 'Payouts',      href: '/admin/payouts' },
  { icon: Package,         label: 'Parts',        href: '/admin/parts' },
  { icon: Car,             label: 'Vehicles',     href: '/admin/vehicles' },
  { icon: Users,           label: 'Customers',    href: '/admin/customers' },
  { icon: Package,         label: 'Inventory',    href: '/admin/inventory' },
  { icon: Receipt,         label: 'Invoicing',    href: '/admin/invoices' },
  { icon: CalendarDays,    label: 'Scheduling',   href: '/admin/schedule' },
  { icon: Map,             label: 'Garage Map',   href: '/admin/garage-map' },
  { icon: BarChart,        label: 'Reports',      href: '/admin/reports' },
  { icon: Star,            label: 'Reviews',      href: '/admin/reviews' },
  { icon: UserSquare2,     label: 'Staff',        href: '/admin/staff' },
  { icon: Settings,        label: 'Settings',     href: '/admin/settings' },
];

const STAFF_ITEMS = [
  { icon: Wrench,     label: 'My Jobs',    href: '/staff/dashboard' },
  { icon: Users,      label: 'Customers',  href: '/staff/customers' },
  { icon: CalendarDays,label: 'Schedule',  href: '/staff/schedule' },
  { icon: Map,        label: 'Garage Map', href: '/staff/garage-map' },
  { icon: QrCode,     label: 'Scan',       href: '/staff/scan' },
  { icon: DollarSign, label: 'Payouts',    href: '/staff/payouts' },
  { icon: Star,       label: 'Reviews',    href: '/staff/reviews' },
];

const CUSTOMER_ITEMS = [
  { icon: Home,        label: 'Home',     href: '/portal/home' },
  { icon: Car,         label: 'My Garage',href: '/portal/vehicles' },
  { icon: Receipt,     label: 'Invoices', href: '/portal/invoices' },
  { icon: Star,        label: 'Reviews',  href: '/portal/review' },
  { icon: UserSquare2, label: 'Profile',  href: '/portal/profile' },
];

type SidebarVariant = 'admin' | 'staff' | 'customer';

interface CollapsibleSidebarProps {
  variant: SidebarVariant;
}

const VARIANT_CONFIG = {
  admin: {
    items: ADMIN_ITEMS,
    roleBadge: 'ADMIN',
    bg: 'bg-[#1a1a1a]',
    activeColor: 'text-electricYellow border-electricYellow',
    activeBg: 'bg-white/5',
    hoverColor: 'hover:text-white hover:bg-white/5',
    textColor: 'text-gray-400',
    borderColor: 'border-white/10',
    roleColor: 'text-electricYellow',
    roleBadgeCls: 'bg-electricYellow text-[#1a1a1a]',
    accentBg: 'bg-black/20',
    iconInvert: true,
  },
  staff: {
    items: STAFF_ITEMS,
    roleBadge: 'TECH',
    bg: 'bg-white',
    activeColor: 'text-[#1a1a1a] border-[#1a1a1a]',
    activeBg: 'bg-cream',
    hoverColor: 'hover:text-[#1a1a1a] hover:bg-cream',
    textColor: 'text-gray-500',
    borderColor: 'border-[#1a1a1a]/10',
    roleColor: 'text-blue',
    roleBadgeCls: 'bg-blue text-white',
    accentBg: 'bg-gray-50',
    iconInvert: false,
  },
  customer: {
    items: CUSTOMER_ITEMS,
    roleBadge: 'PORTAL',
    bg: 'bg-white',
    activeColor: 'text-[#1a1a1a] border-[#1a1a1a]',
    activeBg: 'bg-cream',
    hoverColor: 'hover:text-[#1a1a1a] hover:bg-cream',
    textColor: 'text-gray-500',
    borderColor: 'border-[#1a1a1a]/10',
    roleColor: 'text-orange',
    roleBadgeCls: 'bg-orange text-white',
    accentBg: 'bg-gray-50',
    iconInvert: false,
  },
};

export function CollapsibleSidebar({ variant }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const cfg = VARIANT_CONFIG[variant];

  // Sync state with global CSS variable for layout padding
  useEffect(() => {
    const W = collapsed ? '68px' : '220px';
    document.documentElement.style.setProperty('--sidebar-w', W);
  }, [collapsed]);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    toast.success('Signed out');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[220px]'} ${cfg.bg} flex flex-col border-r-4 ${cfg.borderColor} z-50`}
    >
      {/* ── Logo Section ── */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-4'} border-b-2 ${cfg.borderColor} shrink-0 h-[64px] relative`}>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Image 
              src="/icon.png" 
              alt="Logo" 
              width={32} 
              height={32} 
              className={cfg.iconInvert ? 'brightness-150 grayscale invert' : ''}
            />
            <span className={`text-xl font-black uppercase tracking-tighter ${cfg.iconInvert ? 'text-white' : 'text-[#1a1a1a]'}`}>Karigar</span>
          </div>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-md hover:bg-black/5 transition-colors ${collapsed ? '' : 'ml-auto'}`}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <PanelRight size={22} className={cfg.iconInvert ? 'text-electricYellow' : 'text-[#1a1a1a]'} strokeWidth={3} />
          ) : (
            <PanelLeft size={22} className={cfg.iconInvert ? 'text-electricYellow' : 'text-[#1a1a1a]'} strokeWidth={3} />
          )}
        </button>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-hide">
        <ul className="flex flex-col gap-0.5">
          {cfg.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center py-3.5 border-l-[4px] transition-all
                    ${collapsed ? 'justify-center' : 'px-5 gap-3'}
                    ${isActive
                      ? `${cfg.activeColor} ${cfg.activeBg}`
                      : `${cfg.textColor} border-transparent ${cfg.hoverColor}`
                    }
                  `}
                >
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 3 : 2}
                    className="shrink-0"
                  />
                  {!collapsed && (
                    <span className="font-bold uppercase text-xs tracking-widest truncate">{item.label}</span>
                  )}
                </Link>
                {/* Tooltip on collapse */}
                {collapsed && (
                  <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10 rounded-sm">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User Footer ── */}
      <div className={`shrink-0 border-t-2 ${cfg.borderColor} ${cfg.accentBg} py-3 flex flex-col items-center gap-2`}>
        {/* Avatar */}
        <div
          className={`bg-electricYellow border-2 border-white/20 flex items-center justify-center font-black text-[#1a1a1a] shrink-0 relative group transition-all duration-300
            ${collapsed ? 'w-9 h-9 text-base' : 'w-12 h-12 text-xl'}
          `}
        >
          {user?.name?.[0]?.toUpperCase() || '?'}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a1a] text-white text-xs font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 rounded-sm">
              {user?.name || 'User'} · {cfg.roleBadge}
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="flex flex-col items-center px-2 w-full">
            <p className={`font-black uppercase text-xs truncate w-full text-center ${cfg.iconInvert ? 'text-white' : 'text-[#1a1a1a]'}`}>
              {user?.name || 'User'}
            </p>
            <span className={`text-[9px] font-black px-1.5 py-0.5 tracking-widest uppercase ${cfg.roleBadgeCls}`}>
              {cfg.roleBadge}
            </span>
          </div>
        )}

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className={`flex items-center justify-center p-2 text-red hover:bg-red/10 transition-colors relative group
            ${collapsed ? '' : 'w-full gap-2 mt-1'}
          `}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
          {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
