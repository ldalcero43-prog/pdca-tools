export type KpiType = 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'TIME_HOURS' | 'TIME_DAYS' | 'RATE' | 'INDEX';
export type KpiDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER' | 'TARGET_IS_BETTER';
export type PhaseType = 'PLAN' | 'DO' | 'CHECK' | 'ACT';

export interface KpiSummary {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  unit: string | null;
  type: KpiType;
  direction: KpiDirection;
  baseline: number | null;
  target: number | null;
  current: number | null;
  phase: PhaseType;
  isFinancial: boolean;
  progress: number | null;
  trend: 'up' | 'down' | 'stable' | null;
  isOnTrack: boolean;
  updatedAt: string;
}

export interface KpiMeasurement {
  id: string;
  kpiId: string;
  value: number;
  measuredAt: string;
  notes: string | null;
  source: string | null;
}

export interface SpcData {
  measurements: KpiMeasurement[];
  mean: number;
  stdDev: number;
  ucl: number;
  lcl: number;
  violations: Array<{ index: number; type: 'beyond_3sigma' | 'run_of_8' }>;
}

export interface CreateKpiDto {
  name: string;
  description?: string;
  unit?: string;
  type: KpiType;
  direction: KpiDirection;
  baseline?: number;
  target?: number;
  phase: PhaseType;
  isFinancial?: boolean;
  templateId?: string;
}

export interface AddMeasurementDto {
  value: number;
  measuredAt: string;
  notes?: string;
  source?: string;
}
