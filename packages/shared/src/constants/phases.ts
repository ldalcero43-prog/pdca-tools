export const PHASE_ORDER = ['PLAN', 'DO', 'CHECK', 'ACT'] as const;

export const PHASE_LABELS: Record<string, string> = {
  PLAN: 'Plan',
  DO: 'Do',
  CHECK: 'Check',
  ACT: 'Act',
};

export const PHASE_DESCRIPTIONS: Record<string, string> = {
  PLAN: 'Identificar o problema, analisar causas e planejar soluções',
  DO: 'Implementar o plano de ação de forma controlada',
  CHECK: 'Monitorar resultados e comparar com as metas',
  ACT: 'Padronizar melhorias e planejar o próximo ciclo',
};
