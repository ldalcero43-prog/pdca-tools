'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  BookOpen,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projetos', icon: FolderKanban },
  { href: '/executive', label: 'Executivo', icon: TrendingUp, minRole: 'MANAGER' },
  { href: '/knowledge', label: 'Base de Conhecimento', icon: BookOpen },
];

const ADMIN_ITEMS = [
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

const ROLE_HIERARCHY: Record<string, number> = { ADMIN: 5, MANAGER: 4, FACILITATOR: 3, MEMBER: 2, VIEWER: 1 };

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  function hasAccess(minRole?: string) {
    if (!minRole || !user) return true;
    return (ROLE_HIERARCHY[user.role] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-[#E5E5E5] transition-all duration-200',
        sidebarCollapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-[52px] px-4 border-b border-[#E5E5E5]', sidebarCollapsed && 'justify-center px-0')}>
        {sidebarCollapsed ? (
          <Link href="/dashboard">
            <Image src="/logo-plannr.png" alt="Plannr" width={28} height={28} className="rounded-sm" />
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo-plannr.png" alt="Plannr" width={24} height={24} className="rounded-sm shrink-0" />
            <span className="text-sm font-semibold text-[#111111] tracking-tight">Plannr</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {!sidebarCollapsed && (
          <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
            Principal
          </p>
        )}

        {NAV_ITEMS.filter((item) => hasAccess(item.minRole)).map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            collapsed={sidebarCollapsed}
          />
        ))}

        {hasAccess('ADMIN') && (
          <>
            {!sidebarCollapsed && (
              <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
                Admin
              </p>
            )}
            {ADMIN_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname.startsWith(item.href)}
                collapsed={sidebarCollapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className={cn('border-t border-[#E5E5E5] p-3', sidebarCollapsed && 'flex justify-center')}>
          {sidebarCollapsed ? (
            <div className="w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-medium">
                {user.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-medium">
                  {user.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#111111] truncate">{user.name}</p>
                <p className="text-[10px] text-[#888888] truncate">{user.organizationName}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-8 border-t border-[#E5E5E5] hover:bg-[#F4F4F4] transition-colors text-[#888888] hover:text-[#111111]"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: any;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 mx-2 px-2 py-2 rounded-sm text-xs font-medium transition-colors',
        active
          ? 'bg-[#F4F4F4] text-[#111111] border-l-2 border-[#111111] pl-[6px]'
          : 'text-[#555555] hover:bg-[#F9F9F9] hover:text-[#111111]',
        collapsed && 'justify-center mx-1 px-0',
      )}
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
