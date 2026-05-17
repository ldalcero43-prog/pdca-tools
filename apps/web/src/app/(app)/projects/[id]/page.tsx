'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { cn, formatDate, formatCurrency, STATUS_LABELS, PHASE_LABELS } from '@/lib/utils';
import { Users, Target, Calendar, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ProjectDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  methodology: string;
  currentPhase: string;
  problemStatement: string | null;
  goals: string | null;
  scope: string | null;
  outOfScope?: string | null;
  targetDate: string | null;
  startDate: string | null;
  estimatedSavings: number | null;
  actualSavings: number | null;
  estimatedRoi: number | null;
  capexBudget: number | null;
  opexBudget: number | null;
  ownerName?: string;
  sponsorName?: string;
  members: Array<{ userId: string; user: { name: string; email: string }; role: string }>;
  phases: Array<{ phase: string; status: string; completionPercentage: number }>;
  kpis: Array<{ id: string; name: string; baseline: number; target: number; current: number; unit: string }>;
}

const PHASE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PLAN: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  DO: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  CHECK: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  ACT: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
};

export default function ProjectOverviewPage() {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ProjectDetail>(`/projects/${id}`)
      .then(setProject)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando...</div>;
  if (!project) return <div className="p-8 text-sm text-[#888888]">Projeto não encontrado</div>;

  const phaseOrder = ['PLAN', 'DO', 'CHECK', 'ACT'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Grid layout */}
      <div className="grid grid-cols-3 gap-5">
        {/* Problem & Goals — spans 2 cols */}
        <div className="col-span-2 bg-white border border-[#E5E5E5] p-5 space-y-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">
            Problema & Objetivos
          </h3>

          {project.problemStatement && (
            <div>
              <p className="text-[11px] font-medium text-[#555555] mb-1 uppercase tracking-wide">Declaração do Problema</p>
              <p className="text-sm text-[#111111] leading-relaxed">{project.problemStatement}</p>
            </div>
          )}

          {project.goals && (
            <div className="border-t border-[#E5E5E5] pt-4">
              <p className="text-[11px] font-medium text-[#555555] mb-1 uppercase tracking-wide">Objetivo / Meta</p>
              <p className="text-sm text-[#111111] leading-relaxed">{project.goals}</p>
            </div>
          )}

          {project.scope && (
            <div className="border-t border-[#E5E5E5] pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-medium text-[#555555] mb-1 uppercase tracking-wide">Escopo</p>
                <p className="text-sm text-[#111111]">{project.scope}</p>
              </div>
              {project.outOfScope && (
                <div>
                  <p className="text-[11px] font-medium text-[#555555] mb-1 uppercase tracking-wide">Fora do Escopo</p>
                  <p className="text-sm text-[#555555]">{project.outOfScope}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project info sidebar */}
        <div className="space-y-3">
          <div className="bg-white border border-[#E5E5E5] p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-3">Informações</h3>
            <div className="space-y-2.5">
              <InfoRow icon={Calendar} label="Prazo" value={formatDate(project.targetDate)} />
              <InfoRow icon={Calendar} label="Início" value={formatDate(project.startDate)} />
              <InfoRow icon={Target} label="Metodologia" value={project.methodology} />
              <InfoRow icon={Users} label="Membros" value={`${(project.members?.length || 0) + 1} pessoas`} />
            </div>
          </div>

          {/* Financial */}
          {(project.estimatedSavings || project.capexBudget) && (
            <div className="bg-white border border-[#E5E5E5] p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-3">Financeiro</h3>
              <div className="space-y-2.5">
                {project.estimatedSavings && (
                  <InfoRow icon={DollarSign} label="Savings Est." value={formatCurrency(project.estimatedSavings)} />
                )}
                {project.actualSavings && (
                  <InfoRow icon={DollarSign} label="Savings Real" value={formatCurrency(project.actualSavings)} />
                )}
                {project.capexBudget && (
                  <InfoRow icon={DollarSign} label="CAPEX" value={formatCurrency(project.capexBudget)} />
                )}
                {project.opexBudget && (
                  <InfoRow icon={DollarSign} label="OPEX" value={formatCurrency(project.opexBudget)} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDCA Phase Progress */}
      <div className="bg-white border border-[#E5E5E5] p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
          Progresso PDCA
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {phaseOrder.map((phase) => {
            const phaseData = project.phases?.find((p) => p.phase === phase);
            const pct = phaseData?.completionPercentage || 0;
            const status = phaseData?.status || 'NOT_STARTED';
            const colors = PHASE_COLORS[phase];
            const isCurrent = project.currentPhase === phase;

            return (
              <div
                key={phase}
                className={cn(
                  'p-4 border',
                  isCurrent ? 'border-[#111111]' : 'border-[#E5E5E5]',
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-sm"
                    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    {PHASE_LABELS[phase]}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-medium text-[#111111] bg-[#F0F0F0] px-1.5 py-0.5">
                      Atual
                    </span>
                  )}
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#888888]">
                      {status === 'NOT_STARTED' ? 'Não iniciado' : status === 'IN_PROGRESS' ? 'Em andamento' : 'Concluído'}
                    </span>
                    <span className="text-[11px] font-medium text-[#111111]">{pct}%</span>
                  </div>
                  <div className="h-1 bg-[#F0F0F0] rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: colors.text,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPIs preview */}
      {project.kpis && project.kpis.length > 0 && (
        <div className="bg-white border border-[#E5E5E5] p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">KPIs</h3>
          <div className="grid grid-cols-3 gap-4">
            {project.kpis.slice(0, 3).map((kpi) => {
              const progress = kpi.baseline !== null && kpi.target !== null && kpi.current !== null
                ? Math.round(((Number(kpi.current) - Number(kpi.baseline)) / (Number(kpi.target) - Number(kpi.baseline))) * 100)
                : null;
              return (
                <div key={kpi.id} className="border border-[#E5E5E5] p-4">
                  <p className="text-xs font-medium text-[#111111] mb-2">{kpi.name}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-semibold text-[#111111]">
                      {kpi.current ?? '—'}{kpi.unit ? ` ${kpi.unit}` : ''}
                    </span>
                    {progress !== null && (
                      <span className={cn(
                        'text-xs mb-1',
                        progress >= 80 ? 'text-[#16A34A]' : progress >= 40 ? 'text-[#D97706]' : 'text-[#DC2626]',
                      )}>
                        {progress}%
                      </span>
                    )}
                  </div>
                  {kpi.target !== null && (
                    <p className="text-[11px] text-[#888888] mt-1">Meta: {kpi.target}{kpi.unit ? ` ${kpi.unit}` : ''}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={12} className="text-[#888888] shrink-0" />
      <span className="text-[11px] text-[#888888] w-20 shrink-0">{label}</span>
      <span className="text-xs text-[#111111] font-medium">{value || '—'}</span>
    </div>
  );
}
