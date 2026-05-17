'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, ComposedChart, Bar, Area,
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
