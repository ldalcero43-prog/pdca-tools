'use client';

import { useRouter } from 'next/navigation';
import { Bell, Bot, LogOut, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const router = useRouter();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const { toggleAiPanel, aiPanelOpen } = useUiStore();

  async function handleLogout() {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    clearAuth();
    router.push('/login');
  }

  return (
    <header className="h-[52px] flex items-center justify-between px-6 bg-white border-b border-[#E5E5E5] shrink-0">
      <div>
        {title && <h1 className="text-sm font-semibold text-[#111111]">{title}</h1>}
        {subtitle && <p className="text-xs text-[#888888]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-1">
        {actions}

        {/* AI Copilot */}
        <button
          onClick={toggleAiPanel}
          title="AI Copilot"
          className={cn(
            'p-2 rounded-sm transition-colors text-[#555555] hover:bg-[#F4F4F4]',
            aiPanelOpen && 'bg-[#F4F4F4] text-[#111111]',
          )}
        >
          <Bot size={16} />
        </button>

        {/* Notifications */}
        <button
          title="Notificações"
          className="p-2 rounded-sm transition-colors text-[#555555] hover:bg-[#F4F4F4]"
        >
          <Bell size={16} />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#E5E5E5]">
          <div className="w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-medium">
              {user?.name.substring(0, 2).toUpperCase()}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Sair"
            className="p-1.5 rounded-sm text-[#888888] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
