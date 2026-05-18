'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskDetailDrawer } from '@/components/kanban/task-detail-drawer';
import { GutMatrixEditor } from '@/components/tools/gut/gut-matrix-editor';
import { FiveW2HEditor } from '@/components/tools/five-w2h/five-w2h-editor';
import { LayoutGrid, List, Plus, CheckCircle2, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assigneeName?: string | null;
  dueDate?: string | null;
  completionPercentage: number;
  position: number;
}

type ImproveTab = 'kanban' | 'GUT_MATRIX' | 'FIVE_W2H';

const IMPROVE_TOOLS: { type: ImproveTab; name: string; description: string }[] = [
  { type: 'GUT_MATRIX', name: 'Matriz GUT', description: 'Priorize soluções candidatas com base em Gravidade, Urgência e Tendência.' },
  { type: 'FIVE_W2H', name: '5W2H — Plano de Ação', description: 'Estruture as ações de melhoria: O quê, Por quê, Onde, Quando, Quem, Como e Quanto.' },
];

const TOOL_EDITORS: Record<string, React.ComponentType<{ projectId: string; toolData: any; onDataChange: (d: any) => void }>> = {
  GUT_MATRIX: GutMatrixEditor,
  FIVE_W2H: FiveW2HEditor,
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog', TODO: 'A Fazer', IN_PROGRESS: 'Em Andamento',
  IN_REVIEW: 'Em Revisão', DONE: 'Concluído', BLOCKED: 'Bloqueado',
};
const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo',
};

export default function ImprovePage() {
  const { id } = useParams();
  const projectId = id as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ImproveTab>('kanban');
  const [listView, setListView] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [toolDataMap, setToolDataMap] = useState<Record<string, any>>({});
  const [activatedTools, setActivatedTools] = useState<Set<string>>(new Set());
  const [toolStatuses, setToolStatuses] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [taskRes, toolRes] = await Promise.all([
          api.get<any>(`/projects/${projectId}/tasks`),
          api.get<any>(`/projects/${projectId}/tools`),
        ]);
        const ts = Array.isArray(taskRes) ? taskRes : (taskRes as any)?.data || [];
        setTasks(ts);
        const tools = Array.isArray(toolRes) ? toolRes : (toolRes as any)?.data || [];
        const dataMap: Record<string, any> = {};
        const statusMap: Record<string, string> = {};
        const activated = new Set<string>();
        tools.forEach((t: any) => { dataMap[t.toolType] = t.data; statusMap[t.toolType] = t.status; activated.add(t.toolType); });
        setToolDataMap(dataMap);
        setToolStatuses(statusMap);
        setActivatedTools(activated);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [projectId]);

  async function handleActivate(toolType: string) {
    setActivating(toolType);
    try {
      await api.put(`/projects/${projectId}/tools/${toolType}`, { data: {} });
      setActivatedTools((prev) => new Set([...prev, toolType]));
      setTab(toolType as ImproveTab);
    } catch (err) { console.error(err); }
    finally { setActivating(null); }
  }

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando...</div>;

  const done = tasks.filter((t) => t.status === 'DONE').length;
  const total = tasks.length;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-[#E5E5E5] bg-white shrink-0">
        <button
          onClick={() => setTab('kanban')}
          className={cn('px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            tab === 'kanban' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#555555] hover:text-[#111111]'
          )}
        >
          Kanban — Ações
        </button>
        {IMPROVE_TOOLS.map((tool) => {
          const isActive = activatedTools.has(tool.type);
          const status = toolStatuses[tool.type];
          return (
            <button
              key={tool.type}
              onClick={() => isActive ? setTab(tool.type) : handleActivate(tool.type)}
              disabled={activating === tool.type}
              className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === tool.type ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#555555] hover:text-[#111111]'
              )}
            >
              {!isActive && <Plus size={10} className="text-[#AAAAAA]" />}
              {status === 'DONE' || status === 'COMPLETED' ? <CheckCircle2 size={11} className="text-[#16A34A]" /> : null}
              {status === 'IN_PROGRESS' ? <Clock size={11} className="text-[#D97706]" /> : null}
              {tool.name}
              {activating === tool.type && '...'}
            </button>
          );
        })}

        {tab === 'kanban' && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-[#888888]">{done}/{total} concluídas</span>
            <div className="flex items-center border border-[#E5E5E5]">
              <button onClick={() => setListView(false)} className={cn('p-1.5 transition-colors', !listView ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]')}>
                <LayoutGrid size={12} />
              </button>
              <button onClick={() => setListView(true)} className={cn('p-1.5 transition-colors', listView ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]')}>
                <List size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {tab === 'kanban' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          {listView ? (
            <div className="p-6 overflow-y-auto h-full">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E5]">
                    {['Ação', 'Responsável', 'Prazo', 'Status', 'Prioridade'].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 font-semibold uppercase tracking-widest text-[10px] text-[#888888] first:pl-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                    return (
                      <tr key={task.id} onClick={() => setOpenTaskId(task.id)} className="border-b border-[#F4F4F4] hover:bg-[#FAFAFA] cursor-pointer group">
                        <td className="py-2.5 px-3 pl-0">
                          <span className="font-medium text-[#111111] group-hover:text-[#111111] flex items-center gap-1.5">
                            {task.title}
                            <ChevronRight size={11} className="text-[#AAAAAA] opacity-0 group-hover:opacity-100" />
                          </span>
                          {task.description && <span className="text-[10px] text-[#AAAAAA] line-clamp-1">{task.description}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-[#555555]">{task.assigneeName || '—'}</td>
                        <td className={cn('py-2.5 px-3', isOverdue ? 'text-[#DC2626] font-medium' : 'text-[#555555]')}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[#555555]">{STATUS_LABELS[task.status] || task.status}</td>
                        <td className="py-2.5 px-3 text-[#555555]">{PRIORITY_LABELS[task.priority] || task.priority}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {tasks.length === 0 && (
                <div className="text-center py-12 text-sm text-[#888888]">Nenhuma ação criada. Use o Kanban para adicionar ações de melhoria.</div>
              )}
            </div>
          ) : (
            <KanbanBoard
              projectId={projectId}
              tasks={tasks}
              onTasksChange={setTasks}
              onOpenTask={(task) => setOpenTaskId(task.id)}
            />
          )}
        </div>
      )}

      {tab !== 'kanban' && activatedTools.has(tab) && (() => {
        const Editor = TOOL_EDITORS[tab];
        return Editor ? (
          <div className="flex-1 min-h-0">
            <Editor
              projectId={projectId}
              toolData={toolDataMap[tab] || null}
              onDataChange={(data) => setToolDataMap((prev) => ({ ...prev, [tab]: data }))}
            />
          </div>
        ) : null;
      })()}

      {tab !== 'kanban' && !activatedTools.has(tab) && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-[#888888] mb-3">{IMPROVE_TOOLS.find((t) => t.type === tab)?.description}</p>
            <button
              onClick={() => handleActivate(tab)}
              className="px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] transition-colors"
            >
              Adicionar ferramenta
            </button>
          </div>
        </div>
      )}

      {openTaskId && (
        <TaskDetailDrawer
          taskId={openTaskId}
          projectId={projectId}
          onClose={() => setOpenTaskId(null)}
          onUpdated={(updated) => setTasks((ts) => ts.map((t) => t.id === updated.id ? { ...t, ...updated } : t))}
          onDeleted={(tid) => setTasks((ts) => ts.filter((t) => t.id !== tid))}
        />
      )}
    </div>
  );
}
