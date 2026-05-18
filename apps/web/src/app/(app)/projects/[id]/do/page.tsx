'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskDetailDrawer } from '@/components/kanban/task-detail-drawer';
import { GutMatrixEditor } from '@/components/tools/gut/gut-matrix-editor';
import { FiveW2HEditor } from '@/components/tools/five-w2h/five-w2h-editor';
import { FmeaEditor } from '@/components/tools/fmea/fmea-editor';
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

type DoTab = 'kanban' | 'GUT_MATRIX' | 'FIVE_W2H' | 'FMEA';

const DO_TOOLS: { type: DoTab; name: string; description: string }[] = [
  { type: 'GUT_MATRIX', name: 'Matriz GUT', description: 'Priorize quais problemas ou ações atacar primeiro.' },
  { type: 'FIVE_W2H',   name: '5W2H',       description: 'Plano de ação estruturado: O quê, Por quê, Onde, Quando, Quem, Como e Quanto.' },
  { type: 'FMEA',       name: 'FMEA',        description: 'Analise modos de falha e riscos antes de executar as ações.' },
];

const TOOL_EDITORS: Record<string, React.ComponentType<{ projectId: string; toolData: any; onDataChange: (d: any) => void }>> = {
  GUT_MATRIX: GutMatrixEditor,
  FIVE_W2H: FiveW2HEditor,
  FMEA: FmeaEditor,
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog', TODO: 'A Fazer', IN_PROGRESS: 'Em Andamento',
  IN_REVIEW: 'Em Revisão', DONE: 'Concluído', BLOCKED: 'Bloqueado',
};
const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo',
};

export default function DoPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DoTab>('kanban');
  const [listView, setListView] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [toolDataMap, setToolDataMap] = useState<Record<string, any>>({});
  const [activatedTools, setActivatedTools] = useState<Set<string>>(new Set());
  const [toolStatuses, setToolStatuses] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<any>(`/projects/${projectId}/tasks`),
      api.get<any[]>(`/projects/${projectId}/tools`, { phase: 'DO' }),
    ]).then(([taskRes, toolRes]) => {
      const list = Array.isArray(taskRes) ? taskRes : (taskRes as any)?.data || [];
      setTasks(list);
      const tools = Array.isArray(toolRes) ? toolRes : (toolRes as any)?.data || [];
      const dataMap: Record<string, any> = {};
      const statusMap: Record<string, string> = {};
      const activated = new Set<string>();
      tools.forEach((t: any) => {
        dataMap[t.toolType] = t.data;
        statusMap[t.toolType] = t.status;
        activated.add(t.toolType);
      });
      setToolDataMap(dataMap);
      setToolStatuses(statusMap);
      setActivatedTools(activated);
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId]);

  async function handleActivateTool(toolType: string) {
    setActivating(toolType);
    try {
      await api.put(`/projects/${projectId}/tools/${toolType}`, { data: {} });
      setActivatedTools((prev) => new Set([...prev, toolType]));
      setTab(toolType as DoTab);
    } catch (err) {
      console.error(err);
    } finally {
      setActivating(null);
    }
  }

  async function handleRemoveTool(toolType: string) {
    const tool = DO_TOOLS.find((t) => t.type === toolType);
    if (!confirm(`Remover "${tool?.name}"? Os dados salvos serão perdidos.`)) return;
    try {
      await api.delete(`/projects/${projectId}/tools/${toolType}`);
      setActivatedTools((prev) => { const s = new Set(prev); s.delete(toolType); return s; });
      setToolDataMap((prev) => { const m = { ...prev }; delete m[toolType]; return m; });
      if (tab === toolType) setTab('kanban');
    } catch (err) { console.error(err); }
  }

  const handleTaskUpdated = (updated: Task) =>
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  const handleTaskDeleted = (taskId: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando...</div>;

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'DONE').length,
    blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
  };

  const ToolEditor = tab !== 'kanban' ? TOOL_EDITORS[tab] : null;
  const isToolActive = tab !== 'kanban' && activatedTools.has(tab);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#E5E5E5] bg-white shrink-0 px-4">
        <button
          onClick={() => setTab('kanban')}
          className={cn(
            'px-4 py-3 text-xs font-medium border-b-2 transition-colors -mb-px',
            tab === 'kanban'
              ? 'border-[#111111] text-[#111111]'
              : 'border-transparent text-[#888888] hover:text-[#555555]',
          )}
        >
          Kanban
        </button>
        {DO_TOOLS.map((tool) => {
          const isActive = activatedTools.has(tool.type);
          const status = toolStatuses[tool.type];
          return (
            <span key={tool.type} className="flex items-stretch">
              <button
                onClick={() => isActive ? setTab(tool.type as DoTab) : handleActivateTool(tool.type)}
                disabled={activating === tool.type}
                className={cn(
                  'px-4 py-3 text-xs font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5',
                  tab === tool.type
                    ? 'border-[#111111] text-[#111111]'
                    : isActive
                    ? 'border-transparent text-[#888888] hover:text-[#555555]'
                    : 'border-transparent text-[#AAAAAA] hover:text-[#888888]',
                )}
              >
                {!isActive && <Plus size={10} />}
                {tool.name}
                {isActive && (status === 'COMPLETED' || status === 'DONE') && (
                  <CheckCircle2 size={10} className="text-[#16A34A]" />
                )}
                {isActive && status === 'IN_PROGRESS' && (
                  <Clock size={10} className="text-[#D97706]" />
                )}
              </button>
              {isActive && (
                <button
                  onClick={() => handleRemoveTool(tool.type)}
                  title="Remover ferramenta"
                  className="px-1 py-3 -mb-px text-[#CCCCCC] hover:text-[#DC2626] transition-colors border-b-2 border-transparent text-xs leading-none"
                >
                  ×
                </button>
              )}
            </span>
          );
        })}

        {/* Kanban view toggle (only shown on kanban tab) */}
        {tab === 'kanban' && (
          <div className="ml-auto flex items-center gap-3 pr-2">
            <div className="flex items-center gap-3 text-[11px] text-[#888888]">
              <span><span className="text-[#111111] font-semibold">{stats.total}</span> tarefas</span>
              <span><span className="text-[#16A34A] font-semibold">{stats.done}</span> concluídas</span>
              {stats.blocked > 0 && (
                <span><span className="text-[#DC2626] font-semibold">{stats.blocked}</span> bloqueadas</span>
              )}
            </div>
            <div className="flex items-center border border-[#E5E5E5]">
              <button
                onClick={() => setListView(false)}
                className={cn('p-1.5 transition-colors', !listView ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]')}
              >
                <LayoutGrid size={12} />
              </button>
              <button
                onClick={() => setListView(true)}
                className={cn('p-1.5 transition-colors', listView ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]')}
              >
                <List size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'kanban' ? (
          <>
            {!listView ? (
              <KanbanBoard
                projectId={projectId}
                tasks={tasks}
                onTasksChange={setTasks}
                onOpenTask={(task) => setOpenTaskId(task.id)}
              />
            ) : (
              <div className="p-6 overflow-y-auto h-full">
                <div className="bg-white border border-[#E5E5E5]">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Tarefa</th>
                        <th style={{ width: 120 }}>Status</th>
                        <th style={{ width: 100 }}>Prioridade</th>
                        <th style={{ width: 140 }}>Responsável</th>
                        <th style={{ width: 100 }}>Prazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id} className="cursor-pointer" onClick={() => setOpenTaskId(task.id)}>
                          <td>
                            <span className={cn('text-sm font-medium', task.status === 'DONE' ? 'line-through text-[#888888]' : 'text-[#111111]')}>
                              {task.title}
                            </span>
                          </td>
                          <td><span className="text-xs text-[#555555]">{STATUS_LABELS[task.status] || task.status}</span></td>
                          <td><span className="text-xs text-[#555555]">{PRIORITY_LABELS[task.priority] || task.priority}</span></td>
                          <td><span className="text-xs text-[#555555]">{task.assigneeName || '—'}</span></td>
                          <td>
                            <span className="text-xs text-[#555555]">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tasks.length === 0 && (
                    <div className="p-10 text-center text-sm text-[#888888]">Nenhuma tarefa. Use o Kanban para adicionar.</div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : isToolActive && ToolEditor ? (
          <ToolEditor
            projectId={projectId}
            toolData={toolDataMap[tab] || null}
            onDataChange={(data) => setToolDataMap((prev) => ({ ...prev, [tab]: data }))}
          />
        ) : (
          /* Tool not activated yet — shown when navigated directly (shouldn't happen, but safety) */
          <div className="p-8 text-center text-sm text-[#888888]">
            Ativando ferramenta...
          </div>
        )}
      </div>

      {openTaskId && (
        <TaskDetailDrawer
          taskId={openTaskId}
          projectId={projectId}
          onClose={() => setOpenTaskId(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
