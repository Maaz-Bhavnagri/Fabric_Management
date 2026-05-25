'use client';

import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  FileText,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Tag,
} from 'lucide-react';
import { useCameraContext } from '@/context/CameraContext';
import { useState, useEffect } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const supabase = createClient();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { deviceStatus, activeDevice } = useCameraContext();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: t('nav.dashboard'),
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: '/inventory',
      label: t('nav.inventory'),
      icon: <Package className="w-5 h-5" />,
    },
    {
      href: '/orders',
      label: t('nav.sales'),
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      href: '/customers',
      label: t('nav.customers'),
      icon: <Users className="w-5 h-5" />,
    },
    {
      href: '/suppliers',
      label: t('nav.suppliers'),
      icon: <Truck className="w-5 h-5" />,
    },
    {
      href: '/reports',
      label: t('nav.reports'),
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  const adminItems: NavItem[] = [
    {
      href: '/admin/stitch-types',
      label: 'Stitch Types',
      icon: <Tag className="w-5 h-5" />,
    },
    {
      href: '/admin/tailors',
      label: 'Tailors',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-4 z-50 md:hidden bg-white dark:bg-slate-900 border border-border p-2 rounded-xl shadow-sm"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Logo Section */}
        <div className={`p-6 flex items-center justify-between transition-all duration-300 ${collapsed ? 'md:px-4' : 'md:px-6'}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Package className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">KapadMitra</h1>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Management</p>
            </div>
          </div>
          
          {/* Logo for collapsed state */}
          <div className={`hidden md:flex shrink-0 ${collapsed ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex absolute -right-3 top-12 w-6 h-6 bg-white dark:bg-slate-800 border border-border rounded-full items-center justify-center shadow-md hover:bg-slate-50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : ''}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  } ${collapsed ? 'md:justify-center md:px-2' : ''}`}
                >
                  <span className={`shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm font-medium transition-all duration-300 ${collapsed ? 'md:w-0 md:opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Admin Section */}
          {!collapsed && (
            <div className="pt-4 border-t border-sidebar-border mt-4">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">Admin</p>
              </div>
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} title={collapsed ? item.label : ''}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                        isActive
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                          : 'text-sidebar-foreground/70 hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:text-violet-600'
                      }`}
                    >
                      <span className={`shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>
                        {item.icon}
                      </span>
                      <span className={`text-sm font-medium transition-all duration-300`}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className={`p-3 border-t border-sidebar-border space-y-1 ${collapsed ? 'md:px-2' : ''}`}>
          {/* Camera Device Status */}
          <Link href="/settings/devices" title={collapsed ? 'Mobile Camera' : ''}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
              deviceStatus === 'connected'
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            } ${collapsed ? 'md:justify-center md:px-2' : ''}`}>
              <div className="relative shrink-0">
                <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {deviceStatus === 'connected' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
                )}
              </div>
              <div className={`transition-all duration-300 ${collapsed ? 'md:w-0 md:opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                <span className="text-sm font-medium block leading-tight">
                  Mobile Camera
                </span>
                {deviceStatus === 'connected' && activeDevice && (
                  <span className="text-[10px] font-semibold text-emerald-500 leading-none">
                    {activeDevice.deviceName} connected
                  </span>
                )}
                {deviceStatus === 'unpaired' && (
                  <span className="text-[10px] font-semibold text-muted-foreground leading-none">
                    Tap to pair
                  </span>
                )}
              </div>
            </div>
          </Link>
          <Link href="/profile" title={collapsed ? t('nav.profile') : ''}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer group ${collapsed ? 'md:justify-center md:px-2' : ''}`}>
              <User className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              <span className={`text-sm font-medium transition-all duration-300 ${collapsed ? 'md:w-0 md:opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                {t('nav.profile')}
              </span>
            </div>
          </Link>
          <Link href="/settings" title={collapsed ? t('nav.settings') : ''}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer group ${collapsed ? 'md:justify-center md:px-2' : ''}`}>
              <Settings className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              <span className={`text-sm font-medium transition-all duration-300 ${collapsed ? 'md:w-0 md:opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                {t('nav.settings')}
              </span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title={collapsed ? t('nav.logout') : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group ${collapsed ? 'md:justify-center md:px-2' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className={`text-sm font-medium transition-all duration-300 ${collapsed ? 'md:w-0 md:opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
              {t('nav.logout')}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
