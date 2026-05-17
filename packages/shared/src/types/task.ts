export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PhaseType = 'PLAN' | 'DO' | 'CHECK' | 'ACT';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  doneAt?: string;
}

export interface TaskSummary {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  phase: PhaseType;
  position: number;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeAvatarUrl: string | null;
  subtaskCount: number;
  completedSubtaskCount: number;
  attachmentCount: number;
  commentCount: number;
  isBlocking: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetail extends TaskSummary {
  description: string | null;
  startDate: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  checklistItems: ChecklistItem[];
  evidenceLinks: string[];
  capex: number | null;
  opex: number | null;
  parentId: string | null;
  createdById: string;
  createdByName: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskSummary[];
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  parentId?: string;
  phase?: PhaseType;
  tags?: string[];
  capex?: number;
  opex?: number;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: TaskStatus;
  position?: number;
  actualHours?: number;
  checklistItems?: ChecklistItem[];
}

export interface ReorderTaskDto {
  taskId: string;
  newStatus: TaskStatus;
  newPosition: number;
}

export const KANBAN_COLUMNS: Array<{ id: TaskStatus; title: string }> = [
  { id: 'BACKLOG', title: 'Backlog' },
  { id: 'TODO', title: 'A Fazer' },
  { id: 'IN_PROGRESS', title: 'Em Progresso' },
  { id: 'IN_REVIEW', title: 'Em Revisão' },
  { id: 'DONE', title: 'Concluído' },
  { id: 'BLOCKED', title: 'Bloqueado' },
];
