'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cause {
  id: string;
  text: string;
}

interface IshikawaData {
  problem: string;
  categories: Record<string, Cause[]>;
}

const CATEGORIES_6M = [
  { key: 'method', label: 'Método', color: '#2563EB', description: 'Processos, procedimentos, normas' },
  { key: 'machine', label: 'Máquina', color: '#7C3AED', description: 'Equipamentos, ferramentas, tecnologia' },
  { key: 'material', label: 'Material', color: '#D97706', description: 'Matérias-primas, insumos, componentes' },
  { key: 'manpower', label: 'Mão de Obra', color: '#16A34A', description: 'Pessoas, treinamento, competências' },
  { key: 'measurement', label: 'Medição', color: '#DC2626', description: 'Indicadores, calibração, instrumentos' },
  { key: 'environment', label: 'Meio Ambiente', color: '#888888', description: 'Temperatura, iluminação, condições físicas' },
];

const META = {
  name: 'Diagrama de Ishikawa',
  description: 'O Diagrama de Causa e Efeito (ou Espinha de Peixe) organiza as possíveis causas de um problema em categorias. É especialmente útil quando existem múltiplas causas potenciais e você precisa categorizá-las antes de investigar cada uma.',
  objective: 'Identificar e categorizar todas as possíveis causas de um problema',
  whenToUse: [
    'Problemas com múltiplas causas potenciais de diferentes naturezas',
    'Sessões de brainstorming com a equipe',
    'Quando você precisa visualizar e comunicar a complexidade de um problema',
    'Após o 5 Porquês apontar múltiplas raízes a investigar',
  ],
  whenToAvoid: [
    'Problemas simples com causa raiz óbvia (use 5 Porquês)',
    'Quando você não tem dados suficientes para validar as causas',
    'Como análise definitiva — é exploratória, não conclusiva',
  ],
  difficulty: 'intermediate' as const,
  estimatedDuration: '1–2 horas',
  stepByStep: [
    { title: 'Defina o efeito (problema)', description: 'Escreva o problema na cabeça do peixe. Seja específico e baseado em dados.' },
    { title: 'Desenhe as espinhas principais', description: 'Cada uma das 6 categorias (6M) forma uma espinha principal.' },
    { title: 'Brainstorm de causas', description: 'Para cada categoria, liste todas as possíveis causas — sem filtrar ou julgar neste momento.' },
    { title: 'Aprofunde as causas', description: 'Para causas mais complexas, pode-se criar sub-causas (espinhas menores).' },
    { title: 'Priorize', description: 'Após o brainstorm, identifique as causas com maior probabilidade. Use dados ou voting da equipe.' },
    { title: 'Valide com dados', description: 'As causas mais prováveis devem ser confirmadas com coleta de dados antes de agir.' },
  ],
  commonErrors: [
    'Listar soluções como causas (ex: "falta de treinamento" é uma causa, não "precisamos de treinamento")',
    'Ignorar categorias com menos causas — às vezes a causa raiz está nas menos óbvias',
    'Parar no brainstorm sem coletar dados para validar as hipóteses',
    'Ter apenas 1–2 causas por categoria — o diagrama deve ser exaustivo',
  ],
  bestPractices: [
    'Envolva pessoas de diferentes funções para cobrir todas as perspectivas',
    'Use post-its (virtuais ou físicos) para capturar causas rapidamente antes de organizar',
    'Após preencher, vote nas causas mais prováveis (3 votos por pessoa)',
    'As causas selecionadas devem virar hipóteses a ser testadas com dados',
  ],
  exampleContext: 'Problema: Índice de rejeição de 8% na linha de montagem. Causas por categoria — Método: procedimento de inspeção não padronizado; Máquina: prensa descalibrada; Material: variação na espessura do insumo; Mão de Obra: operador sem treinamento no novo modelo; Medição: gabarito desgastado; Meio Ambiente: variação de temperatura causa expansão dimensional.',
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_DATA: IshikawaData = {
  problem: '',
  categories: Object.fromEntries(CATEGORIES_6M.map((c) => [c.key, []])),
};

interface Props {
  projectId: string;
  toolData: IshikawaData | null;
  onDataChange: (data: IshikawaData) => void;
}

export function IshikawaEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<IshikawaData>(() => toolData || DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const update = useCallback((patch: Partial<IshikawaData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  const addCause = (categoryKey: string) => {
    const causes = [...(data.categories[categoryKey] || []), { id: generateId(), text: '' }];
    update({ categories: { ...data.categories, [categoryKey]: causes } });
    setActiveCategory(categoryKey);
  };

  const updateCause = (categoryKey: string, id: string, text: string) => {
    const causes = (data.categories[categoryKey] || []).map((c) => c.id === id ? { ...c, text } : c);
    update({ categories: { ...data.categories, [categoryKey]: causes } });
  };

  const removeCause = (categoryKey: string, id: string) => {
    const causes = (data.categories[categoryKey] || []).filter((c) => c.id !== id);
    update({ categories: { ...data.categories, [categoryKey]: causes } });
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/ISHIKAWA`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const totalCauses = Object.values(data.categories).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Problem */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
            Efeito / Problema (cabeça do peixe)
          </label>
          <input
            value={data.problem}
            onChange={(e) => update({ problem: e.target.value })}
            placeholder="Qual é o problema a ser analisado?"
            className="w-full px-3 py-2.5 border border-[#111111] bg-white text-sm font-medium text-[#111111] placeholder-[#AAAAAA] focus:outline-none transition-colors"
          />
        </div>

        {/* Fish skeleton summary */}
        {data.problem && (
          <div className="text-[11px] text-[#888888]">
            {totalCauses === 0
              ? 'Adicione causas nas categorias abaixo'
              : `${totalCauses} causa${totalCauses !== 1 ? 's' : ''} identificada${totalCauses !== 1 ? 's' : ''} em ${Object.values(data.categories).filter(arr => arr.length > 0).length} categorias`}
          </div>
        )}

        {/* Categories grid */}
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES_6M.map((cat) => {
            const causes = data.categories[cat.key] || [];
            const isActive = activeCategory === cat.key;

            return (
              <div
                key={cat.key}
                className={cn(
                  'border bg-white p-4 transition-all',
                  isActive ? 'border-[#111111]' : 'border-[#E5E5E5]',
                )}
              >
                {/* Category header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <span className="text-xs font-semibold text-[#111111]">{cat.label}</span>
                    <span className="text-[10px] text-[#AAAAAA]">{causes.length > 0 ? `${causes.length}` : ''}</span>
                  </div>
                  <button
                    onClick={() => addCause(cat.key)}
                    className="p-1 hover:bg-[#F4F4F4] rounded-sm transition-colors"
                  >
                    <Plus size={12} className="text-[#888888]" />
                  </button>
                </div>

                <p className="text-[10px] text-[#AAAAAA] mb-3">{cat.description}</p>

                {/* Cause list */}
                <div className="space-y-1.5">
                  {causes.map((cause) => (
                    <div key={cause.id} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[#AAAAAA] shrink-0" />
                      <input
                        value={cause.text}
                        onChange={(e) => updateCause(cat.key, cause.id, e.target.value)}
                        onFocus={() => setActiveCategory(cat.key)}
                        placeholder="Descreva a causa..."
                        className="flex-1 text-[12px] text-[#111111] placeholder-[#CCCCCC] bg-transparent border-b border-[#E5E5E5] focus:border-[#111111] focus:outline-none py-0.5 transition-colors"
                      />
                      <button
                        onClick={() => removeCause(cat.key, cause.id)}
                        className="p-0.5 text-[#CCCCCC] hover:text-[#DC2626] transition-colors shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                {causes.length === 0 && (
                  <button
                    onClick={() => addCause(cat.key)}
                    className="w-full text-[11px] text-[#AAAAAA] hover:text-[#555555] transition-colors py-1 border border-dashed border-[#E5E5E5] hover:border-[#AAAAAA] mt-1"
                  >
                    + Adicionar causa
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}
