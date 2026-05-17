'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { api } from '@/lib/api-client';
import { cn, formatCurrency, formatDate, STATUS_LABELS, PHASE_LABELS } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

interface ExecutiveSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  onHoldProjects: number;
  totalEstimatedSavings: number;
  totalActualSavings: number;
  avgCompletionPercentage: number;
  projectsByPhase: { phase: string; count: number }[];
  projectsByPriority: { priority: string; count: number }[];
  recentActivity: { projectName: string; action: string; date: string }[];
  topProjects: {
    id: string;
    name: string;
    status: string;
    completionPercentage: number;
    estimatedSavings: number | null;
    targetDate: string | null;
    ownerName: string;
  }[];
}

const PHASE_COLORS: Record<string, string> = {
  PLAN: '#2563EB',
  DO: '#D97706',
  CHECK: '#16A34A',
  ACT: '#7C3AED',
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: '#AAAAAA',
  ACTIVE: '#16A34A',
  ON_HOLD: '#D97706',
  COMPLETED: '#2563EB',
};

export default function ExecutivePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Aggregate from projects API since we may not have a dedicated executive endpoint
        const res = await api.get<any>('/projects', { limit: 100 });
        const projects = (res as any)?.data || (Array.isArray(res) ? res : []);

        const totalEstimatedSavings = projects.reduce((sum: number, p: any) => sum + (p.estimatedSavings || 0), 0);
        const totalActualSavings = projects.reduce((sum: number, p: any) => sum + (p.actualSavings || 0), 0);
        const avgCompletion = projects.length > 0
          ? Math.round(projects.reduce((sum: number, p: any) => sum + (p.completionPercentage || 0), 0) / projects.length)
          : 0;

        const phaseCount: Record<string, number> = {};
        const priorityCount: Record<string, number> = {};
        projects.forEach((p: any) => {
          phaseCount[p.currentPhase] = (phaseCount[p.currentPhase] || 0) + 1;
          priorityCount[p.priority] = (priorityCount[p.priority] || 0) + 1;
        });

        setSummary({
          totalProjects: projects.length,
          activeProjects: projects.filter((p: any) => p.status === 'ACTIVE').length,
          completedProjects: projects.filter((p: any) => p.status === 'COMPLETED').length,
          delayedProjects: projects.filter((p: any) => p.targetDate && new Date(p.targetDate) < new Date() && p.status !== 'COMPLETED').length,
          onHoldProjects: projects.filter((p: any) => p.status === 'ON_HOLD').length,
          totalEstimatedSavings,
          totalActualSavings,
          avgCompletionPercentage: avgCompletion,
          projectsByPhase: Object.entries(phaseCount).map(([phase, count]) => ({ phase, count })),
          projectsByPriority: Object.entries(priorityCount).map(([priority, count]) => ({ priority, count })),
          recentActivity: [],
          topProjects: projects
            .sort((a: any, b: any) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0))
            .slice(0, 10),
        });
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const roiRealized = summary && summary.totalEstimatedSavings > 0
    ? Math.round((summary.totalActualSavings / summary.totalEstimatedSavings) * 100)
    : null;

  return (
    <>
      <TopBar
        title="Dashboard Executivo"
        subtitle="Visão consolidada do portfólio de projetos"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {loading ? (
            <div className="text-sm text-[#888888]">Carregando dados...</div>
          ) : !summary ? (
            <div className="text-sm text-[#888888]">Erro ao carregar dados</div>
          ) : (
            <>
              {/* KPI cards row */}
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: 'Total de Projetos', value: summary.totalProjects, icon: Target, color: 'text-[#111111]' },
                  { label: 'Ativos', value: summary.activeProjects, icon: CheckCircle2, color: 'text-[#16A34A]' },
                  { label: 'Concluídos', value: summary.completedProjects, icon: CheckCircle2, color: 'text-[#2563EB]' },
                  { label: 'Em Atraso', value: summary.delayedProjects, icon: AlertCircle, color: 'text-[#DC2626]' },
                  { label: 'Progresso Médio', value: `${summary.avgCompletionPercentage}%`, icon: TrendingUp, color: 'text-[#111111]' },
                ].map((card) => (
                  <div key={card.label} className="bg-white border border-[#E5E5E5] p-5">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">{card.label}</p>
                      <card.icon size={16} className={cn('opacity-30', card.color)} />
                    </div>
                    <p className={cn('text-3xl font-semibold tracking-tight', card.color)}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Financeiro */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-[#E5E5E5] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Savings Estimados</p>
                  <p className="text-2xl font-semibold text-[#111111]">{formatCurrency(summary.totalEstimatedSavings)}</p>
                  <p className="text-[11px] text-[#888888] mt-1">Potencial total do portfólio</p>
                </div>
                <div className="bg-white border border-[#E5E5E5] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Savings Realizados</p>
                  <p className="text-2xl font-semibold text-[#16A34A]">{formatCurrency(summary.totalActualSavings)}</p>
                  <p className="text-[11px] text-[#888888] mt-1">Resultado confirmado</p>
                </div>
                <div className="bg-white border border-[#E5E5E5] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">ROI Realizado</p>
                  <p className={cn('text-2xl font-semibold', roiRealized !== null ? (roiRealized >= 80 ? 'text-[#16A34A]' : roiRealized >= 40 ? 'text-[#D97706]' : 'text-[#DC2626]') : 'text-[#888888]')}>
                    {roiRealized !== null ? `${roiRealized}%` : '—'}
                  </p>
                  <p className="text-[11px] text-[#888888] mt-1">vs. savings estimados</p>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Projects by phase */}
                <div className="bg-white border border-[#E5E5E5] p-5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">Projetos por Fase PDCA</h3>
                  {summary.projectsByPhase.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={summary.projectsByPhase} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis
                          dataKey="phase"
                          tick={{ fontSize: 11, fill: '#888888' }}
                          axisLine={{ stroke: '#E5E5E5' }}
                          tickLine={false}
                          tickFormatter={(v) => PHASE_LABELS[v] || v}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#888888' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ border: '1px solid #E5E5E5', borderRadius: 2, fontSize: 11, padding: '6px 10px' }}
                          formatter={(v: number) => [v, 'Projetos']}
                          labelFormatter={(l) => PHASE_LABELS[l] || l}
                        />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {summary.projectsByPhase.map((entry) => (
                            <Cell key={entry.phase} fill={PHASE_COLORS[entry.phase] || '#111111'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-[#888888]">Sem dados</div>
                  )}
                </div>

                {/* Projects by priority */}
                <div className="bg-white border border-[#E5E5E5] p-5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">Distribuição por Prioridade</h3>
                  {summary.projectsByPriority.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={summary.projectsByPriority}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            dataKey="count"
                            paddingAngle={2}
                          >
                            {summary.projectsByPriority.map((entry) => {
                              const colors: Record<string, string> = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#555555', LOW: '#AAAAAA' };
                              return <Cell key={entry.priority} fill={colors[entry.priority] || '#888888'} />;
                            })}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {summary.projectsByPriority.map((entry) => {
                          const colors: Record<string, string> = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#555555', LOW: '#AAAAAA' };
                          const labels: Record<string, string> = { CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo' };
                          return (
                            <div key={entry.priority} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[entry.priority] }} />
                              <span className="text-[11px] text-[#555555]">{labels[entry.priority] || entry.priority}</span>
                              <span className="text-[11px] font-semibold text-[#111111]">{entry.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-[#888888]">Sem dados</div>
                  )}
                </div>
              </div>

              {/* Top projects table */}
              <div className="bg-white border border-[#E5E5E5]">
                <div className="px-5 py-4 border-b border-[#E5E5E5]">
                  <h2 className="text-sm font-semibold text-[#111111]">Portfolio de Projetos</h2>
                </div>
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Projeto</th>
                      <th style={{ width: 100 }}>Status</th>
                      <th style={{ width: 160 }}>Progresso</th>
                      <th style={{ width: 140 }}>Savings Est.</th>
                      <th style={{ width: 100 }}>Prazo</th>
                      <th style={{ width: 120 }}>Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[project.status] || '#888888' }} />
                            <span className="font-medium text-[#111111] text-sm">{project.name}</span>
                          </div>
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
                          <span className="text-xs text-[#555555]">
                            {project.estimatedSavings ? formatCurrency(project.estimatedSavings) : '—'}
                          </span>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
                {summary.topProjects.length === 0 && (
                  <div className="p-10 text-center text-sm text-[#888888]">Nenhum projeto no portfólio</div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
