'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'DELAYED';
  description?: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  PENDING: { label: 'Pendente', dot: 'bg-[#AAAAAA]', text: 'text-[#888888]' },
  IN_PROGRESS: { label: 'Em Andamento', dot: 'bg-[#D97706]', text: 'text-[#D97706]' },
  DONE: { label: 'Concluído', dot: 'bg-[#16A34A]', text: 'text-[#16A34A]' },
  DELAYED: { label: 'Atrasado', dot: 'bg-[#DC2626]', text: 'text-[#DC2626]' },
};

export default function TimelinePage() {
  const { id } = useParams();
  const projectId = id as string;
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '', description: '' });

  useEffect(() => {
    api.get<any>(`/projects/${projectId}/milestones`)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setMilestones(list);
      })
      .catch(() => setMilestones([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleAddMilestone() {
    if (!newMilestone.title.trim()) return;
    try {
      const created = await api.post<Milestone>(`/projects/${projectId}/milestones`, newMilestone);
      setMilestones((m) => [...m, created]);
      setShowAdd(false);
      setNewMilestone({ title: '', dueDate: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  }

  const sorted = [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-[#111111]">Timeline / Marcos</h2>
          <p className="text-[11px] text-[#888888] mt-0.5">{milestones.length} marco{milestones.length !== 1 ? 's' : ''} definido{milestones.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#555555] hover:bg-[#F4F4F4] transition-colors"
        >
          <Plus size={12} />
          Adicionar marco
        </button>
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        {sorted.length > 0 ? (
          <div className="space-y-0">
            {sorted.map((milestone, index) => {
              const conf = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.PENDING;
              const date = new Date(milestone.dueDate);
              const isPast = date < new Date();
              return (
                <div key={milestone.id} className="flex gap-4">
                  {/* Timeline axis */}
                  <div className="flex flex-col items-center">
                    <div className={cn('w-3 h-3 rounded-full border-2 border-white ring-2 shrink-0 mt-5', conf.dot, `ring-${conf.dot.replace('bg-', '')}`)}>
                    </div>
                    {index < sorted.length - 1 && (
                      <div className="w-px flex-1 bg-[#E5E5E5] my-0.5 min-h-[40px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-6 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#111111]">{milestone.title}</span>
                      <span className={cn('text-[10px] font-medium', conf.text)}>{conf.label}</span>
                    </div>
                    <p className="text-[11px] text-[#888888]">
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {isPast && milestone.status !== 'DONE' && (
                        <span className="ml-2 text-[#DC2626]">• Atrasado</span>
                      )}
                    </p>
                    {milestone.description && (
                      <p className="text-[11px] text-[#888888] mt-1 leading-relaxed">{milestone.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-[#E5E5E5]">
            <p className="text-sm text-[#888888] mb-3">Nenhum marco definido</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs text-[#555555] hover:text-[#111111] transition-colors"
            >
              + Adicionar primeiro marco
            </button>
          </div>
        )}
      </div>

      {/* Add milestone modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white border border-[#E5E5E5] p-6 w-96 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-[#111111]">Novo Marco</h3>
              <button onClick={() => setShowAdd(false)}><X size={14} className="text-[#888888]" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Título *</label>
                <input
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone((m) => ({ ...m, title: e.target.value }))}
                  autoFocus
                  placeholder="Ex: Conclusão da análise de causa raiz"
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Data *</label>
                <input
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone((m) => ({ ...m, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Descrição</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone((m) => ({ ...m, description: e.target.value }))}
                  rows={2}
                  placeholder="Critérios de conclusão..."
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="text-xs text-[#888888] hover:text-[#555555] px-3 py-2 transition-colors">Cancelar</button>
              <button
                onClick={handleAddMilestone}
                disabled={!newMilestone.title.trim() || !newMilestone.dueDate}
                className="px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
