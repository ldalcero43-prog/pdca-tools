import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { PhaseType } from '@pdca/database';

interface RequestUser {
  id: string;
  role: string;
  orgId: string;
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: RequestUser, filters: { status?: string; search?: string; page?: number; limit?: number }) {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: user.orgId };
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    // Non-admin users only see projects they're members of
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      where.OR = [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
        { isPublic: true },
      ];
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          category: { select: { id: true, name: true, color: true } },
          area: { select: { id: true, name: true } },
          phases: { select: { phase: true, status: true, completionPercentage: true } },
          _count: { select: { tasks: true, members: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.mapProjectSummary(p)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user: RequestUser) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId: user.orgId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        sponsor: { select: { id: true, name: true, email: true, avatarUrl: true } },
        category: true,
        area: true,
        phases: true,
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        tags: true,
        kpis: { where: {}, take: 10 },
        milestones: { orderBy: { dueDate: 'asc' } },
        _count: { select: { tasks: true, comments: true, attachments: true } },
      },
    });

    if (!project) throw new NotFoundException('Projeto não encontrado');
    return project;
  }

  async create(dto: CreateProjectDto, user: RequestUser) {
    const code = await this.generateProjectCode(user.orgId);

    const project = await this.prisma.project.create({
      data: {
        code,
        name: dto.name,
        description: dto.description,
        methodology: dto.methodology || 'PDCA',
        priority: dto.priority || 'MEDIUM',
        categoryId: dto.categoryId,
        areaId: dto.areaId,
        sponsorId: dto.sponsorId,
        ownerId: user.id,
        organizationId: user.orgId,
        problemStatement: dto.problemStatement,
        goals: dto.goals,
        scope: dto.scope,
        outOfScope: dto.outOfScope,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        estimatedSavings: dto.estimatedSavings,
        capexBudget: dto.capexBudget,
        opexBudget: dto.opexBudget,
        financialImpact: dto.financialImpact,
        slaHours: dto.slaHours,
        status: 'DRAFT',
        currentPhase: 'PLAN',
        // Create all 4 phases
        phases: {
          create: [
            { phase: PhaseType.PLAN, status: 'IN_PROGRESS' },
            { phase: PhaseType.DO, status: 'NOT_STARTED' },
            { phase: PhaseType.CHECK, status: 'NOT_STARTED' },
            { phase: PhaseType.ACT, status: 'NOT_STARTED' },
          ],
        },
        // Owner is automatically a member
        members: {
          create: { userId: user.id, role: 'FACILITATOR' },
        },
        // Tags
        ...(dto.tags?.length
          ? { tags: { create: dto.tags.map((tag) => ({ tag })) } }
          : {}),
      },
      include: {
        phases: true,
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        projectId: project.id,
        action: 'CREATE',
        resource: 'projects',
        resourceId: project.id,
      },
    });

    return project;
  }

  async update(id: string, dto: Partial<CreateProjectDto & { status: string; currentPhase: string }>, user: RequestUser) {
    await this.assertProjectAccess(id, user, ['ADMIN', 'MANAGER', 'FACILITATOR']);

    const data: any = {};
    const fields = ['name', 'description', 'methodology', 'priority', 'categoryId', 'areaId', 'sponsorId',
      'problemStatement', 'goals', 'scope', 'outOfScope', 'financialImpact', 'slaHours', 'status', 'currentPhase'];
    fields.forEach((f) => { if (dto[f] !== undefined) data[f] = dto[f]; });
    if (dto['targetDate']) data.targetDate = new Date(dto['targetDate']);
    if (dto['startDate']) data.startDate = new Date(dto['startDate']);
    if (dto['estimatedSavings'] !== undefined) data.estimatedSavings = dto['estimatedSavings'];
    if (dto['capexBudget'] !== undefined) data.capexBudget = dto['capexBudget'];
    if (dto['opexBudget'] !== undefined) data.opexBudget = dto['opexBudget'];

    const project = await this.prisma.project.update({ where: { id }, data });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        projectId: id,
        action: 'UPDATE',
        resource: 'projects',
        resourceId: id,
        changes: { updated: Object.keys(data) },
      },
    });

    return project;
  }

  async archive(id: string, user: RequestUser) {
    await this.assertProjectAccess(id, user, ['ADMIN', 'MANAGER']);
    return this.prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async getMembers(projectId: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['VIEWER']);
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
    });
  }

  async addMember(projectId: string, userId: string, role: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['ADMIN', 'MANAGER', 'FACILITATOR']);
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { role: role as any },
      create: { projectId, userId, role: role as any },
    });
  }

  async removeMember(projectId: string, userId: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['ADMIN', 'MANAGER', 'FACILITATOR']);
    return this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async getPhases(projectId: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['VIEWER']);
    return this.prisma.projectPhase.findMany({ where: { projectId }, orderBy: { phase: 'asc' } });
  }

  async updatePhase(projectId: string, phase: string, data: any, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['ADMIN', 'MANAGER', 'FACILITATOR']);
    return this.prisma.projectPhase.update({
      where: { projectId_phase: { projectId, phase: phase as PhaseType } },
      data,
    });
  }

  async getMilestones(projectId: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['VIEWER']);
    return this.prisma.milestone.findMany({ where: { projectId }, orderBy: { dueDate: 'asc' } });
  }

  async createMilestone(projectId: string, data: any, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['ADMIN', 'MANAGER', 'FACILITATOR']);
    return this.prisma.milestone.create({ data: { ...data, projectId } });
  }

  async getActivity(projectId: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user, ['VIEWER']);
    return this.prisma.auditLog.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async assertProjectAccess(projectId: string, user: RequestUser, allowedRoles: string[]) {
    if (['ADMIN', 'MANAGER'].includes(user.role)) return;

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId: user.orgId },
      include: { members: { where: { userId: user.id } } },
    });

    if (!project) throw new NotFoundException('Projeto não encontrado');

    const memberRole = project.members[0]?.role;
    if (!memberRole && project.ownerId !== user.id) {
      throw new ForbiddenException('Sem acesso a este projeto');
    }

    const roleHierarchy = { ADMIN: 5, MANAGER: 4, FACILITATOR: 3, MEMBER: 2, VIEWER: 1 };
    const userLevel = roleHierarchy[memberRole || 'VIEWER'] || 1;
    const minRequired = Math.min(...allowedRoles.map((r) => roleHierarchy[r] || 1));

    if (userLevel < minRequired) throw new ForbiddenException('Permissão insuficiente');
  }

  private mapProjectSummary(p: any) {
    const totalCompletion = p.phases?.reduce((sum: number, ph: any) => sum + ph.completionPercentage, 0) || 0;
    const completionPercentage = p.phases?.length ? Math.round(totalCompletion / p.phases.length) : 0;

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
      priority: p.priority,
      methodology: p.methodology,
      currentPhase: p.currentPhase,
      completionPercentage,
      ownerName: p.owner?.name,
      ownerAvatarUrl: p.owner?.avatarUrl,
      categoryName: p.category?.name,
      categoryColor: p.category?.color,
      areaName: p.area?.name,
      targetDate: p.targetDate,
      taskCount: p._count?.tasks,
      memberCount: p._count?.members,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private async generateProjectCode(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.project.count({ where: { organizationId: orgId } });
    return `PDCA-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
