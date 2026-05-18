'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { SipocEditor } from '@/components/tools/sipoc/sipoc-editor';
import { FlowchartEditor } from '@/components/tools/flowchart/flowchart-editor';
import { SwotEditor } from '@/components/tools/swot/swot-editor';
import { FiveW2HEditor } from '@/components/tools/five-w2h/five-w2h-editor';
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

const DEFINE_TOOLS: ToolDef[] = [
  {
    type: 'SIPOC',
    name: 'SIPOC',
    description: 'Mapeamento de alto nível do processo: Fornecedor → Entrada → Processo → Saída → Cliente. Define o escopo do projeto.',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
    recommended: true,
  },
  {
    type: 'FLOWCHART',
    name: 'Fluxograma AS-IS',
    description: 'Visualiza o fluxo atual do processo com etapas, decisões e conectores. Essencial para identificar o estado atual.',
    difficulty: 'beginner',
    estimatedDuration: '1–3 horas',
    recommended: true,
  },
  {
    type: 'FIVE_W2H',
    name: 'Project Charter (5W2H)',
    description: 'Documento de abertura do projeto: O quê, Por quê, Onde, Quando, Quem, Como e Quanto. Define o escopo formal.',
    difficulty: 'beginner',
    estimatedDuration: '1–2 horas',
    recommended: true,
  },
  {
    type: 'SWOT',
    name: 'Análise SWOT',
    description: 'Avalia Forças, Fraquezas, Oportunidades e Ameaças do contexto do projeto antes de iniciar a execução.',
    difficulty: 'beginner',
    estimatedDuration: '45–90 min',
  },
];

const TOOL_EDITORS: Record<string, React.ComponentType<{ projectId: string; toolData: any; onDataChange: (d: any) => void }>> = {
  SIPOC: SipocEditor,
  FLOWCHART: FlowchartEditor,
  FIVE_W2H: FiveW2HEditor,
  SWOT: SwotEditor,
};

const DIFFICULTY_LABELS = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };
const DIFFICULTY_COLORS = { beginner: 'text-[#16A34A]', intermediate: 'text-[#D97706]', advanced: 'text-[#DC2626]' };

export default function DefinePage() {
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

  const active = DEFINE_TOOLS.filter((t) => activatedTools.has(t.type));
  const available = DEFINE_TOOLS.filter((t) => !activatedTools.has(t.type));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-l-2 border-[#2563EB] pl-4">
        <h2 className="text-xs font-semibold text-[#2563EB] uppercase tracking-widest mb-0.5">D — Define</h2>
        <p className="text-[11px] text-[#888888]">
          Defina o problema, o escopo e o processo atual com precisão. Um Define bem feito evita retrabalho em todas as fases seguintes.
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
                      : isProgress ? <Clock size={13} className="text-[#D97706] shrink-0" />
                      : null}
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
            {active.length > 0 ? 'Disponíveis para adicionar' : 'Escolha as ferramentas'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {available.map((tool) => (
              <div key={tool.type} className="relative p-4 bg-white border border-dashed border-[#E5E5E5] hover:border-[#AAAAAA] transition-all group">
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#111111]">{tool.name}</span>
                  {tool.recommended && (
                    <span className="text-[9px] font-semibold text-[#2563EB] border border-[#2563EB]/30 px-1.5 py-0.5 bg-[#EFF6FF]">
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

      {active.length === 0 && available.length === 0 && (
        <div className="text-center py-12 text-sm text-[#888888]">Nenhuma ferramenta disponível.</div>
      )}
    </div>
  );
}
