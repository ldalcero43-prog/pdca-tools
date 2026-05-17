import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStatus } from '@pdca/database';

interface RequestUser { id: string; role: string; orgId: string; }

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async getKanbanBoard(projectId: string, user: RequestUser) {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { subtasks: true, attachments: true, comments: true } },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });

    const columns = {
      BACKLOG: tasks.filter((t) => t.status === 'BACKLOG'),
      TODO: tasks.filter((t) => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
      IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
      DONE: tasks.filter((t) => t.status === 'DONE'),
      BLOCKED: tasks.filter((t) => t.status === 'BLOCKED'),
    };

    return columns;
  }

  async getTasks(projectId: string, filters: any) {
    const where: any = { projectId };
    if (filters.status) where.status = filters.status;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.phase) where.phase = filters.phase;

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { subtasks: true, attachments: true, comments: true } },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
  }

  async createTask(projectId: string, dto: any, user: RequestUser) {
    const lastTask = await this.prisma.task.findFirst({
      where: { projectId, status: dto.status || 'BACKLOG' },
      orderBy: { position: 'desc' },
    });

    return this.prisma.task.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status || 'BACKLOG',
        priority: dto.priority || 'MEDIUM',
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        estimatedHours: dto.estimatedHours,
        parentId: dto.parentId,
        phase: dto.phase || 'DO',
        tags: dto.tags || [],
        capex: dto.capex,
        opex: dto.opex,
        createdById: user.id,
        position: (lastTask?.position || 0) + 1000,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async updateTask(projectId: string, taskId: string, dto: any, user: RequestUser) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const data: any = {};
    const fields = ['title', 'description', 'status', 'priority', 'assigneeId', 'phase',
      'tags', 'isBlocking', 'checklistItems', 'evidenceLinks', 'actualHours', 'capex', 'opex'];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.status === 'DONE' && !task.completedAt) data.completedAt = new Date();
    if (dto.status && dto.status !== 'DONE') data.completedAt = null;

    return this.prisma.task.update({
      where: { id: taskId },
      data,
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async reorderTask(projectId: string, dto: { taskId: string; newStatus: TaskStatus; newPosition: number }) {
    return this.prisma.task.update({
      where: { id: dto.taskId },
      data: { status: dto.newStatus, position: dto.newPosition },
    });
  }

  async deleteTask(projectId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return this.prisma.task.delete({ where: { id: taskId } });
  }

  async getTask(projectId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        subtasks: {
          include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
        },
        comments: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return task;
  }
}
