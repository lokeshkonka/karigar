'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wrench, 
  Car, 
  Users, 
  Package, 
  Receipt, 
  CalendarDays, 
  Map, 
  BarChart, 
  UserSquare2, 
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  roles: string[];
}

const ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', roles: ['OWNER', 'MANAGER'] },
  { icon: Wrench, label: 'Work Orders', href: '/admin/jobs', roles: ['OWNER', 'MANAGER'] },
  { icon: Car, label: 'Vehicles', href: '/admin/vehicles', roles: ['OWNER', 'MANAGER'] },
  { icon: Users, label: 'Customers', href: '/admin/customers', roles: ['OWNER', 'MANAGER'] },
  { icon: Package, label: 'Inventory', href: '/admin/inventory', roles: ['OWNER', 'MANAGER'] },
  { icon: Receipt, label: 'Invoicing', href: '/admin/invoices', roles: ['OWNER', 'MANAGER'] },
  { icon: CalendarDays, label: 'Scheduling', href: '/admin/schedule', roles: ['OWNER', 'MANAGER'] },
  { icon: Map, label: 'Garage Map', href: '/admin/garage-map', roles: ['OWNER', 'MANAGER'] },
  { icon: BarChart, label: 'Reports', href: '/admin/reports', roles: ['OWNER', 'MANAGER'] },
  { icon: UserSquare2, label: 'Staff', href: '/admin/staff', roles: ['OWNER'] },
  { icon: Settings, label: 'Settings', href: '/admin/settings', roles: ['OWNER', 'MANAGER'] },
];

export function Sidebar({ userRole = 'MANAGER', userName = 'User' }: { userRole?: string, userName?: string }) {
  const pathname = usePathname();
  
  const filteredItems = ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#1a1a1a] text-white flex flex-col border-r-4 border-neo border-[#1a1a1a] z-50">
      <div className="p-6 border-b-4 border-white/10">
        <h1 className="text-3xl font-black text-electricYellow tracking-widest uppercase origin-left transform -skew-x-6">GarageOS</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all
                    ${isActive 
                      ? 'text-electricYellow border-l-[6px] border-electricYellow bg-white/5' 
                      : 'text-gray-300 border-l-[6px] border-transparent hover:text-white hover:bg-white/5 hover:border-white/20'
                    }`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t-4 border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-electricYellow border-2 border-white flex items-center justify-center font-black text-[#1a1a1a]">
            {userName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm truncate">{userName}</p>
            <p className="text-xs text-electricYellow font-black tracking-wider">{userRole}</p>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red text-white font-bold text-sm uppercase border-2 border-white hover:bg-red/80 transition-colors">
          <LogOut size={16} strokeWidth={3} />
          Logout
        </button>
      </div>
    </aside>
  );
}
