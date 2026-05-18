'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { FiveWhysEditor } from '@/components/tools/five-whys/five-whys-editor';
import { IshikawaEditor } from '@/components/tools/ishikawa/ishikawa-editor';
import { FmeaEditor } from '@/components/tools/fmea/fmea-editor';
import { ParetoEditor } from '@/components/tools/pareto/pareto-editor';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, CheckCircle2, Clock, Trash2 } from 'lucide-react';

interface ToolDef {
  type: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  recommended?: boolean;
}

const ANALYZE_TOOLS: ToolDef[] = [
  {
    type: 'FIVE_WHYS',
    name: '5 Porquês',
    description: 'Análise de causa raiz por questionamentos sucessivos. Ideal quando a cadeia causal é clara e linear.',
    difficulty: 'beginner',
    estimatedDuration: '30–60 min',
    recommended: true,
  },
  {
    type: 'ISHIKAWA',
    name: 'Diagrama de Ishikawa',
    description: 'Espinha de peixe com 6M (Método, Máquina, Material, Mão de obra, Medição, Meio ambiente). Para problemas com múltiplas causas.',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
    recommended: true,
  },
  {
    type: 'FMEA',
    name: 'FMEA — Análise de Risco',
    description: 'Identifica modos de falha e calcula o RPN (Gravidade × Ocorrência × Detecção). Prioriza ações de mitigação de risco.',
    difficulty: 'intermediate',
    estimatedDuration: '2–4 horas',
    recommended: true,
  },
  {
    type: 'PARETO',
    name: 'Pareto — Estratificação',
    description: 'Re-analise os dados coletados no Measure para confirmar quais causas têm maior impacto acumulado.',
    difficulty: 'intermediate',
    estimatedDuration: '1 hora',
  },
];

const TOOL_EDITORS: Record<string, React.ComponentType<{ projectId: string; toolData: any; onDataChange: (d: any) => void }>> = {
  FIVE_WHYS: FiveWhysEditor,
  ISHIKAWA: IshikawaEditor,
  FMEA: FmeaEditor,
  PARETO: ParetoEditor,
};

const DIFFICULTY_LABELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };
const DIFFICULTY_COLORS = { beginner: 'text-[#16A34A]', intermediate: 'text-[#D97706]', advanced: 'text-[#DC2626]' };

export default function AnalyzePage() {
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

  async function handleRemove(toolType: string) {
    const tool = ANALYZE_TOOLS.find((t) => t.type === toolType);
    if (!confirm(`Remover "${tool?.name}"? Os dados salvos serão perdidos.`)) return;
    try {
      await api.delete(`/projects/${projectId}/tools/${toolType}`);
      setActivatedTools((prev) => { const s = new Set(prev); s.delete(toolType); return s; });
      setToolDataMap((prev) => { const m = { ...prev }; delete m[toolType]; return m; });
      if (selectedTool === toolType) setSelectedTool(null);
    } catch (err) { console.error(err); }
  }

  const ToolEditor = selectedTool ? TOOL_EDITORS[selectedTool] : null;

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando ferramentas...</div>;

  if (selectedTool && ToolEditor) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0">
          <button onClick={() => setSelectedTool(null)} className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors">
            <ArrowLeft size={12} /> Voltar às ferramentas
          </button>
          <button onClick={() => handleRemove(selectedTool!)} className="flex items-center gap-1 text-[11px] text-[#AAAAAA] hover:text-[#DC2626] transition-colors">
            <Trash2 size={11} /> Remover ferramenta
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

  const active = ANALYZE_TOOLS.filter((t) => activatedTools.has(t.type));
  const available = ANALYZE_TOOLS.filter((t) => !activatedTools.has(t.type));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-l-2 border-[#D97706] pl-4">
        <h2 className="text-xs font-semibold text-[#D97706] uppercase tracking-widest mb-0.5">A — Analyze</h2>
        <p className="text-[11px] text-[#888888]">
          Identifique e valide as causas raiz com dados. O objetivo é saber EXATAMENTE por que o problema acontece antes de propor soluções.
        </p>
      </div>

      {active.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-3">Ferramentas ativas ({active.length})</h3>
          <div className="grid grid-cols-2 gap-3">
            {active.map((tool) => {
              const status = toolStatuses[tool.type];
              const isDone = status === 'COMPLETED' || status === 'DONE';
              const isProgress = status === 'IN_PROGRESS';
              return (
                <div key={tool.type} className="relative group">
                  <button
                    onClick={() => setSelectedTool(tool.type)}
                    className={cn(
                      'w-full text-left p-4 bg-white border transition-all hover:border-[#111111] hover:shadow-sm',
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
                  <button
                    onClick={() => handleRemove(tool.type)}
                    title="Remover ferramenta"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-[#AAAAAA] hover:text-[#DC2626] transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-3">
            {active.length > 0 ? 'Disponíveis para adicionar' : 'Escolha as ferramentas de análise'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {available.map((tool) => (
              <div key={tool.type} className="relative p-4 bg-white border border-dashed border-[#E5E5E5] hover:border-[#AAAAAA] transition-all">
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#111111]">{tool.name}</span>
                  {tool.recommended && (
                    <span className="text-[9px] font-semibold text-[#D97706] border border-[#D97706]/30 px-1.5 py-0.5 bg-[#FFFBEB]">
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
