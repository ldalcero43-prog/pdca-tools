import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KpisService {
  constructor(private prisma: PrismaService) {}

  async getKpis(projectId: string) {
    const kpis = await this.prisma.projectKpi.findMany({
      where: { projectId },
      include: {
        measurements: { orderBy: { measuredAt: 'asc' }, take: 100 },
      },
      orderBy: { createdAt: 'asc' },
    });

    return kpis.map((kpi) => ({
      ...kpi,
      progress: this.calculateProgress(kpi),
      trend: this.calculateTrend(kpi.measurements),
      isOnTrack: this.isOnTrack(kpi),
    }));
  }

  async createKpi(projectId: string, dto: any) {
    return this.prisma.projectKpi.create({
      data: { ...dto, projectId },
    });
  }

  async updateKpi(projectId: string, kpiId: string, dto: any) {
    const kpi = await this.prisma.projectKpi.findFirst({ where: { id: kpiId, projectId } });
    if (!kpi) throw new NotFoundException('KPI não encontrado');
    return this.prisma.projectKpi.update({ where: { id: kpiId }, data: dto });
  }

  async addMeasurement(projectId: string, kpiId: string, dto: any, userId: string) {
    const kpi = await this.prisma.projectKpi.findFirst({ where: { id: kpiId, projectId } });
    if (!kpi) throw new NotFoundException('KPI não encontrado');

    const measurement = await this.prisma.kpiMeasurement.create({
      data: {
        kpiId,
        value: dto.value,
        measuredAt: new Date(dto.measuredAt),
        notes: dto.notes,
        source: dto.source || 'manual',
      },
    });

    // Update current value on KPI
    await this.prisma.projectKpi.update({
      where: { id: kpiId },
      data: { current: dto.value },
    });

    return measurement;
  }

  async getMeasurements(projectId: string, kpiId: string) {
    const kpi = await this.prisma.projectKpi.findFirst({ where: { id: kpiId, projectId } });
    if (!kpi) throw new NotFoundException('KPI não encontrado');

    return this.prisma.kpiMeasurement.findMany({
      where: { kpiId },
      orderBy: { measuredAt: 'asc' },
    });
  }

  async getSpcData(projectId: string, kpiId: string) {
    const measurements = await this.getMeasurements(projectId, kpiId);
    if (measurements.length < 2) return null;

    const values = measurements.map((m) => Number(m.value));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    const ucl = mean + 3 * stdDev;
    const lcl = mean - 3 * stdDev;

    const violations: Array<{ index: number; type: string }> = [];
    values.forEach((v, i) => {
      if (v > ucl || v < lcl) violations.push({ index: i, type: 'beyond_3sigma' });
    });

    // Rule: 8 consecutive points on same side of mean
    let sameSign = 1;
    for (let i = 1; i < values.length; i++) {
      if ((values[i] > mean) === (values[i - 1] > mean)) {
        sameSign++;
        if (sameSign >= 8) violations.push({ index: i, type: 'run_of_8' });
      } else {
        sameSign = 1;
      }
    }

    return { measurements, mean, stdDev, ucl, lcl, violations };
  }

  private calculateProgress(kpi: any): number | null {
    if (kpi.baseline === null || kpi.target === null || kpi.current === null) return null;
    const baseline = Number(kpi.baseline);
    const target = Number(kpi.target);
    const current = Number(kpi.current);

    if (target === baseline) return 100;

    const progress = ((current - baseline) / (target - baseline)) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  private calculateTrend(measurements: any[]): 'up' | 'down' | 'stable' | null {
    if (measurements.length < 3) return null;
    const last3 = measurements.slice(-3).map((m) => Number(m.value));
    const firstAvg = (last3[0] + last3[1]) / 2;
    const lastVal = last3[2];
    const diff = (lastVal - firstAvg) / Math.max(Math.abs(firstAvg), 0.001);
    if (diff > 0.02) return 'up';
    if (diff < -0.02) return 'down';
    return 'stable';
  }

  private isOnTrack(kpi: any): boolean {
    if (!kpi.target || !kpi.current) return true;
    const progress = this.calculateProgress(kpi);
    return progress !== null && progress >= 50;
  }
}
