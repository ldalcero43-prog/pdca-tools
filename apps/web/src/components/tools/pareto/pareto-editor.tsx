'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { Trash2, Plus } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';

interface ParetoItem {
  id: string;
  label: string;
  value: number;
}

interface ParetoData {
  title: string;
  unit: string;
  items: ParetoItem[];
}

const META = {
  name: 'Gráfico de Pareto',
  description: 'Identifica os poucos fatores vitais que causam a maioria dos problemas, baseado na regra 80/20 (Princípio de Pareto).',
  objective: 'Priorizar causas pelo impacto acumulado para concentrar esforços onde o ganho é maior',
  whenToUse: [
    'Priorizar causas de problemas por frequência ou impacto',
    'Focar os 20% de causas que geram 80% do impacto',
    'Comparar dados antes e depois de uma melhoria',
    'Justificar priorização de recursos à gestão',
  ],
  whenToAvoid: [
    'Quando todas as causas têm peso muito similar (use GUT Matrix)',
    'Quando os dados de frequência não estão disponíveis',
  ],
  difficulty: 'intermediate' as const,
  estimatedDuration: '1–2 horas',
  stepByStep: [
    { title: 'Liste as causas ou categorias', description: 'Identifique todas as causas, tipos de defeito ou categorias de problema relevantes.' },
    { title: 'Quantifique cada causa', description: 'Use dados reais: frequência de ocorrência, custo, tempo perdido. Evite estimativas.' },
    { title: 'Ordene do maior para o menor', description: 'O sistema ordena automaticamente. Verifique se os dados fazem sentido.' },
    { title: 'Identifique o corte dos 80%', description: 'As causas até o acumulado de 80% são as "causas vitais" — foco da ação corretiva.' },
    { title: 'Aja nas causas vitais', description: 'Concentre recursos nas causas à esquerda da linha de 80%. Ignore as triviais por enquanto.' },
  ],
  commonErrors: [
    'Misturar métricas de natureza diferente (ex: custo e frequência no mesmo gráfico)',
    'Usar estimativas em vez de dados reais',
    'Tratar todas as causas igualmente após o Pareto',
    'Não validar os dados com quem opera o processo',
  ],
  bestPractices: [
    'Use o mesmo período de coleta para todas as causas',
    'Estratifique: um Pareto de defeitos → selecione o maior → novo Pareto das causas daquele defeito',
    'Refaça o Pareto após implementar melhorias para medir o impacto',
    'Uma causa com 80%+ do impacto sozinha indica um problema sistêmico prioritário',
  ],
  exampleContext: 'Exemplo: Análise de 5 tipos de atraso na expedição (total: 180 casos/mês). "NF não emitida" = 95 casos (53%), "separação incorreta" = 42 (23%). Os dois primeiros somam 76% — foco da ação.',
};

function uid() { return Math.random().toString(36).slice(2, 9); }

interface Props {
  projectId: string;
  toolData: ParetoData | null;
  onDataChange: (data: ParetoData) => void;
}

export function ParetoEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<ParetoData>(() => toolData || {
    title: '',
    unit: 'ocorrências',
    items: [
      { id: uid(), label: '', value: 0 },
      { id: uid(), label: '', value: 0 },
      { id: uid(), label: '', value: 0 },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const update = useCallback((patch: Partial<ParetoData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  const updateItem = (id: string, field: 'label' | 'value', val: string) => {
    update({
      items: data.items.map((item) =>
        item.id === id ? { ...item, [field]: field === 'value' ? parseFloat(val) || 0 : val } : item
      ),
    });
  };

  const addItem = () => update({ items: [...data.items, { id: uid(), label: '', value: 0 }] });
  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    update({ items: data.items.filter((i) => i.id !== id) });
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/PARETO`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Sort desc and compute cumulative %
  const sorted = [...data.items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0);
  let cumulative = 0;
  const chartData = sorted.map((item, i) => {
    cumulative += item.value;
    const cumPct = total > 0 ? Math.round((cumulative / total) * 100) : 0;
    return {
      name: item.label || `Item ${i + 1}`,
      value: item.value,
      cumPct,
      isVital: cumPct <= 80 || (i > 0 && sorted.slice(0, i).reduce((s, x) => s + x.value, 0) / total < 0.8),
    };
  });

  const hasChart = chartData.length > 0;

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
              Título da análise
            </label>
            <input
              value={data.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Ex: Causas de atraso na expedição"
              className="w-full px-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
              Unidade de medida
            </label>
            <input
              value={data.unit}
              onChange={(e) => update({ unit: e.target.value })}
              placeholder="ocorrências, R$, horas..."
              className="w-full px-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888]">
              Causas / Categorias
            </label>
            <span className="text-[11px] text-[#888888]">Total: {total.toLocaleString('pt-BR')} {data.unit}</span>
          </div>
          <div className="space-y-2">
            {data.items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-[11px] text-[#AAAAAA] w-5 shrink-0 text-right">{i + 1}.</span>
                <input
                  value={item.label}
                  onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                  placeholder={`Causa ${i + 1}`}
                  className="flex-1 px-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
                />
                <input
                  type="number"
                  min="0"
                  value={item.value || ''}
                  onChange={(e) => updateItem(item.id, 'value', e.target.value)}
                  placeholder="0"
                  className="w-28 px-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] text-right placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={data.items.length <= 1}
                  className="p-1.5 text-[#AAAAAA] hover:text-[#DC2626] disabled:opacity-30 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-3 flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors"
          >
            <Plus size={12} /> Adicionar causa
          </button>
        </div>

        {/* Chart */}
        {hasChart && (
          <div className="border border-[#E5E5E5] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-5">
              Gráfico de Pareto
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 40, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#888888' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={55}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#888888' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#888888' }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #E5E5E5', borderRadius: 0, boxShadow: 'none' }}
                  formatter={(val: any, name: string) => [
                    name === 'cumPct' ? `${val}%` : `${val} ${data.unit}`,
                    name === 'cumPct' ? '% Acumulado' : data.unit,
                  ]}
                />
                <Bar yAxisId="left" dataKey="value" maxBarSize={60}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.isVital ? '#111111' : '#CCCCCC'} />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumPct"
                  stroke="#D97706"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#D97706', stroke: '#D97706' }}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={80}
                  stroke="#DC2626"
                  strokeDasharray="4 4"
                  label={{ value: '80%', position: 'insideTopRight', fontSize: 10, fill: '#DC2626', dy: -4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Summary table */}
            <table className="w-full mt-4 text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5]">
                  <th className="text-left py-2 font-semibold text-[#888888] uppercase tracking-wide">Causa</th>
                  <th className="text-right py-2 font-semibold text-[#888888] uppercase tracking-wide">{data.unit}</th>
                  <th className="text-right py-2 font-semibold text-[#888888] uppercase tracking-wide">%</th>
                  <th className="text-right py-2 font-semibold text-[#888888] uppercase tracking-wide">% Acum.</th>
                  <th className="text-right py-2 font-semibold text-[#888888] uppercase tracking-wide">Classe</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.name} className="border-b border-[#F4F4F4]">
                    <td className={`py-1.5 ${row.isVital ? 'font-semibold text-[#111111]' : 'text-[#888888]'}`}>
                      {row.name}
                    </td>
                    <td className="text-right py-1.5 text-[#111111]">{row.value.toLocaleString('pt-BR')}</td>
                    <td className="text-right py-1.5 text-[#555555]">
                      {total > 0 ? ((row.value / total) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="text-right py-1.5 font-medium text-[#111111]">{row.cumPct}%</td>
                    <td className="text-right py-1.5">
                      {row.isVital ? (
                        <span className="text-[#111111] font-semibold">Vital</span>
                      ) : (
                        <span className="text-[#AAAAAA]">Trivial</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {chartData.filter((r) => r.isVital).length > 0 && (
              <p className="text-[11px] text-[#888888] mt-3">
                <span className="font-semibold text-[#111111]">{chartData.filter((r) => r.isVital).length} causa(s) vital(is)</span>
                {' '}responsável(is) por{' '}
                <span className="font-semibold text-[#111111]">
                  {Math.round((chartData.filter((r) => r.isVital).reduce((s, r) => s + r.value, 0) / total) * 100)}%
                </span>
                {' '}do total. Concentre as ações corretivas aqui.
              </p>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
