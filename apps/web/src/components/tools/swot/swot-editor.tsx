'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwotItem {
  id: string;
  text: string;
}

interface SwotData {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  context: string;
}

const QUADRANTS = [
  {
    key: 'strengths',
    label: 'Forças',
    sublabel: 'Strengths',
    description: 'Fatores internos positivos',
    headerClass: 'bg-[#F0FDF4] border-[#BBF7D0]',
    tagClass: 'text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]',
    dotClass: 'bg-[#16A34A]',
  },
  {
    key: 'weaknesses',
    label: 'Fraquezas',
    sublabel: 'Weaknesses',
    description: 'Fatores internos negativos',
    headerClass: 'bg-[#FEF2F2] border-[#FECACA]',
    tagClass: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
    dotClass: 'bg-[#DC2626]',
  },
  {
    key: 'opportunities',
    label: 'Oportunidades',
    sublabel: 'Opportunities',
    description: 'Fatores externos positivos',
    headerClass: 'bg-[#EFF6FF] border-[#BFDBFE]',
    tagClass: 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]',
    dotClass: 'bg-[#2563EB]',
  },
  {
    key: 'threats',
    label: 'Ameaças',
    sublabel: 'Threats',
    description: 'Fatores externos negativos',
    headerClass: 'bg-[#FFFBEB] border-[#FDE68A]',
    tagClass: 'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]',
    dotClass: 'bg-[#D97706]',
  },
];

const META = {
  name: 'Análise SWOT',
  description: 'A análise SWOT (Forças, Fraquezas, Oportunidades, Ameaças) é uma ferramenta estratégica que mapeia o contexto interno e externo de um projeto ou organização. Ajuda a identificar onde focar esforços e quais riscos mitigar.',
  objective: 'Mapear o contexto estratégico para embasar decisões de projeto',
  whenToUse: [
    'No início de projetos para entender o ambiente em que está inserido',
    'Para justificar a escolha da abordagem ou estratégia do projeto',
    'Em revisões estratégicas periódicas',
    'Para identificar riscos e mitigações proativamente',
  ],
  whenToAvoid: [
    'Para análise operacional de causas de problemas (use Ishikawa ou 5 Porquês)',
    'Quando você precisa de priorização quantitativa (use Matriz GUT)',
    'Como ferramenta de planejamento de tarefas',
  ],
  difficulty: 'beginner' as const,
  estimatedDuration: '45–90 min',
  stepByStep: [
    { title: 'Defina o contexto', description: 'Qual é o objeto da análise? Projeto, processo, produto, unidade de negócio?' },
    { title: 'Mapeie as Forças', description: 'O que o projeto/organização faz bem? Recursos únicos, vantagens competitivas, capacidades.' },
    { title: 'Identifique as Fraquezas', description: 'O que pode ser melhorado? Limitações de recursos, lacunas de competência, gargalos.' },
    { title: 'Explore as Oportunidades', description: 'Fatores externos favoráveis: tendências de mercado, mudanças regulatórias, tecnologias emergentes.' },
    { title: 'Mapeie as Ameaças', description: 'Riscos externos: concorrência, mudanças de mercado, restrições regulatórias, dependências.' },
    { title: 'Cruze os quadrantes', description: 'Forças × Oportunidades = como usar forças para capturar oportunidades. Fraquezas × Ameaças = riscos críticos.' },
  ],
  commonErrors: [
    'Misturar fatores internos com externos (Forças/Fraquezas são internas; O/A são externas)',
    'Ser genérico demais — cada item deve ser específico e acionável',
    'Não cruzar os quadrantes para gerar estratégias (a SWOT é um meio, não um fim)',
    'Fazer a análise individualmente — envolva a equipe para múltiplas perspectivas',
  ],
  bestPractices: [
    'Seja específico: "entrega em 24h melhor que concorrentes" é melhor que "boa logística"',
    'Priorize: 3–5 itens por quadrante é mais útil que 20 itens vagos',
    'Use a análise para criar estratégias SO, ST, WO, WT após preencher os quadrantes',
    'Revisite semestralmente — o contexto externo muda rapidamente',
  ],
  exampleContext: 'Projeto de redução de lead time em uma distribuidora. Força: frota própria, WMS integrado. Fraqueza: processo manual de separação, turnover alto. Oportunidade: crescimento do e-commerce local, subsídio para automação. Ameaça: novos entrantes, aumento de combustível.',
};

function generateId() { return Math.random().toString(36).slice(2, 9); }

const DEFAULT_DATA: SwotData = {
  strengths: [],
  weaknesses: [],
  opportunities: [],
  threats: [],
  context: '',
};

interface Props {
  projectId: string;
  toolData: SwotData | null;
  onDataChange: (data: SwotData) => void;
}

export function SwotEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<SwotData>(() => toolData || DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const update = useCallback((patch: Partial<SwotData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  const addItem = (quadrant: keyof SwotData) => {
    if (quadrant === 'context') return;
    const current = (data[quadrant] as SwotItem[]);
    update({ [quadrant]: [...current, { id: generateId(), text: '' }] });
  };

  const updateItem = (quadrant: keyof SwotData, id: string, text: string) => {
    if (quadrant === 'context') return;
    const items = (data[quadrant] as SwotItem[]).map((item) => item.id === id ? { ...item, text } : item);
    update({ [quadrant]: items });
  };

  const removeItem = (quadrant: keyof SwotData, id: string) => {
    if (quadrant === 'context') return;
    const items = (data[quadrant] as SwotItem[]).filter((item) => item.id !== id);
    update({ [quadrant]: items });
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/SWOT`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Context */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
            Objeto da Análise
          </label>
          <input
            value={data.context}
            onChange={(e) => update({ context: e.target.value })}
            placeholder="Ex: Processo de separação de pedidos na unidade SP..."
            className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        {/* Internal / External labels */}
        <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold uppercase tracking-widest text-[#888888] px-1">
          <span className="text-center border-b border-[#E5E5E5] pb-1">← Interno →</span>
          <span className="text-center border-b border-[#E5E5E5] pb-1">← Externo →</span>
        </div>

        {/* SWOT 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {QUADRANTS.map((q) => {
            const items = data[q.key as keyof SwotData] as SwotItem[];
            return (
              <div key={q.key} className={cn('border p-4', q.headerClass)}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-semibold uppercase tracking-widest border px-1.5 py-0.5', q.tagClass)}>
                        {q.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] mt-1">{q.description}</p>
                  </div>
                  <button
                    onClick={() => addItem(q.key as keyof SwotData)}
                    className="p-1 hover:bg-white/60 rounded-sm transition-colors"
                  >
                    <Plus size={12} className="text-[#888888]" />
                  </button>
                </div>

                <div className="space-y-2 bg-white/70 min-h-[80px] p-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-1.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', q.dotClass)} />
                      <input
                        value={item.text}
                        onChange={(e) => updateItem(q.key as keyof SwotData, item.id, e.target.value)}
                        placeholder="Descreva..."
                        className="flex-1 text-[12px] text-[#111111] placeholder-[#CCCCCC] bg-transparent border-b border-transparent focus:border-[#AAAAAA] focus:outline-none py-0.5 transition-colors"
                      />
                      <button
                        onClick={() => removeItem(q.key as keyof SwotData, item.id)}
                        className="p-0.5 text-[#CCCCCC] hover:text-[#DC2626] transition-colors shrink-0"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <button
                      onClick={() => addItem(q.key as keyof SwotData)}
                      className="w-full text-[11px] text-[#AAAAAA] hover:text-[#555555] transition-colors py-2"
                    >
                      + Adicionar item
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}
