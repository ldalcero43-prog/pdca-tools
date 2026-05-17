'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { api } from '@/lib/api-client';
import { cn, formatDate, STATUS_LABELS, PRIORITY_LABELS, PHASE_LABELS } from '@/lib/utils';
import { Plus, Search, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { seedDemoProject } from '@/lib/demo-seed';

interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  priority: string;
  methodology: string;
  currentPhase: string;
  completionPercentage: number;
  ownerName: string;
  categoryName: string | null;
  areaName: string | null;
  targetDate: string | null;
  taskCount: number;
  memberCount: number;
  updatedAt: string;
}

const STATUS_FILTERS = ['all', 'DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-[#DC2626]',
  HIGH: 'bg-[#D97706]',
  MEDIUM: 'bg-[#555555]',
  LOW: 'bg-[#AAAAAA]',
};
const PHASE_COLORS: Record<string, string> = {
  PLAN: 'text-[#2563EB]',
  DO: 'text-[#D97706]',
  CHECK: 'text-[#16A34A]',
  ACT: 'text-[#7C3AED]',
};

export default function ProjectsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  async function loadProjects() {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get<any>('/projects', params);
      const list = res?.data || (Array.isArray(res) ? res : []);
      setProjects(list);
      setTotal(res?.meta?.total || list.length);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadDemo() {
    if (!user) return;
    setSeeding(true);
    try {
      const projId = seedDemoProject(user.id, user.organizationId);
      await loadProjects();
      router.push(`/projects/${projId}`);
    } finally {
      setSeeding(false);
    }
  }

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <>
      <TopBar
        title="Projetos"
        subtitle={`${total} projeto${total !== 1 ? 's' : ''}`}
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
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProjects()}
                placeholder="Buscar projetos..."
                className="w-full pl-8 pr-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 border border-[#E5E5E5] bg-white px-1 py-1">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium transition-colors',
                    statusFilter === s
                      ? 'bg-[#111111] text-white'
                      : 'text-[#555555] hover:bg-[#F4F4F4]',
                  )}
                >
                  {s === 'all' ? 'Todos' : STATUS_LABELS[s] || s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#E5E5E5]">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#888888]">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-sm font-medium text-[#111111] mb-1">Nenhum projeto ainda</p>
                <p className="text-[13px] text-[#888888] mb-6">Crie seu primeiro projeto ou carregue um exemplo completo para explorar a plataforma.</p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#111111] text-[#111111] text-xs font-medium hover:bg-[#F4F4F4] transition-colors"
                  >
                    <Plus size={12} />
                    Criar Projeto
                  </Link>
                  <button
                    onClick={handleLoadDemo}
                    disabled={seeding}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-60 transition-colors"
                  >
                    <Sparkles size={12} />
                    {seeding ? 'Carregando...' : 'Carregar Projeto Demo'}
                  </button>
                </div>
                <p className="text-[11px] text-[#AAAAAA] mt-4">O projeto demo mostra um caso real de redução de lead time com todas as ferramentas preenchidas.</p>
              </div>
            ) : (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Código</th>
                    <th>Projeto</th>
                    <th style={{ width: 100 }}>Fase</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 150 }}>Progresso</th>
                    <th style={{ width: 100 }}>Prazo</th>
                    <th style={{ width: 120 }}>Responsável</th>
                    <th style={{ width: 80 }}>Membros</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project) => (
                    <tr
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <td>
                        <span className="font-mono text-[11px] text-[#888888]">{project.code}</span>
                      </td>
                      <td>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_COLORS[project.priority])}
                              title={PRIORITY_LABELS[project.priority]}
                            />
                            <span className="font-medium text-[#111111] text-sm leading-tight">{project.name}</span>
                          </div>
                          {project.areaName && (
                            <span className="text-[11px] text-[#888888] ml-3.5">{project.areaName}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={cn('text-xs font-medium', PHASE_COLORS[project.currentPhase])}>
                          {PHASE_LABELS[project.currentPhase] || project.currentPhase}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-[#555555]">{STATUS_LABELS[project.status] || project.status}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#111111] rounded-full"
                              style={{ width: `${project.completionPercentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[#888888] w-7 text-right shrink-0">
                            {project.completionPercentage}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          'text-xs',
                          project.targetDate && new Date(project.targetDate) < new Date() && project.status !== 'COMPLETED'
                            ? 'text-[#DC2626]'
                            : 'text-[#555555]',
                        )}>
                          {formatDate(project.targetDate)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-[#555555]">{project.ownerName}</span>
                      </td>
                      <td>
                        <span className="text-xs text-[#888888]">{project.memberCount || 1}</span>
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
