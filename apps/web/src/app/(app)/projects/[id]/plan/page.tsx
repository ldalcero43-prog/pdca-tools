'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { ToolSelector, ToolCardInfo } from '@/components/tools/tool-selector';
import { FiveWhysEditor } from '@/components/tools/five-whys/five-whys-editor';
import { IshikawaEditor } from '@/components/tools/ishikawa/ishikawa-editor';
import { GutMatrixEditor } from '@/components/tools/gut/gut-matrix-editor';
import { SwotEditor } from '@/components/tools/swot/swot-editor';
import { SipocEditor } from '@/components/tools/sipoc/sipoc-editor';
import { FiveW2HEditor } from '@/components/tools/five-w2h/five-w2h-editor';
import { ArrowLeft } from 'lucide-react';

const PLAN_TOOLS: ToolCardInfo[] = [
  {
    type: 'FIVE_WHYS',
    name: '5 Porquês',
    description: 'Técnica de análise de causa raiz que questiona "por quê" repetidamente para identificar a causa fundamental de um problema.',
    difficulty: 'beginner',
    estimatedDuration: '30–60 min',
    status: 'not_started',
  },
  {
    type: 'ISHIKAWA',
    name: 'Diagrama de Ishikawa',
    description: 'Diagrama de espinha de peixe para categorizar causas potenciais de um problema em 6 categorias (6M).',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
    status: 'not_started',
  },
  {
    type: 'GUT_MATRIX',
    name: 'Matriz GUT',
    description: 'Prioriza problemas ou ações com base em Gravidade, Urgência e Tendência. Ideal para triagem inicial.',
    difficulty: 'beginner',
    estimatedDuration: '30–45 min',
    status: 'not_started',
  },
  {
    type: 'SWOT',
    name: 'Análise SWOT',
    description: 'Mapeia Forças, Fraquezas, Oportunidades e Ameaças para entender o contexto estratégico do problema.',
    difficulty: 'beginner',
    estimatedDuration: '45–90 min',
    status: 'not_started',
  },
  {
    type: 'SIPOC',
    name: 'SIPOC',
    description: 'Mapeamento de alto nível do processo: Fornecedor, Entrada, Processo, Saída, Cliente. Define o escopo do projeto.',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
    status: 'not_started',
  },
  {
    type: 'FIVE_W2H',
    name: '5W2H',
    description: 'Plano de ação estruturado respondendo: O quê, Por quê, Onde, Quando, Quem, Como e Quanto.',
    difficulty: 'beginner',
    estimatedDuration: '1–3 horas',
    status: 'not_started',
  },
  {
    type: 'PARETO',
    name: 'Gráfico de Pareto',
    description: 'Identifica os poucos fatores vitais que causam a maioria dos problemas (regra 80/20).',
    difficulty: 'intermediate',
    estimatedDuration: '1–2 horas',
    status: 'not_started',
  },
  {
    type: 'FMEA',
    name: 'FMEA',
    description: 'Análise de Modos de Falha e Efeitos. Avalia riscos com RPN = Severidade × Ocorrência × Detecção.',
    difficulty: 'advanced',
    estimatedDuration: '3–8 horas',
    status: 'not_started',
  },
];

const TOOL_EDITORS: Record<string, React.ComponentType<{ projectId: string; toolData: any; onDataChange: (d: any) => void }>> = {
  FIVE_WHYS: FiveWhysEditor,
  ISHIKAWA: IshikawaEditor,
  GUT_MATRIX: GutMatrixEditor,
  SWOT: SwotEditor,
  SIPOC: SipocEditor,
  FIVE_W2H: FiveW2HEditor,
};

export default function PlanPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolDataMap, setToolDataMap] = useState<Record<string, any>>({});
  const [toolStatuses, setToolStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTools() {
      try {
        const res = await api.get<any[]>(`/projects/${projectId}/tools`, { phase: 'PLAN' });
        const dataMap: Record<string, any> = {};
        const statusMap: Record<string, string> = {};
        const tools = Array.isArray(res) ? res : (res as any)?.data || [];
        tools.forEach((t: any) => {
          dataMap[t.toolType] = t.data;
          statusMap[t.toolType] = t.status;
        });
        setToolDataMap(dataMap);
        setToolStatuses(statusMap);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, [projectId]);

  const toolsWithStatus: ToolCardInfo[] = PLAN_TOOLS.map((t) => ({
    ...t,
    status: toolStatuses[t.type] === 'COMPLETED'
      ? 'done'
      : toolStatuses[t.type] === 'IN_PROGRESS'
      ? 'in_progress'
      : 'not_started',
  }));

  const ToolEditor = selectedTool ? TOOL_EDITORS[selectedTool] : null;

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando ferramentas...</div>;

  if (selectedTool && ToolEditor) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-2.5 border-b border-[#E5E5E5] bg-[#FAFAFA] shrink-0">
          <button
            onClick={() => setSelectedTool(null)}
            className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft size={12} />
            Voltar às ferramentas
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

  return (
    <ToolSelector
      tools={toolsWithStatus}
      onSelect={setSelectedTool}
      title="Ferramentas — Fase PLAN"
    />
  );
}
