'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, ComposedChart, BarChart, Bar,
  Cell, ReferenceLine as RefLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface SpcDataPoint {
  date: string;
  value: number;
  isViolation?: boolean;
}

interface SpcChartProps {
  data: SpcDataPoint[];
  mean: number;
  ucl: number;
  lcl: number;
  unit?: string;
  name: string;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.isViolation) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#DC2626" stroke="white" strokeWidth={1.5} />;
};

export function SpcChart({ data, mean, ucl, lcl, unit, name }: SpcChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-px bg-[#111111] block" />
          <span className="text-[#888888]">Valor</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-px border-t-2 border-dashed border-[#555555] block" />
          <span className="text-[#888888]">Média ({mean.toFixed(1)})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-px border-t-2 border-dashed border-[#DC2626] block" />
          <span className="text-[#888888]">UCL/LCL</span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={formatted} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#888888' }}
            axisLine={{ stroke: '#E5E5E5' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#888888' }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}${unit ? ` ${unit}` : ''}`}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid #E5E5E5',
              borderRadius: 2,
              fontSize: 11,
              padding: '6px 10px',
              background: 'white',
            }}
            formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ''}`, name]}
          />
          <ReferenceLine y={mean} stroke="#555555" strokeDasharray="4 2" strokeWidth={1.5} />
          <ReferenceLine y={ucl} stroke="#DC2626" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'UCL', fontSize: 9, fill: '#DC2626' }} />
          <ReferenceLine y={lcl} stroke="#DC2626" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'LCL', fontSize: 9, fill: '#DC2626' }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#111111"
            strokeWidth={1.5}
            dot={<CustomDot />}
            activeDot={{ r: 3, fill: '#111111' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SparklineProps {
  data: { value: number }[];
  color?: string;
}

export function Sparkline({ data, color = '#111111' }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Histogram ────────────────────────────────────────────────────────────────

interface HistogramProps {
  values: number[];
  unit?: string;
  target?: number | null;
  mean?: number;
  ucl?: number;
  lcl?: number;
  numBins?: number;
}

function computeBins(values: number[], numBins: number) {
  if (values.length < 2) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: String(min), count: values.length, from: min, to: max }];
  const width = (max - min) / numBins;
  return Array.from({ length: numBins }, (_, i) => {
    const from = min + i * width;
    const to = from + width;
    const count = values.filter((v) => v >= from && (i === numBins - 1 ? v <= to : v < to)).length;
    return { label: from.toFixed(1), count, from, to };
  });
}

export function Histogram({ values, unit, target, mean, ucl, lcl, numBins = 8 }: HistogramProps) {
  const bins = computeBins(values, numBins);
  if (bins.length === 0) return null;

  const max = Math.max(...bins.map((b) => b.count));

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-[11px] flex-wrap">
        <span className="text-[#888888]">n = {values.length} medições</span>
        {mean != null && <span className="flex items-center gap-1"><span className="w-4 h-px border-t-2 border-dashed border-[#555555] inline-block" /><span className="text-[#888888]">Média ({mean.toFixed(1)})</span></span>}
        {ucl != null && <span className="flex items-center gap-1"><span className="w-4 h-px border-t-2 border-dashed border-[#DC2626] inline-block" /><span className="text-[#888888]">UCL/LCL</span></span>}
        {target != null && <span className="flex items-center gap-1"><span className="w-4 h-px border-t border-[#2563EB] inline-block" /><span className="text-[#888888]">Meta</span></span>}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={bins} margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barCategoryGap="4%">
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#888888' }}
            axisLine={{ stroke: '#E5E5E5' }}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit ? ` ${unit}` : ''}`}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#888888' }}
            axisLine={false}
            tickLine={false}
            width={24}
            allowDecimals={false}
            label={{ value: 'freq.', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#888888', offset: 8 }}
          />
          <Tooltip
            contentStyle={{ border: '1px solid #E5E5E5', borderRadius: 2, fontSize: 11, padding: '6px 10px', background: 'white' }}
            formatter={(val: number) => [val, 'Frequência']}
            labelFormatter={(label) => `${label}${unit ? ` ${unit}` : ''}`}
          />
          <Bar dataKey="count" radius={[1, 1, 0, 0]}>
            {bins.map((bin, i) => {
              const isViolation = (ucl != null && bin.from >= ucl) || (lcl != null && bin.to <= lcl);
              const isTarget = target != null && bin.from <= target && bin.to >= target;
              return (
                <Cell
                  key={i}
                  fill={isViolation ? '#DC2626' : isTarget ? '#16A34A' : '#111111'}
                  fillOpacity={isViolation ? 0.6 : isTarget ? 0.7 : 0.15 + (bin.count / max) * 0.65}
                />
              );
            })}
          </Bar>
          {mean != null && <ReferenceLine x={mean.toFixed(1)} stroke="#555555" strokeDasharray="4 2" strokeWidth={1.5} />}
          {ucl != null && <ReferenceLine x={ucl.toFixed(1)} stroke="#DC2626" strokeDasharray="4 2" strokeWidth={1} />}
          {lcl != null && <ReferenceLine x={lcl.toFixed(1)} stroke="#DC2626" strokeDasharray="4 2" strokeWidth={1} />}
          {target != null && <ReferenceLine x={String(target)} stroke="#2563EB" strokeWidth={1} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Before / After comparison ────────────────────────────────────────────────

interface BeforeAfterProps {
  baseline: number;
  current: number;
  target: number;
  unit?: string;
  name: string;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
}

export function BeforeAfterChart({ baseline, current, target, unit, name, direction }: BeforeAfterProps) {
  const fmt = (v: number) => `${v}${unit ? ` ${unit}` : ''}`;
  const data = [
    { label: 'Baseline', value: baseline, fill: '#888888' },
    { label: 'Atual', value: current, fill: '#111111' },
    { label: 'Meta', value: target, fill: '#2563EB' },
  ];
  const progress = baseline !== target
    ? Math.round(((current - baseline) / (target - baseline)) * 100)
    : null;
  const isGoodProgress = direction === 'NEUTRAL' ? null : (direction === 'UP' ? current >= target * 0.9 : current <= target * 1.1);

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">{name}</p>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-[10px] text-[#888888]">Antes</div>
              <div className="text-xl font-semibold text-[#888888]">{fmt(baseline)}</div>
            </div>
            <span className="text-[#C0C0C0] mb-1">→</span>
            <div>
              <div className="text-[10px] text-[#888888]">Depois</div>
              <div className="text-xl font-semibold text-[#111111]">{fmt(current)}</div>
            </div>
            <span className="text-[#C0C0C0] mb-1">|</span>
            <div>
              <div className="text-[10px] text-[#888888]">Meta</div>
              <div className="text-xl font-semibold text-[#2563EB]">{fmt(target)}</div>
            </div>
          </div>
        </div>
        {progress != null && (
          <div className={cn('text-right', isGoodProgress ? 'text-[#16A34A]' : 'text-[#D97706]')}>
            <div className="text-3xl font-semibold">{progress}%</div>
            <div className="text-[10px]">da meta atingida</div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: '#555555' }} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            contentStyle={{ border: '1px solid #E5E5E5', borderRadius: 2, fontSize: 11, padding: '6px 10px', background: 'white' }}
            formatter={(val: number) => [fmt(val), name]}
          />
          <Bar dataKey="value" radius={[0, 1, 1, 0]} maxBarSize={24} label={{ position: 'right', fontSize: 11, fill: '#555555', formatter: fmt }}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={i === 0 ? 0.3 : i === 2 ? 0.25 : 0.9} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
