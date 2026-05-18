'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { cn, formatDate } from '@/lib/utils';
import { X, Trash2, CheckSquare, Square, Plus, Save } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeName?: string | null;
  dueDate?: string | null;
  capexEstimate?: number | null;
  opexEstimate?: number | null;
  completionPercentage: number;
  checklist?: ChecklistItem[];
  problemRef?: string | null;
}

const STATUSES = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'A Fazer' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'IN_REVIEW', label: 'Em Revisão' },
  { value: 'DONE', label: 'Concluído' },
  { value: 'BLOCKED', label: 'Bloqueado' },
];

const PRIORITIES = [
  { value: 'CRITICAL', label: 'Crítico' },
  { value: 'HIGH', label: 'Alto' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'LOW', label: 'Baixo' },
];

function generateId() { return Math.random().toString(36).slice(2, 9); }

interface Props {
  taskId: string;
  projectId: string;
  onClose: () => void;
  onUpdated: (task: any) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskDetailDrawer({ taskId, projectId, onClose, onUpdated, onDeleted }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');

  useEffect(() => {
    api.get<TaskDetail>(`/projects/${projectId}/tasks/${taskId}`)
      .then(setTask)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId, projectId]);

  async function handleSave() {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await api.put<any>(`/projects/${projectId}/tasks/${taskId}`, {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        checklist: task.checklist,
      });
      onUpdated({ ...task, ...updated });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      onDeleted(taskId);
      onClose();
    } catch (err) {
      console.error(err);
    }
  }

  const updateTask = (patch: Partial<TaskDetail>) => {
    setTask((t) => t ? { ...t, ...patch } : t);
  };

  const toggleCheckItem = (id: string) => {
    if (!task) return;
    const checklist = (task.checklist || []).map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    updateTask({ checklist });
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim() || !task) return;
    const checklist = [...(task.checklist || []), { id: generateId(), text: newCheckItem, checked: false }];
    updateTask({ checklist });
    setNewCheckItem('');
  };

  const removeCheckItem = (id: string) => {
    if (!task) return;
    updateTask({ checklist: (task.checklist || []).filter((item) => item.id !== id) });
  };

  const completedCount = task?.checklist?.filter((i) => i.checked).length || 0;
  const totalCount = task?.checklist?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[480px] bg-white border-l border-[#E5E5E5] flex flex-col h-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5] shrink-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#888888]">Detalhe da Tarefa</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !task}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
            >
              <Save size={11} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-[#F4F4F4] rounded-sm transition-colors">
              <X size={14} className="text-[#888888]" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#888888]">Carregando...</div>
        ) : !task ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#888888]">Tarefa não encontrada</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Título</label>
              <input
                value={task.title}
                onChange={(e) => updateTask({ title: e.target.value })}
                className="w-full text-sm font-medium text-[#111111] bg-transparent focus:outline-none border-b border-transparent focus:border-[#E5E5E5] transition-colors py-0.5"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Descrição</label>
              <textarea
                value={task.description || ''}
                onChange={(e) => updateTask({ description: e.target.value })}
                rows={3}
                placeholder="Adicione uma descrição..."
                className="w-full text-sm text-[#111111] placeholder-[#AAAAAA] bg-transparent focus:outline-none border border-transparent focus:border-[#E5E5E5] rounded-none transition-colors resize-none px-2 py-1.5"
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => updateTask({ status: e.target.value })}
                  className="w-full px-2.5 py-2 border border-[#E5E5E5] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors appearance-none"
                >
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Prioridade</label>
                <select
                  value={task.priority}
                  onChange={(e) => updateTask({ priority: e.target.value })}
                  className="w-full px-2.5 py-2 border border-[#E5E5E5] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors appearance-none"
                >
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Prazo</label>
              <input
                type="date"
                value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                onChange={(e) => updateTask({ dueDate: e.target.value || null })}
                className="w-full px-2.5 py-2 border border-[#E5E5E5] bg-white text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">
                  Checklist {totalCount > 0 && `(${completedCount}/${totalCount})`}
                </label>
              </div>

              {totalCount > 0 && (
                <div className="h-1 bg-[#F0F0F0] rounded-full mb-3">
                  <div
                    className="h-full bg-[#111111] rounded-full transition-all"
                    style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%` }}
                  />
                </div>
              )}

              <div className="space-y-1.5 mb-3">
                {(task.checklist || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <button onClick={() => toggleCheckItem(item.id)} className="shrink-0">
                      {item.checked
                        ? <CheckSquare size={14} className="text-[#111111]" />
                        : <Square size={14} className="text-[#AAAAAA]" />
                      }
                    </button>
                    <span className={cn('text-xs flex-1', item.checked ? 'line-through text-[#AAAAAA]' : 'text-[#111111]')}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <X size={11} className="text-[#AAAAAA]" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                  placeholder="Adicionar item..."
                  className="flex-1 text-xs text-[#111111] placeholder-[#AAAAAA] bg-transparent border-b border-[#E5E5E5] focus:border-[#111111] focus:outline-none py-1 transition-colors"
                />
                <button
                  onClick={addCheckItem}
                  disabled={!newCheckItem.trim()}
                  className="p-1 hover:bg-[#F4F4F4] rounded-sm transition-colors disabled:opacity-50"
                >
                  <Plus size={12} className="text-[#888888]" />
                </button>
              </div>
            </div>

            {/* Problem ref (from 5 Whys) */}
            {task.problemRef && (
              <div className="border border-[#E5E5E5] bg-[#FFFBEB] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#D97706] mb-1">
                  Problema de origem (5 Porquês)
                </p>
                <p className="text-xs text-[#555555] leading-relaxed">{task.problemRef}</p>
              </div>
            )}

            {/* Problem ref — manual input */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">
                Problema Relacionado
              </label>
              <input
                value={task.problemRef || ''}
                onChange={(e) => updateTask({ problemRef: e.target.value || null })}
                placeholder="Ex: causa raiz identificada no 5 Porquês..."
                className="w-full px-2.5 py-2 border border-[#E5E5E5] bg-white text-xs text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>

            {/* Delete */}
            <div className="border-t border-[#E5E5E5] pt-4">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-[#DC2626] hover:text-[#B91C1C] transition-colors"
              >
                <Trash2 size={12} />
                Excluir tarefa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
