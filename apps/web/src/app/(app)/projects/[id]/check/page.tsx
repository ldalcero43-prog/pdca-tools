'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { SpcChart, Sparkline, Histogram, BeforeAfterChart } from '@/components/charts/kpi-chart';
import { cn, formatNumber } from '@/lib/utils';
import { Plus, TrendingUp, TrendingDown, Minus, Target, X } from 'lucide-react';

interface KpiMeasurement {
  id: string;
  value: number;
  date: string;
  notes?: string;
}

interface Kpi {
  id: string;
  name: string;
  unit: string;
  baseline: number | null;
  target: number | null;
  current: number | null;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  measurements: KpiMeasurement[];
  progress?: number | null;
  isOnTrack?: boolean;
  trend?: 'up' | 'down' | 'stable';
}

interface SpcData {
  mean: number;
  ucl: number;
  lcl: number;
  stdDev: number;
  violations: { index: number; type: string }[];
  points: { date: string; value: number; isViolation?: boolean }[];
}

interface NewKpiForm {
  name: string;
  unit: string;
  baseline: string;
  target: string;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
}

function TrendIcon({ trend, direction }: { trend?: string; direction: string }) {
  const up = trend === 'up';
  const down = trend === 'down';
  const isGood = (direction === 'UP' && up) || (direction === 'DOWN' && down);
  const isBad = (direction === 'UP' && down) || (direction === 'DOWN' && up);

  if (up) return <TrendingUp size={14} className={cn(isGood ? 'text-[#16A34A]' : isBad ? 'text-[#DC2626]' : 'text-[#888888]')} />;
  if (down) return <TrendingDown size={14} className={cn(isGood ? 'text-[#16A34A]' : isBad ? 'text-[#DC2626]' : 'text-[#888888]')} />;
  return <Minus size={14} className="text-[#888888]" />;
}

function progressColor(pct: number | null | undefined) {
  if (pct == null) return 'text-[#888888]';
  if (pct >= 80) return 'text-[#16A34A]';
  if (pct >= 40) return 'text-[#D97706]';
  return 'text-[#DC2626]';
}

export default function CheckPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [spcData, setSpcData] = useState<SpcData | null>(null);
  const [spcLoading, setSpcLoading] = useState(false);
  const [showNewKpi, setShowNewKpi] = useState(false);
  const [showAddMeasurement, setShowAddMeasurement] = useState<string | null>(null);
  const [newMeasure, setNewMeasure] = useState({ value: '', notes: '', date: new Date().toISOString().slice(0, 10) });
  const [newKpi, setNewKpi] = useState<NewKpiForm>({ name: '', unit: '', baseline: '', target: '', direction: 'DOWN' });

  useEffect(() => {
    loadKpis();
  }, [projectId]);

  async function loadKpis() {
    try {
      const res = await api.get<any>(`/projects/${projectId}/kpis`);
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setKpis(list);
      if (list.length > 0 && !selectedKpi) setSelectedKpi(list[0].id);
    } catch {
      setKpis([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedKpi) return;
    setSpcLoading(true);
    setSpcData(null);
    api.get<SpcData>(`/projects/${projectId}/kpis/${selectedKpi}/spc`)
      .then(setSpcData)
      .catch(() => setSpcData(null))
      .finally(() => setSpcLoading(false));
  }, [selectedKpi, projectId]);

  async function handleCreateKpi() {
    if (!newKpi.name.trim()) return;
    try {
      const created = await api.post<Kpi>(`/projects/${projectId}/kpis`, {
        name: newKpi.name,
        unit: newKpi.unit || undefined,
        baseline: newKpi.baseline ? parseFloat(newKpi.baseline) : undefined,
        target: newKpi.target ? parseFloat(newKpi.target) : undefined,
        direction: newKpi.direction,
      });
      setKpis((prev) => [...prev, created]);
      setShowNewKpi(false);
      setNewKpi({ name: '', unit: '', baseline: '', target: '', direction: 'DOWN' });
      setSelectedKpi(created.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddMeasurement(kpiId: string) {
    if (!newMeasure.value) return;
    try {
      await api.post(`/projects/${projectId}/kpis/${kpiId}/measurements`, {
        value: parseFloat(newMeasure.value),
        date: newMeasure.date,
        notes: newMeasure.notes || undefined,
      });
      setShowAddMeasurement(null);
      setNewMeasure({ value: '', notes: '', date: new Date().toISOString().slice(0, 10) });
      loadKpis();
      if (selectedKpi === kpiId) {
        setSpcLoading(true);
        api.get<SpcData>(`/projects/${projectId}/kpis/${kpiId}/spc`)
          .then(setSpcData)
          .finally(() => setSpcLoading(false));
      }
    } catch (err) {
      console.error(err);
    }
  }

  const selectedKpiData = kpis.find((k) => k.id === selectedKpi);

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando KPIs...</div>;

  return (
    <div className="flex h-full">
      {/* KPI list sidebar */}
      <div className="w-64 shrink-0 border-r border-[#E5E5E5] bg-[#FAFAFA] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">KPIs ({kpis.length})</span>
          <button
            onClick={() => setShowNewKpi(true)}
            className="p-1 hover:bg-[#E5E5E5] rounded-sm transition-colors"
          >
            <Plus size={12} className="text-[#888888]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {kpis.map((kpi) => (
            <button
              key={kpi.id}
              onClick={() => setSelectedKpi(kpi.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-[#E5E5E5] transition-colors',
                selectedKpi === kpi.id ? 'bg-white border-l-2 border-l-[#111111]' : 'hover:bg-white',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-medium text-[#111111] leading-tight">{kpi.name}</span>
                <TrendIcon trend={kpi.trend} direction={kpi.direction} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#111111]">
                  {kpi.current ?? '—'}{kpi.unit ? ` ${kpi.unit}` : ''}
                </span>
                {kpi.progress != null && (
                  <span className={cn('text-[11px] font-medium', progressColor(kpi.progress))}>
                    {kpi.progress}%
                  </span>
                )}
              </div>
              {kpi.measurements && kpi.measurements.length > 1 && (
                <div className="mt-1 -mx-1">
                  <Sparkline
                    data={kpi.measurements.slice(-12).map((m) => ({ value: m.value }))}
                    color={kpi.isOnTrack ? '#16A34A' : '#DC2626'}
                  />
                </div>
              )}
            </button>
          ))}

          {kpis.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-[11px] text-[#888888] mb-3">Nenhum KPI definido</p>
              <button
                onClick={() => setShowNewKpi(true)}
                className="text-[11px] text-[#555555] hover:text-[#111111] transition-colors"
              >
                + Criar KPI
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedKpiData ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* KPI header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#111111]">{selectedKpiData.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">Baseline</div>
                    <div className="text-lg font-semibold text-[#888888]">
                      {selectedKpiData.baseline ?? '—'}{selectedKpiData.unit ? ` ${selectedKpiData.unit}` : ''}
                    </div>
                  </div>
                  <div className="text-[#E5E5E5]">→</div>
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">Atual</div>
                    <div className="text-3xl font-semibold text-[#111111]">
                      {selectedKpiData.current ?? '—'}{selectedKpiData.unit ? ` ${selectedKpiData.unit}` : ''}
                    </div>
                  </div>
                  <div className="text-[#E5E5E5]">→</div>
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] flex items-center gap-1">
                      <Target size={9} />
                      Meta
                    </div>
                    <div className="text-lg font-semibold text-[#2563EB]">
                      {selectedKpiData.target ?? '—'}{selectedKpiData.unit ? ` ${selectedKpiData.unit}` : ''}
                    </div>
                  </div>
                  {selectedKpiData.progress != null && (
                    <>
                      <div className="text-[#E5E5E5]">|</div>
                      <div className="text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">Progresso</div>
                        <div className={cn('text-2xl font-semibold', progressColor(selectedKpiData.progress))}>
                          {selectedKpiData.progress}%
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowAddMeasurement(selectedKpiData.id)}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#E5E5E5] text-xs text-[#555555] hover:bg-[#F4F4F4] transition-colors"
              >
                <Plus size={12} />
                Adicionar medição
              </button>
            </div>

            {/* Progress bar */}
            {selectedKpiData.progress != null && (
              <div>
                <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      selectedKpiData.progress >= 80 ? 'bg-[#16A34A]' : selectedKpiData.progress >= 40 ? 'bg-[#D97706]' : 'bg-[#DC2626]',
                    )}
                    style={{ width: `${Math.min(100, selectedKpiData.progress)}%` }}
                  />
                </div>
              </div>
            )}

            {/* SPC Chart */}
            <div className="bg-white border border-[#E5E5E5] p-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
                Gráfico de Controle (SPC/CEP)
              </h3>
              {spcLoading ? (
                <div className="h-48 flex items-center justify-center text-sm text-[#888888]">Calculando SPC...</div>
              ) : spcData && spcData.points.length >= 2 ? (
                <>
                  <SpcChart
                    data={spcData.points}
                    mean={spcData.mean}
                    ucl={spcData.ucl}
                    lcl={spcData.lcl}
                    unit={selectedKpiData.unit}
                    name={selectedKpiData.name}
                  />
                  {spcData.violations.length > 0 && (
                    <div className="mt-3 px-3 py-2 bg-[#FEF2F2] border border-[#FECACA] text-[11px] text-[#DC2626]">
                      ⚠ {spcData.violations.length} ponto(s) fora dos limites de controle — processo instável
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-[#888888]">Média (x̄)</div>
                      <div className="text-sm font-semibold text-[#111111]">{spcData.mean.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#888888]">UCL</div>
                      <div className="text-sm font-semibold text-[#DC2626]">{spcData.ucl.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#888888]">LCL</div>
                      <div className="text-sm font-semibold text-[#DC2626]">{spcData.lcl.toFixed(2)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-[#888888]">
                  Adicione ao menos 2 medições para visualizar o gráfico SPC
                </div>
              )}
            </div>

            {/* Antes / Depois */}
            {selectedKpiData.baseline != null && selectedKpiData.target != null && selectedKpiData.current != null && (
              <div className="bg-white border border-[#E5E5E5] p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
                  Comparativo Antes / Depois
                </h3>
                <BeforeAfterChart
                  name={selectedKpiData.name}
                  baseline={Number(selectedKpiData.baseline)}
                  current={Number(selectedKpiData.current)}
                  target={Number(selectedKpiData.target)}
                  unit={selectedKpiData.unit}
                  direction={selectedKpiData.direction}
                />
              </div>
            )}

            {/* Histogram */}
            {selectedKpiData.measurements && selectedKpiData.measurements.length >= 5 && (
              <div className="bg-white border border-[#E5E5E5] p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
                  Histograma de Distribuição
                </h3>
                <Histogram
                  values={selectedKpiData.measurements.map((m) => Number(m.value))}
                  unit={selectedKpiData.unit}
                  target={selectedKpiData.target != null ? Number(selectedKpiData.target) : undefined}
                  mean={spcData?.mean}
                  ucl={spcData?.ucl}
                  lcl={spcData?.lcl}
                />
              </div>
            )}

            {/* Measurement history */}
            <div className="bg-white border border-[#E5E5E5] p-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
                Histórico de Medições
              </h3>
              {selectedKpiData.measurements && selectedKpiData.measurements.length > 0 ? (
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedKpiData.measurements].reverse().map((m) => (
                      <tr key={m.id}>
                        <td>
                          <span className="text-xs text-[#555555]">
                            {new Date(m.date).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold text-[#111111]">
                            {m.value}{selectedKpiData.unit ? ` ${selectedKpiData.unit}` : ''}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-[#888888]">{m.notes || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-[#888888] text-center py-4">
                  Nenhuma medição registrada ainda
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[#888888]">
            Selecione um KPI para visualizar os dados
          </div>
        )}
      </div>

      {/* New KPI modal */}
      {showNewKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white border border-[#E5E5E5] p-6 w-96 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-[#111111]">Novo KPI</h3>
              <button onClick={() => setShowNewKpi(false)}>
                <X size={14} className="text-[#888888]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Nome *</label>
                <input
                  value={newKpi.name}
                  onChange={(e) => setNewKpi((n) => ({ ...n, name: e.target.value }))}
                  autoFocus
                  placeholder="Ex: Lead Time de Entrega"
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Unidade</label>
                  <input
                    value={newKpi.unit}
                    onChange={(e) => setNewKpi((n) => ({ ...n, unit: e.target.value }))}
                    placeholder="dias, %, R$..."
                    className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Direção</label>
                  <select
                    value={newKpi.direction}
                    onChange={(e) => setNewKpi((n) => ({ ...n, direction: e.target.value as 'UP' | 'DOWN' | 'NEUTRAL' }))}
                    className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                  >
                    <option value="DOWN">Reduzir (↓)</option>
                    <option value="UP">Aumentar (↑)</option>
                    <option value="NEUTRAL">Neutro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Baseline</label>
                  <input
                    type="number"
                    value={newKpi.baseline}
                    onChange={(e) => setNewKpi((n) => ({ ...n, baseline: e.target.value }))}
                    placeholder="Valor atual"
                    className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Meta</label>
                  <input
                    type="number"
                    value={newKpi.target}
                    onChange={(e) => setNewKpi((n) => ({ ...n, target: e.target.value }))}
                    placeholder="Valor desejado"
                    className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setShowNewKpi(false)} className="text-xs text-[#888888] hover:text-[#555555] transition-colors px-3 py-2">
                Cancelar
              </button>
              <button
                onClick={handleCreateKpi}
                disabled={!newKpi.name.trim()}
                className="px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
              >
                Criar KPI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add measurement modal */}
      {showAddMeasurement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white border border-[#E5E5E5] p-6 w-80 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-[#111111]">Nova Medição</h3>
              <button onClick={() => setShowAddMeasurement(null)}>
                <X size={14} className="text-[#888888]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Valor *</label>
                <input
                  type="number"
                  value={newMeasure.value}
                  onChange={(e) => setNewMeasure((m) => ({ ...m, value: e.target.value }))}
                  autoFocus
                  placeholder="0"
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Data</label>
                <input
                  type="date"
                  value={newMeasure.date}
                  onChange={(e) => setNewMeasure((m) => ({ ...m, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">Observações</label>
                <input
                  value={newMeasure.notes}
                  onChange={(e) => setNewMeasure((m) => ({ ...m, notes: e.target.value }))}
                  placeholder="Contexto da medição..."
                  className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setShowAddMeasurement(null)} className="text-xs text-[#888888] hover:text-[#555555] transition-colors px-3 py-2">
                Cancelar
              </button>
              <button
                onClick={() => handleAddMeasurement(showAddMeasurement)}
                disabled={!newMeasure.value}
                className="px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
