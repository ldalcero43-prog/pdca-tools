import type { Role } from '../constants/roles';

export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type ProjectPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PhaseType = 'PLAN' | 'DO' | 'CHECK' | 'ACT';

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  methodology: string;
  currentPhase: PhaseType;
  completionPercentage: number;
  ownerName: string;
  ownerAvatarUrl: string | null;
  categoryName: string | null;
  areaName: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  description: string | null;
  problemStatement: string | null;
  goals: string | null;
  scope: string | null;
  outOfScope: string | null;
  startDate: string | null;
  endDate: string | null;
  estimatedSavings: number | null;
  actualSavings: number | null;
  estimatedRoi: number | null;
  actualRoi: number | null;
  capexBudget: number | null;
  opexBudget: number | null;
  financialImpact: string | null;
  slaHours: number | null;
  sponsorName: string | null;
  sponsorAvatarUrl: string | null;
  members: ProjectMember[];
  phases: ProjectPhase[];
  tags: string[];
}

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  joinedAt: string;
}

export interface ProjectPhase {
  phase: PhaseType;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completionPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  methodology?: string;
  categoryId?: string;
  areaId?: string;
  sponsorId?: string;
  problemStatement?: string;
  goals?: string;
  scope?: string;
  outOfScope?: string;
  targetDate?: string;
  startDate?: string;
  estimatedSavings?: number;
  capexBudget?: number;
  opexBudget?: number;
  financialImpact?: string;
  slaHours?: number;
  priority?: ProjectPriority;
  tags?: string[];
  memberIds?: string[];
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  status?: ProjectStatus;
  currentPhase?: PhaseType;
}
