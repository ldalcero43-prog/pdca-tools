'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskDetailDrawer } from '@/components/kanban/task-detail-drawer';
import { LayoutGrid, List, Filter } from 'lucide-react';
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
  subtaskCount?: number;
  completedSubtasks?: number;
  position: number;
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo',
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog', TODO: 'A Fazer', IN_PROGRESS: 'Em Andamento',
  IN_REVIEW: 'Em Revisão', DONE: 'Concluído', BLOCKED: 'Bloqueado',
};

export default function DoPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>(`/projects/${projectId}/tasks`)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setTasks(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando tarefas...</div>;

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'DONE').length,
    blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E5E5] bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[11px] text-[#888888]">
            <span><span className="text-[#111111] font-semibold">{stats.total}</span> tarefas</span>
            <span className="text-[#AAAAAA]">|</span>
            <span><span className="text-[#16A34A] font-semibold">{stats.done}</span> concluídas</span>
            {stats.blocked > 0 && (
              <>
                <span className="text-[#AAAAAA]">|</span>
                <span><span className="text-[#DC2626] font-semibold">{stats.blocked}</span> bloqueadas</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#E5E5E5] bg-white">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'p-2 transition-colors',
                view === 'kanban' ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]',
              )}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-2 transition-colors',
                view === 'list' ? 'bg-[#111111] text-white' : 'text-[#888888] hover:bg-[#F4F4F4]',
              )}
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        {view === 'kanban' ? (
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
                    <th style={{ width: 120 }}>Responsável</th>
                    <th style={{ width: 100 }}>Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="cursor-pointer"
                      onClick={() => setOpenTaskId(task.id)}
                    >
                      <td>
                        <span className={cn('text-sm font-medium', task.status === 'DONE' ? 'line-through text-[#888888]' : 'text-[#111111]')}>
                          {task.title}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-[#555555]">{STATUS_LABELS[task.status] || task.status}</span>
                      </td>
                      <td>
                        <span className="text-xs text-[#555555]">{PRIORITY_LABELS[task.priority] || task.priority}</span>
                      </td>
                      <td>
                        <span className="text-xs text-[#555555]">{task.assigneeName || '—'}</span>
                      </td>
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
                <div className="p-10 text-center text-sm text-[#888888]">
                  Nenhuma tarefa criada. Use o Kanban para adicionar tarefas.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task detail drawer */}
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
