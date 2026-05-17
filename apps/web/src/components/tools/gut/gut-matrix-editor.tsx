'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GutItem {
  id: string;
  problem: string;
  gravity: number;
  urgency: number;
  tendency: number;
}

interface GutData {
  items: GutItem[];
}

const META = {
  name: 'Matriz GUT',
  description: 'A Matriz GUT é uma ferramenta de priorização que avalia cada problema ou oportunidade em três dimensões: Gravidade (impacto se nada for feito), Urgência (prazo para ação) e Tendência (evolução do problema sem intervenção).',
  objective: 'Priorizar problemas ou ações com base em critérios objetivos',
  whenToUse: [
    'Quando há múltiplos problemas e você precisa decidir onde atuar primeiro',
    'Para alinhar a equipe sobre prioridades de forma estruturada',
    'No início do projeto para confirmar a escolha do problema a atacar',
    'Revisão periódica de backlog de melhorias',
  ],
  whenToAvoid: [
    'Quando há apenas um problema — use os recursos diretamente',
    'Para priorização de tarefas de execução (use Kanban ou matriz urgência × importância)',
    'Quando os problemas não são comparáveis entre si',
  ],
  difficulty: 'beginner' as const,
  estimatedDuration: '30–45 min',
  stepByStep: [
    { title: 'Liste os problemas', description: 'Registre todos os problemas ou oportunidades a serem priorizados. Seja específico.' },
    { title: 'Avalie a Gravidade', description: '1=sem gravidade, 2=pouco grave, 3=grave, 4=muito grave, 5=extremamente grave. Considere impacto financeiro, segurança, qualidade.' },
    { title: 'Avalie a Urgência', description: '1=pode esperar, 2=pouco urgente, 3=urgente (ação em semanas), 4=muito urgente (dias), 5=ação imediata.' },
    { title: 'Avalie a Tendência', description: '1=vai melhorar, 2=vai manter, 3=piora levemente, 4=piora rapidamente, 5=piora muito rápido.' },
    { title: 'Calcule e priorize', description: 'GUT = G × U × T. O maior score é o primeiro a ser atacado.' },
  ],
  commonErrors: [
    'Não envolver a equipe operacional na avaliação — as notas devem refletir a realidade',
    'Dar notas com base em preferências pessoais, não em dados',
    'Tratar o resultado como absoluto — use como guia, não como lei',
    'Esquecer de revisar a matriz periodicamente conforme o contexto muda',
  ],
  bestPractices: [
    'Faça a avaliação em grupo e discuta divergências grandes (>2 pontos de diferença)',
    'Use definições claras do que cada nota significa antes de começar',
    'Para G×U×T empatados, use critério de desempate explícito (ex: maior G vence)',
    'Registre o contexto da avaliação para revisões futuras',
  ],
  exampleContext: 'Problemas: (A) Índice de rejeição 8% — G:5 U:4 T:4 = GUT 80. (B) Tempo de setup 45min — G:3 U:3 T:3 = GUT 27. (C) Lead time 7 dias — G:4 U:3 T:4 = GUT 48. Prioridade: A → C → B.',
};

const GUT_DESCRIPTIONS: Record<string, string[]> = {
  gravity: ['Sem gravidade', 'Pouco grave', 'Grave', 'Muito grave', 'Extremamente grave'],
  urgency: ['Pode esperar', 'Pouco urgente', 'Urgente', 'Muito urgente', 'Imediato'],
  tendency: ['Vai melhorar', 'Vai manter', 'Piora levemente', 'Piora rapidamente', 'Piora muito rápido'],
};

function generateId() { return Math.random().toString(36).slice(2, 9); }

function ScoreSelect({ value, onChange, field }: { value: number; onChange: (v: number) => void; field: string }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          title={GUT_DESCRIPTIONS[field][n - 1]}
          className={cn(
            'w-7 h-7 text-xs font-semibold border transition-colors',
            value === n
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white text-[#555555] border-[#E5E5E5] hover:border-[#111111]',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function gutScore(item: GutItem) {
  return item.gravity * item.urgency * item.tendency;
}

function gutColor(score: number) {
  if (score >= 75) return 'text-[#DC2626] font-semibold';
  if (score >= 27) return 'text-[#D97706] font-semibold';
  return 'text-[#888888]';
}

interface Props {
  projectId: string;
  toolData: GutData | null;
  onDataChange: (data: GutData) => void;
}

export function GutMatrixEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<GutData>(() => toolData || { items: [] });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const update = useCallback((patch: Partial<GutData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  const addItem = () => {
    update({ items: [...data.items, { id: generateId(), problem: '', gravity: 3, urgency: 3, tendency: 3 }] });
  };

  const updateItem = (id: string, patch: Partial<GutItem>) => {
    update({ items: data.items.map((item) => item.id === id ? { ...item, ...patch } : item) });
  };

  const removeItem = (id: string) => {
    update({ items: data.items.filter((item) => item.id !== id) });
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/GUT_MATRIX`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const sortedItems = [...data.items].sort((a, b) => gutScore(b) - gutScore(a));

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="max-w-4xl mx-auto">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-5 text-[11px] text-[#888888]">
          <span><span className="text-[#DC2626] font-semibold">≥75</span> Crítico</span>
          <span><span className="text-[#D97706] font-semibold">27–74</span> Alto</span>
          <span><span className="font-semibold">1–26</span> Baixo</span>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E5E5] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#888888] w-8">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#888888]">Problema / Oportunidade</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#888888]">Gravidade</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#888888]">Urgência</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#888888]">Tendência</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#888888] w-20">GUT</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, index) => {
                const score = gutScore(item);
                return (
                  <tr key={item.id} className="border-b border-[#E5E5E5] last:border-0">
                    <td className="px-4 py-3 text-[11px] text-[#AAAAAA] font-mono">{index + 1}º</td>
                    <td className="px-4 py-3">
                      <input
                        value={item.problem}
                        onChange={(e) => updateItem(item.id, { problem: e.target.value })}
                        placeholder="Descreva o problema ou oportunidade..."
                        className="w-full text-sm text-[#111111] placeholder-[#AAAAAA] bg-transparent focus:outline-none border-b border-transparent focus:border-[#E5E5E5] transition-colors py-0.5"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ScoreSelect value={item.gravity} onChange={(v) => updateItem(item.id, { gravity: v })} field="gravity" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ScoreSelect value={item.urgency} onChange={(v) => updateItem(item.id, { urgency: v })} field="urgency" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ScoreSelect value={item.tendency} onChange={(v) => updateItem(item.id, { tendency: v })} field="tendency" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-base', gutColor(score))}>{score}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-[#AAAAAA] hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={addItem}
          className="mt-3 flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors"
        >
          <Plus size={12} />
          Adicionar problema
        </button>
      </div>
    </ToolShell>
  );
}
