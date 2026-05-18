'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Plus, X, LayoutList, BarChart2 } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DONE' | 'DELAYED';
  description?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName?: string;
  dueDate?: string;
  createdAt: string;
}

const MS_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  PENDING:    { label: 'Pendente',     dot: 'bg-[#AAAAAA]', text: 'text-[#888888]' },
  IN_PROGRESS:{ label: 'Em Andamento', dot: 'bg-[#D97706]', text: 'text-[#D97706]' },
  COMPLETED:  { label: 'Concluído',    dot: 'bg-[#16A34A]', text: 'text-[#16A34A]' },
  DONE:       { label: 'Concluído',    dot: 'bg-[#16A34A]', text: 'text-[#16A34A]' },
  DELAYED:    { label: 'Atrasado',     dot: 'bg-[#DC2626]', text: 'text-[#DC2626]' },
};

const TASK_COLORS: Record<string, string> = {
  DONE: '#16A34A', IN_PROGRESS: '#D97706', BLOCKED: '#DC2626',
  IN_REVIEW: '#2563EB', TODO: '#555555', BACKLOG: '#AAAAAA',
};

const PRIORITY_STRIPE: Record<string, string> = {
  CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#555555', LOW: '#AAAAAA',
};

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatShort(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Gantt ─────────────────────────────────────────────────────────────────

function GanttView({ tasks, milestones }: { tasks: Task[]; milestones: Milestone[] }) {
  const tasksWithDate = tasks.filter((t) => t.dueDate);
  const allItems = [
    ...tasksWithDate.map((t) => ({
      id: t.id, label: t.title,
      start: new Date(t.createdAt),
      end: new Date(t.dueDate!),
      color: TASK_COLORS[t.status] || '#888888',
      stripe: PRIORITY_STRIPE[t.priority] || '#888888',
      type: 'task' as const, status: t.status, assignee: t.assigneeName,
    })),
    ...milestones.filter((m) => m.dueDate).map((m) => ({
      id: m.id, label: m.title,
      start: new Date(m.dueDate),
      end: new Date(m.dueDate),
      color: MS_STATUS[m.status]?.dot.replace('bg-[', '').replace(']', '') || '#888888',
      stripe: '#888888',
      type: 'milestone' as const, status: m.status, assignee: undefined,
    })),
  ];

  if (allItems.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-[#888888]">
        Nenhuma tarefa com prazo definida. Adicione prazos às tarefas no Kanban para visualizar o Gantt.
      </div>
    );
  }

  const allDates = allItems.flatMap((i) => [i.start, i.end]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 4);

  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000));

  // Build week columns
  const weeks: { label: string; startDay: number; days: number }[] = [];
  let day = 0;
  while (day < totalDays) {
    const weekStart = addDays(minDate, day);
    const label = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const daysInWeek = Math.min(7, totalDays - day);
    weeks.push({ label, startDay: day, days: daysInWeek });
    day += 7;
  }

  const today = new Date();
  const todayOffset = Math.max(0, Math.min(100, ((today.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100));

  function pct(d: Date) {
    return Math.max(0, Math.min(100, ((d.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100));
  }

  const ROW_H = 36;
  const LABEL_W = 200;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 800 }}>
        {/* Header */}
        <div className="flex border-b border-[#E5E5E5] bg-[#FAFAFA]">
          <div style={{ width: LABEL_W }} className="shrink-0 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#888888]">
            Tarefa / Marco
          </div>
          <div className="flex-1 relative overflow-hidden">
            <div className="flex">
              {weeks.map((w, i) => (
                <div
                  key={i}
                  className="border-l border-[#E5E5E5] px-2 py-2 text-[10px] text-[#888888]"
                  style={{ width: `${(w.days / totalDays) * 100}%` }}
                >
                  {w.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        {allItems.map((item) => {
          const startPct = pct(item.start);
          const endPct = pct(item.end);
          const widthPct = Math.max(0.5, endPct - startPct);
          const isMilestone = item.type === 'milestone';

          return (
            <div key={item.id} className="flex border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors" style={{ height: ROW_H }}>
              {/* Label */}
              <div style={{ width: LABEL_W }} className="shrink-0 flex items-center px-4 gap-2">
                {isMilestone ? (
                  <span className="w-2 h-2 rotate-45 shrink-0" style={{ background: item.color, display: 'inline-block' }} />
                ) : (
                  <span className="w-1 h-4 rounded-full shrink-0" style={{ background: item.stripe }} />
                )}
                <span className="text-[11px] text-[#111111] truncate">{item.label}</span>
              </div>

              {/* Bar */}
              <div className="flex-1 relative">
                {/* Weekend shading + today line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-[#2563EB] opacity-60 z-10"
                  style={{ left: `${todayOffset}%` }}
                />
                {/* Week grid */}
                {weeks.map((w, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-[#F0F0F0]"
                    style={{ left: `${(w.startDay / totalDays) * 100}%` }}
                  />
                ))}

                {isMilestone ? (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 z-20"
                    style={{ left: `calc(${startPct}% - 6px)`, background: item.color }}
                    title={item.label}
                  />
                ) : (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm flex items-center px-1.5 z-20"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      background: item.color,
                      opacity: item.status === 'DONE' ? 0.4 : 0.85,
                      minWidth: 8,
                    }}
                    title={`${item.label}${item.assignee ? ` — ${item.assignee}` : ''}`}
                  >
                    <span className="text-[9px] text-white font-medium truncate">{item.assignee || ''}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#FAFAFA] border-t border-[#E5E5E5] text-[10px] text-[#888888]">
          <span className="flex items-center gap-1"><span className="w-4 h-px bg-[#2563EB] opacity-60 inline-block" /> Hoje</span>
          {Object.entries(TASK_COLORS).slice(0, 4).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1">
              <span className="w-3 h-2 rounded-sm inline-block" style={{ background: c, opacity: 0.85 }} />
              {s === 'DONE' ? 'Concluído' : s === 'IN_PROGRESS' ? 'Em andamento' : s === 'BLOCKED' ? 'Bloqueado' : 'A fazer'}
            </span>
          ))}
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rotate-45 inline-block bg-[#111111] opacity-50" /> Marco</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { id } = useParams();
  const projectId = id as string;
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'gantt'>('gantt');
  const [showAdd, setShowAdd] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '', description: '' });

  useEffect(() => {
    Promise.all([
      api.get<any>(`/projects/${projectId}/milestones`),
      api.get<any>(`/projects/${projectId}/tasks`),
    ]).then(([mRes, tRes]) => {
      const ms = Array.isArray(mRes) ? mRes : (mRes as any)?.data || [];
      const ts = Array.isArray(tRes) ? tRes : (tRes as any)?.data || [];
      setMilestones(ms);
      setTasks(ts);
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId]);

  async function handleAddMilestone() {
    if (!newMilestone.title.trim()) return;
    try {
      const created = await api.post<Milestone>(`/projects/${projectId}/milestones`, newMilestone);
      setMilestones((m) => [...m, created]);
      setShowAdd(false);
      setNewMilestone({ title: '', dueDate: '', description: '' });
    } catch (err) { console.error(err); }
  }

  const sorted = [...milestones].sort((a, b) =>
    new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
  );

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando...</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E5E5] bg-white shrink-0">
        <div className="flex items-center border border-[#E5E5E5]">
          <button
            onClick={() => setView('gantt')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
              view === 'gantt' ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]')}
          >
            <BarChart2 size={12} /> Gantt
          </button>
          <button
            onClick={() => setView('timeline')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
              view === 'timeline' ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]')}
          >
            <LayoutList size={12} /> Marcos
          </button>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#555555] hover:bg-[#F4F4F4] transition-colors"
        >
          <Plus size={12} /> Adicionar marco
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {view === 'gantt' ? (
          <GanttView tasks={tasks} milestones={milestones} />
        ) : (
          /* Timeline view (vertical) */
          <div className="p-6 max-w-3xl mx-auto">
            {sorted.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#E5E5E5]">
                <p className="text-sm text-[#888888] mb-3">Nenhum marco definido</p>
                <button onClick={() => setShowAdd(true)} className="text-xs text-[#555555] hover:text-[#111111] transition-colors">
                  + Adicionar primeiro marco
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {sorted.map((m, index) => {
                  const conf = MS_STATUS[m.status] || MS_STATUS.PENDING;
                  const date = m.dueDate ? new Date(m.dueDate) : null;
                  const isPast = date && date < new Date();
                  return (
                    <div key={m.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn('w-3 h-3 rounded-full shrink-0 mt-5', conf.dot)} />
                        {index < sorted.length - 1 && <div className="w-px flex-1 bg-[#E5E5E5] my-0.5 min-h-[40px]" />}
                      </div>
                      <div className="pb-6 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-[#111111]">{m.title}</span>
                          <span className={cn('text-[10px] font-medium', conf.text)}>{conf.label}</span>
                        </div>
                        {date && (
                          <p className="text-[11px] text-[#888888]">
                            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            {isPast && m.status !== 'COMPLETED' && m.status !== 'DONE' && (
                              <span className="ml-2 text-[#DC2626]">• Atrasado</span>
                            )}
                          </p>
                        )}
                        {m.description && <p className="text-[11px] text-[#888888] mt-1 leading-relaxed">{m.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="text-xs text-[#888888] px-3 py-2">Cancelar</button>
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
