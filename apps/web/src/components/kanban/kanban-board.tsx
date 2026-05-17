'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { cn, formatDate, PRIORITY_LABELS } from '@/lib/utils';
import { Plus, MoreHorizontal, Clock, CheckSquare, AlertCircle, X } from 'lucide-react';

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

const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', color: '#888888' },
  { id: 'TODO', label: 'A Fazer', color: '#555555' },
  { id: 'IN_PROGRESS', label: 'Em Andamento', color: '#D97706' },
  { id: 'IN_REVIEW', label: 'Em Revisão', color: '#2563EB' },
  { id: 'DONE', label: 'Concluído', color: '#16A34A' },
  { id: 'BLOCKED', label: 'Bloqueado', color: '#DC2626' },
];

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-[#DC2626]',
  HIGH: 'bg-[#D97706]',
  MEDIUM: 'bg-[#555555]',
  LOW: 'bg-[#AAAAAA]',
};

interface TaskCardProps {
  task: Task;
  onMove: (taskId: string, newStatus: string) => void;
  onOpen: (task: Task) => void;
}

function TaskCard({ task, onMove, onOpen }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      className="bg-white border border-[#E5E5E5] p-3 cursor-pointer hover:border-[#AAAAAA] hover:shadow-sm transition-all group"
      onClick={() => onOpen(task)}
    >
      {/* Priority stripe */}
      <div className={cn('w-full h-0.5 mb-2 -mt-3 -mx-3 px-3', PRIORITY_DOT[task.priority]?.replace('bg-', 'bg-'))} />

      <div className="flex items-start justify-between gap-1 mb-2">
        <span className="text-xs font-medium text-[#111111] leading-tight">{task.title}</span>
        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1', PRIORITY_DOT[task.priority])} />
      </div>

      {task.description && (
        <p className="text-[11px] text-[#888888] leading-relaxed mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {task.assigneeName && (
            <span className="text-[10px] text-[#888888]">{task.assigneeName.split(' ')[0]}</span>
          )}
          {task.subtaskCount !== undefined && task.subtaskCount > 0 && (
            <span className="text-[10px] text-[#888888] flex items-center gap-0.5">
              <CheckSquare size={9} />
              {task.completedSubtasks}/{task.subtaskCount}
            </span>
          )}
        </div>
        {task.dueDate && (
          <span className={cn('text-[10px] flex items-center gap-0.5', isOverdue ? 'text-[#DC2626]' : 'text-[#AAAAAA]')}>
            <Clock size={9} />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

interface NewTaskFormProps {
  status: string;
  projectId: string;
  onCreated: (task: Task) => void;
  onCancel: () => void;
}

function NewTaskForm({ status, projectId, onCreated, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const task = await api.post<Task>(`/projects/${projectId}/tasks`, { title, status });
      onCreated(task);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-[#111111] p-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Título da tarefa..."
        className="w-full text-xs text-[#111111] placeholder-[#AAAAAA] bg-transparent focus:outline-none mb-2"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={loading || !title.trim()}
          className="px-2.5 py-1 bg-[#111111] text-white text-[11px] font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Criar'}
        </button>
        <button
          onClick={onCancel}
          className="text-[11px] text-[#888888] hover:text-[#555555] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onOpenTask: (task: Task) => void;
}

export function KanbanBoard({ projectId, tasks, onTasksChange, onOpenTask }: KanbanBoardProps) {
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const tasksByStatus = useCallback(() => {
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach((col) => { map[col.id] = []; });
    tasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    // Sort by position
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.position - b.position);
    });
    return map;
  }, [tasks]);

  const handleTaskCreated = (task: Task) => {
    onTasksChange([...tasks, task]);
    setAddingTo(null);
  };

  const handleMove = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      onTasksChange(tasks.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const byStatus = tasksByStatus();

  return (
    <div className="flex gap-3 h-full overflow-x-auto px-6 py-5 pb-4">
      {COLUMNS.map((col) => {
        const colTasks = byStatus[col.id] || [];
        return (
          <div key={col.id} className="flex flex-col w-60 shrink-0">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[11px] font-semibold text-[#111111]">{col.label}</span>
                <span className="text-[10px] text-[#AAAAAA] font-mono">{colTasks.length}</span>
              </div>
              <button
                onClick={() => setAddingTo(col.id)}
                className="p-1 hover:bg-[#F4F4F4] rounded-sm transition-colors"
              >
                <Plus size={12} className="text-[#888888]" />
              </button>
            </div>

            {/* Task list */}
            <div className="flex-1 space-y-2 overflow-y-auto min-h-[200px] pb-2">
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMove={handleMove}
                  onOpen={onOpenTask}
                />
              ))}

              {addingTo === col.id && (
                <NewTaskForm
                  status={col.id}
                  projectId={projectId}
                  onCreated={handleTaskCreated}
                  onCancel={() => setAddingTo(null)}
                />
              )}

              {colTasks.length === 0 && addingTo !== col.id && (
                <button
                  onClick={() => setAddingTo(col.id)}
                  className="w-full py-4 border border-dashed border-[#E5E5E5] text-[11px] text-[#AAAAAA] hover:border-[#AAAAAA] hover:text-[#555555] transition-colors"
                >
                  + Adicionar tarefa
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
