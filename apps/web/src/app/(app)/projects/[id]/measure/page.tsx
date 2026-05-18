'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { ParetoEditor } from '@/components/tools/pareto/pareto-editor';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, CheckCircle2, Clock } from 'lucide-react';

interface ToolDef {
  type: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  recommended?: boolean;
}

const MEASURE_TOOLS: ToolDef[] = [
  {
    type: 'PARETO',
    name: 'Gráfico de Pareto (Baseline)',
    description: 'Quantifique e estratifique os problemas / defeitos atuais. Identifique as causas vitais antes de analisar. Use dados reais do baseline.',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
    recommended: true,
  },
];

const TOOL_EDITORS: Record<string, React.ComponentType<{ projectId: string; toolData: any; onDataChange: (d: any) => void }>> = {
  PARETO: ParetoEditor,
};

const DIFFICULTY_LABELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };
const DIFFICULTY_COLORS = { beginner: 'text-[#16A34A]', intermediate: 'text-[#D97706]', advanced: 'text-[#DC2626]' };

export default function MeasurePage() {
  const { id } = useParams();
  const projectId = id as string;
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolDataMap, setToolDataMap] = useState<Record<string, any>>({});
  const [activatedTools, setActivatedTools] = useState<Set<string>>(new Set());
  const [toolStatuses, setToolStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    async function loadTools() {
      try {
        const res = await api.get<any[]>(`/projects/${projectId}/tools`);
        const tools = Array.isArray(res) ? res : (res as any)?.data || [];
        const dataMap: Record<string, any> = {};
        const statusMap: Record<string, string> = {};
        const activated = new Set<string>();
        tools.forEach((t: any) => {
          dataMap[t.toolType] = t.data;
          statusMap[t.toolType] = t.status;
          activated.add(t.toolType);
        });
        setToolDataMap(dataMap);
        setToolStatuses(statusMap);
        setActivatedTools(activated);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    loadTools();
  }, [projectId]);

  async function handleActivate(toolType: string) {
    setActivating(toolType);
    try {
      await api.put(`/projects/${projectId}/tools/${toolType}`, { data: {} });
      setActivatedTools((prev) => new Set([...prev, toolType]));
      setSelectedTool(toolType);
    } catch (err) { console.error(err); }
    finally { setActivating(null); }
  }

  const ToolEditor = selectedTool ? TOOL_EDITORS[selectedTool] : null;

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando ferramentas...</div>;

  if (selectedTool && ToolEditor) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-2.5 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0">
          <button onClick={() => setSelectedTool(null)} className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors">
            <ArrowLeft size={12} /> Voltar às ferramentas
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <ToolEditor
            projectId={projectId}
            toolData={toolDataMap[selectedTool] || null}
            onDataChange={(data) => setToolDataMap((prev) => ({ ...prev, [selectedTool!]: data }))}
          />
        </div>
      </div>
    );
  }

  const active = MEASURE_TOOLS.filter((t) => activatedTools.has(t.type));
  const available = MEASURE_TOOLS.filter((t) => !activatedTools.has(t.type));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-l-2 border-[#7C3AED] pl-4">
        <h2 className="text-xs font-semibold text-[#7C3AED] uppercase tracking-widest mb-0.5">M — Measure</h2>
        <p className="text-[11px] text-[#888888]">
          Colete dados do processo atual (baseline). Quantifique a magnitude do problema com fatos e números antes de analisar as causas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-[#FAFAFA] border border-[#E5E5E5]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">O que fazer nesta fase</p>
          <ul className="text-[11px] text-[#555555] space-y-1 leading-relaxed">
            <li>• Definir o plano de coleta de dados (quem, onde, quando)</li>
            <li>• Validar o sistema de medição (MSA/R&R)</li>
            <li>• Coletar dados do estado atual (baseline)</li>
            <li>• Estratificar por tipo de defeito, turno, máquina, operador</li>
            <li>• Registrar KPIs baseline no painel CHECK</li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">Ferramentas de apoio</p>
          <ul className="text-[11px] text-[#555555] space-y-1 leading-relaxed">
            <li>• <span className="font-medium">Folha de verificação</span> — coleta estruturada de dados</li>
            <li>• <span className="font-medium">Histograma</span> — distribuição dos dados (painel CHECK)</li>
            <li>• <span className="font-medium">Gráfico de Controle (SPC)</span> — estabilidade do processo (painel CHECK)</li>
            <li>• <span className="font-medium">Pareto</span> — estratificação das causas medidas</li>
          </ul>
        </div>
      </div>

      {active.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-3">Ferramentas ativas</h3>
          <div className="grid grid-cols-2 gap-3">
            {active.map((tool) => {
              const status = toolStatuses[tool.type];
              const isDone = status === 'COMPLETED' || status === 'DONE';
              const isProgress = status === 'IN_PROGRESS';
              return (
                <button
                  key={tool.type}
                  onClick={() => setSelectedTool(tool.type)}
                  className={cn(
                    'text-left p-4 bg-white border transition-all hover:border-[#111111] hover:shadow-sm',
                    isDone ? 'border-[#16A34A]/40' : isProgress ? 'border-[#D97706]/40' : 'border-[#E5E5E5]',
                  )}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#111111]">{tool.name}</span>
                    {isDone ? <CheckCircle2 size={13} className="text-[#16A34A] shrink-0" />
                      : isProgress ? <Clock size={13} className="text-[#D97706] shrink-0" /> : null}
                  </div>
                  <p className="text-[11px] text-[#888888] leading-relaxed">{tool.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={cn('text-[10px] font-medium', DIFFICULTY_COLORS[tool.difficulty])}>
                      {DIFFICULTY_LABELS[tool.difficulty]}
                    </span>
                    <span className="text-[10px] text-[#AAAAAA]">{tool.estimatedDuration}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-3">
            {active.length > 0 ? 'Disponíveis' : 'Ferramentas disponíveis'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {available.map((tool) => (
              <div key={tool.type} className="relative p-4 bg-white border border-dashed border-[#E5E5E5] hover:border-[#AAAAAA] transition-all">
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#111111]">{tool.name}</span>
                  {tool.recommended && (
                    <span className="text-[9px] font-semibold text-[#7C3AED] border border-[#7C3AED]/30 px-1.5 py-0.5 bg-[#F5F3FF]">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#888888] leading-relaxed mb-3">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn('text-[10px] font-medium', DIFFICULTY_COLORS[tool.difficulty])}>
                      {DIFFICULTY_LABELS[tool.difficulty]}
                    </span>
                    <span className="text-[10px] text-[#AAAAAA]">{tool.estimatedDuration}</span>
                  </div>
                  <button
                    onClick={() => handleActivate(tool.type)}
                    disabled={activating === tool.type}
                    className="flex items-center gap-1 text-[11px] text-[#555555] hover:text-[#111111] border border-[#E5E5E5] hover:border-[#111111] px-2 py-1 transition-colors disabled:opacity-50"
                  >
                    <Plus size={11} />
                    {activating === tool.type ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
