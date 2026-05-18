'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { FiveWhysEditor } from '@/components/tools/five-whys/five-whys-editor';
import { IshikawaEditor } from '@/components/tools/ishikawa/ishikawa-editor';
import { SwotEditor } from '@/components/tools/swot/swot-editor';
import { SipocEditor } from '@/components/tools/sipoc/sipoc-editor';
import { FlowchartEditor } from '@/components/tools/flowchart/flowchart-editor';
import { ParetoEditor } from '@/components/tools/pareto/pareto-editor';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, CheckCircle2, Clock, ChevronRight, Zap, Trash2 } from 'lucide-react';

interface ToolDef {
  type: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  recommended?: boolean;
}

const PLAN_TOOLS: ToolDef[] = [
  {
    type: 'FIVE_WHYS',
    name: '5 Porquês',
    description: 'Análise de causa raiz por questionamentos sucessivos. Ideal para problemas com uma cadeia causal clara.',
    difficulty: 'beginner',
    estimatedDuration: '30–60 min',
    recommended: true,
  },
  {
    type: 'ISHIKAWA',
    name: 'Diagrama de Ishikawa',
    description: 'Espinha de peixe com 6 categorias (6M) para mapear causas potenciais de forma estruturada.',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
    recommended: true,
  },
  {
    type: 'SWOT',
    name: 'Análise SWOT',
    description: 'Mapeia Forças, Fraquezas, Oportunidades e Ameaças do contexto do projeto.',
    difficulty: 'beginner',
    estimatedDuration: '45–90 min',
  },
  {
    type: 'SIPOC',
    name: 'SIPOC',
    description: 'Mapeamento de alto nível: Fornecedor → Entrada → Processo → Saída → Cliente. Define o escopo.',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
  },
  {
    type: 'FLOWCHART',
    name: 'Fluxograma de Processo',
    description: 'Visualiza o fluxo atual (AS-IS) ou futuro (TO-BE) do processo com etapas, decisões e conectores.',
    difficulty: 'beginner',
    estimatedDuration: '1–3 horas',
  },
  {
    type: 'PARETO',
    name: 'Gráfico de Pareto',
    description: 'Identifica os poucos fatores que causam a maioria dos problemas (regra 80/20).',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
  },
];

const TOOL_EDITORS: Record<string, React.ComponentType<{ projectId: string; toolData: any; onDataChange: (d: any) => void }>> = {
  FIVE_WHYS: FiveWhysEditor,
  ISHIKAWA: IshikawaEditor,
  SWOT: SwotEditor,
  SIPOC: SipocEditor,
  FLOWCHART: FlowchartEditor,
  PARETO: ParetoEditor,
};

const DIFFICULTY_LABELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };
const DIFFICULTY_COLORS = { beginner: 'text-[#16A34A]', intermediate: 'text-[#D97706]', advanced: 'text-[#DC2626]' };

export default function PlanPage() {
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
        const res = await api.get<any[]>(`/projects/${projectId}/tools`, { phase: 'PLAN' });
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
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, [projectId]);

  async function handleActivate(toolType: string) {
    setActivating(toolType);
    try {
      await api.put(`/projects/${projectId}/tools/${toolType}`, { data: {} });
      setActivatedTools((prev) => new Set([...prev, toolType]));
      setSelectedTool(toolType);
    } catch (err) {
      console.error(err);
    } finally {
      setActivating(null);
    }
  }

  async function handleRemove(toolType: string) {
    const tool = PLAN_TOOLS.find((t) => t.type === toolType);
    if (!confirm(`Remover "${tool?.name}"? Os dados salvos serão perdidos.`)) return;
    try {
      await api.delete(`/projects/${projectId}/tools/${toolType}`);
      setActivatedTools((prev) => { const s = new Set(prev); s.delete(toolType); return s; });
      setToolDataMap((prev) => { const m = { ...prev }; delete m[toolType]; return m; });
      if (selectedTool === toolType) setSelectedTool(null);
    } catch (err) { console.error(err); }
  }

  const ToolEditor = selectedTool ? TOOL_EDITORS[selectedTool] : null;
  const selectedToolDef = selectedTool ? PLAN_TOOLS.find((t) => t.type === selectedTool) : null;

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando ferramentas...</div>;

  if (selectedTool && ToolEditor) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0">
          <button
            onClick={() => setSelectedTool(null)}
            className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft size={12} />
            Voltar às ferramentas
          </button>
          <button
            onClick={() => handleRemove(selectedTool)}
            className="flex items-center gap-1 text-[11px] text-[#AAAAAA] hover:text-[#DC2626] transition-colors"
          >
            <Trash2 size={11} /> Remover ferramenta
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <ToolEditor
            projectId={projectId}
            toolData={toolDataMap[selectedTool] || null}
            onDataChange={(data) => setToolDataMap((prev) => ({ ...prev, [selectedTool]: data }))}
          />
        </div>
      </div>
    );
  }

  const active = PLAN_TOOLS.filter((t) => activatedTools.has(t.type));
  const available = PLAN_TOOLS.filter((t) => !activatedTools.has(t.type));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Active tools */}
      {active.length > 0 && (
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-3">
            Ferramentas ativas ({active.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {active.map((tool) => {
              const status = toolStatuses[tool.type];
              const isDone = status === 'COMPLETED' || status === 'DONE';
              const isProgress = status === 'IN_PROGRESS';
              return (
                <div
                  key={tool.type}
                  className={cn(
                    'relative group bg-white border transition-all hover:border-[#111111] hover:shadow-sm',
                    isDone ? 'border-[#16A34A]/40' : isProgress ? 'border-[#D97706]/40' : 'border-[#E5E5E5]',
                  )}
                >
                  <button
                    onClick={() => setSelectedTool(tool.type)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#111111]">{tool.name}</span>
                        {tool.recommended && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 border border-[#FDE68A]">
                            <Zap size={9} /> Recom.
                          </span>
                        )}
                      </div>
                      <ChevronRight size={12} className="text-[#AAAAAA] shrink-0 group-hover:opacity-0 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-[#888888] leading-relaxed mb-3 line-clamp-2">{tool.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[10px] font-medium', DIFFICULTY_COLORS[tool.difficulty])}>
                        {DIFFICULTY_LABELS[tool.difficulty]}
                      </span>
                      <span className={cn('text-[10px] font-medium flex items-center gap-0.5',
                        isDone ? 'text-[#16A34A]' : isProgress ? 'text-[#D97706]' : 'text-[#AAAAAA]',
                      )}>
                        {isDone ? <><CheckCircle2 size={10} /> Concluído</> : isProgress ? <><Clock size={10} /> Em andamento</> : 'Não iniciado'}
                      </span>
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

      {/* Available tools */}
      {available.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">
              Adicionar ferramenta
            </h2>
            <span className="text-[10px] text-[#AAAAAA]">— escolha as mais adequadas ao seu problema</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {available.map((tool) => (
              <div
                key={tool.type}
                className="text-left p-4 bg-white border border-dashed border-[#CCCCCC] hover:border-[#111111] transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#888888] group-hover:text-[#111111] transition-colors">{tool.name}</span>
                    {tool.recommended && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 border border-[#FDE68A]">
                        <Zap size={9} /> Recom.
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleActivate(tool.type)}
                    disabled={activating === tool.type}
                    className="flex items-center gap-1 text-[10px] font-medium text-[#555555] hover:text-[#111111] border border-[#E5E5E5] hover:border-[#111111] px-2 py-1 transition-colors disabled:opacity-50"
                  >
                    <Plus size={9} />
                    {activating === tool.type ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
                <p className="text-[11px] text-[#AAAAAA] leading-relaxed mb-2 line-clamp-2">{tool.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-[#AAAAAA]">
                  <span className={DIFFICULTY_COLORS[tool.difficulty]}>{DIFFICULTY_LABELS[tool.difficulty]}</span>
                  <span>⏱ {tool.estimatedDuration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && available.length === 0 && (
        <div className="py-16 text-center text-sm text-[#888888]">
          Nenhuma ferramenta disponível para esta fase.
        </div>
      )}
    </div>
  );
}
