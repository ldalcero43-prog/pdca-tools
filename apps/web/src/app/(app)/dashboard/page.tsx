'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { cn, formatDate, formatRelative, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils';
import { Plus, ArrowRight, Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  status: string;
  priority: string;
  currentPhase: string;
  completionPercentage: number;
  ownerName: string;
  targetDate: string | null;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-[#888888] bg-[#F9F9F9] border-[#E5E5E5]',
  ACTIVE: 'text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]',
  ON_HOLD: 'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]',
  COMPLETED: 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]',
};

const PHASE_COLORS: Record<string, string> = {
  PLAN: 'bg-[#2563EB]',
  DO: 'bg-[#D97706]',
  CHECK: 'bg-[#16A34A]',
  ACT: 'bg-[#7C3AED]',
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, delayed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: ProjectSummary[]; meta: any }>('/projects', { limit: 10 });
        const data = (res as any).data || res;
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        setStats({
          total: list.length,
          active: list.filter((p: any) => p.status === 'ACTIVE').length,
          completed: list.filter((p: any) => p.status === 'COMPLETED').length,
          delayed: list.filter((p: any) => p.targetDate && new Date(p.targetDate) < new Date() && p.status !== 'COMPLETED').length,
        });
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total de Projetos', value: stats.total, icon: TrendingUp, color: 'text-[#111111]' },
    { label: 'Ativos', value: stats.active, icon: CheckCircle2, color: 'text-[#16A34A]' },
    { label: 'Concluídos', value: stats.completed, icon: CheckCircle2, color: 'text-[#2563EB]' },
    { label: 'Em Atraso', value: stats.delayed, icon: AlertCircle, color: 'text-[#DC2626]' },
  ];

  return (
    <>
      <TopBar
        title={`Bom dia, ${user?.name.split(' ')[0]}`}
        subtitle={user?.organizationName}
        actions={
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] transition-colors"
          >
            <Plus size={12} />
            Novo Projeto
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white border border-[#E5E5E5] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
                      {card.label}
                    </p>
                    <p className={cn('text-3xl font-semibold tracking-tight', card.color)}>
                      {loading ? '—' : card.value}
                    </p>
                  </div>
                  <card.icon size={18} className={cn('opacity-30', card.color)} />
                </div>
              </div>
            ))}
          </div>

          {/* Projects table */}
          <div className="bg-white border border-[#E5E5E5]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
              <h2 className="text-sm font-semibold text-[#111111]">Projetos Recentes</h2>
              <Link href="/projects" className="text-xs text-[#555555] hover:text-[#111111] flex items-center gap-1">
                Ver todos <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#888888]">Carregando projetos...</div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-[#555555] mb-4">Nenhum projeto ainda</p>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] transition-colors"
                >
                  <Plus size={12} />
                  Criar primeiro projeto
                </Link>
              </div>
            ) : (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Projeto</th>
                    <th>Fase</th>
                    <th>Status</th>
                    <th>Progresso</th>
                    <th>Prazo</th>
                    <th>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <td>
                        <span className="font-mono text-[11px] text-[#888888]">{project.code}</span>
                      </td>
                      <td>
                        <span className="font-medium text-[#111111] text-sm">{project.name}</span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', PHASE_COLORS[project.currentPhase])} />
                          <span className="text-xs text-[#555555]">{project.currentPhase}</span>
                        </span>
                      </td>
                      <td>
                        <span className={cn('badge text-[10px]', STATUS_COLORS[project.status] || 'text-[#888888]')}>
                          {STATUS_LABELS[project.status] || project.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#F0F0F0] rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className="h-full bg-[#111111] rounded-full"
                              style={{ width: `${project.completionPercentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[#888888] w-8 text-right">
                            {project.completionPercentage}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          'text-xs',
                          project.targetDate && new Date(project.targetDate) < new Date()
                            ? 'text-[#DC2626]'
                            : 'text-[#555555]',
                        )}>
                          {formatDate(project.targetDate)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-[#555555]">{project.ownerName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
