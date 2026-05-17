import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToolType } from '@pdca/database';

interface RequestUser {
  id: string;
  role: string;
  orgId: string;
}

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async getToolsForProject(projectId: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user);
    return this.prisma.toolData.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        phase: { select: { phase: true, status: true } },
      },
      orderBy: [{ toolType: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async getToolData(projectId: string, toolType: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user);
    return this.prisma.toolData.findFirst({
      where: { projectId, toolType: toolType as ToolType },
      include: { history: { orderBy: { changedAt: 'desc' }, take: 10 } },
    });
  }

  async saveToolData(
    projectId: string,
    toolType: string,
    data: any,
    user: RequestUser,
    name?: string,
    isDraft?: boolean,
  ) {
    await this.assertProjectAccess(projectId, user);

    const existing = await this.prisma.toolData.findFirst({
      where: { projectId, toolType: toolType as ToolType },
    });

    if (existing) {
      // Save history before update
      await this.prisma.toolDataHistory.create({
        data: {
          toolDataId: existing.id,
          data: existing.data as any,
          version: existing.version,
          changedById: user.id,
        },
      });

      return this.prisma.toolData.update({
        where: { id: existing.id },
        data: {
          data,
          name: name || existing.name,
          isDraft: isDraft !== undefined ? isDraft : existing.isDraft,
          version: { increment: 1 },
        },
      });
    }

    // Get phase for this tool type
    const phaseMap: Record<string, string> = {
      SIPOC: 'PLAN', VOC: 'PLAN', CTQ: 'PLAN', PROJECT_CHARTER: 'PLAN',
      SWOT: 'PLAN', GUT: 'PLAN', PARETO: 'PLAN', ISHIKAWA: 'PLAN',
      FIVE_WHYS: 'PLAN', FLOWCHART: 'PLAN', VSM: 'PLAN', FIVE_W2H: 'PLAN',
      BENCHMARKING: 'PLAN', KANO: 'PLAN', FMEA: 'PLAN', BRAINSTORMING: 'PLAN',
      CAUSE_EFFECT_MATRIX: 'PLAN', PROCESS_MAP: 'PLAN',
      KANBAN: 'DO', ACTION_PLAN: 'DO', CHECKLIST: 'DO',
      KPI_DASHBOARD: 'CHECK', SPC_CHART: 'CHECK', HISTOGRAM: 'CHECK',
      RUN_CHART: 'CHECK', BEFORE_AFTER: 'CHECK',
      STANDARDIZATION: 'ACT', AUDIT: 'ACT', LESSONS_LEARNED: 'ACT', SOP: 'ACT', TRAINING: 'ACT',
    };

    const phaseName = phaseMap[toolType] || 'PLAN';
    const phase = await this.prisma.projectPhase.findFirst({
      where: { projectId, phase: phaseName as any },
    });

    return this.prisma.toolData.create({
      data: {
        projectId,
        phaseId: phase?.id,
        toolType: toolType as ToolType,
        data,
        name: name || `${toolType} — ${new Date().toLocaleDateString('pt-BR')}`,
        isDraft: isDraft !== undefined ? isDraft : true,
        createdById: user.id,
      },
    });
  }

  async deleteToolData(projectId: string, toolType: string, user: RequestUser) {
    await this.assertProjectAccess(projectId, user);
    const tool = await this.prisma.toolData.findFirst({
      where: { projectId, toolType: toolType as ToolType },
    });
    if (!tool) throw new NotFoundException('Ferramenta não encontrada');
    return this.prisma.toolData.delete({ where: { id: tool.id } });
  }

  private async assertProjectAccess(projectId: string, user: RequestUser) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.orgId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
          { isPublic: true },
        ],
      },
    });
    if (!project && !['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new NotFoundException('Projeto não encontrado ou sem acesso');
    }
  }
}
