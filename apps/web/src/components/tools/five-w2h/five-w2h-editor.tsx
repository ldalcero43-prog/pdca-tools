'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  what: string;
  why: string;
  where: string;
  when: string;
  who: string;
  how: string;
  howMuch: string;
}

interface FiveW2HData {
  objective: string;
  actions: ActionItem[];
}

const META = {
  name: '5W2H',
  description: 'O 5W2H é um plano de ação estruturado que define cada ação respondendo sete perguntas fundamentais: What (O quê), Why (Por quê), Where (Onde), When (Quando), Who (Quem), How (Como) e How Much (Quanto custa). Elimina ambiguidades e garante clareza de execução.',
  objective: 'Criar um plano de ação detalhado e sem ambiguidades',
  whenToUse: [
    'Para transformar a causa raiz identificada em ações concretas',
    'Planejamento de implementação de melhorias',
    'Quando há múltiplas ações a coordenar entre diferentes responsáveis',
    'Para comunicar o plano de forma clara a toda a equipe',
  ],
  whenToAvoid: [
    'Para projetos muito complexos com dependências — use Gantt ou cronograma formal',
    'Para análise de causas — o 5W2H é para planejamento, não diagnóstico',
    'Ações de curtíssimo prazo onde o overhead de documentação supera o benefício',
  ],
  difficulty: 'beginner' as const,
  estimatedDuration: '1–3 horas',
  stepByStep: [
    { title: 'Defina o objetivo geral', description: 'Qual é o resultado esperado do conjunto de ações? Relacione ao objetivo do projeto.' },
    { title: 'Liste as ações (O quê)', description: 'Cada linha do 5W2H é uma ação específica. Use verbos no infinitivo: Implementar, Treinar, Revisar.' },
    { title: 'Justifique cada ação (Por quê)', description: 'Por que esta ação é necessária? Conecte à causa raiz ou ao objetivo do projeto.' },
    { title: 'Defina local (Onde)', description: 'Em qual área, processo, sistema ou localidade a ação será executada?' },
    { title: 'Defina prazo (Quando)', description: 'Data de início e conclusão. Seja realista — considere dependências entre ações.' },
    { title: 'Defina responsável (Quem)', description: 'Uma pessoa é responsável por cada ação — não um departamento ou grupo.' },
    { title: 'Defina método (Como)', description: 'Como a ação será executada? Quais etapas ou recursos são necessários?' },
    { title: 'Estime o custo (Quanto)', description: 'CAPEX e OPEX necessários. Use R$ 0 se não houver custo, não deixe em branco.' },
  ],
  commonErrors: [
    'Responsável sendo um departamento — deve ser uma pessoa nominada',
    'Prazo sem data específica ("assim que possível" não é um prazo)',
    'Não atualizar o 5W2H conforme o projeto avança',
    'Ações vagas: "melhorar o processo" — seja específico: "Revisar POP-042 para incluir etapa de verificação"',
  ],
  bestPractices: [
    'Uma ação por linha — não agrupe ações diferentes na mesma linha',
    'Revise semanalmente na reunião de acompanhamento do projeto',
    'Classifique ações por status (Não iniciado / Em andamento / Concluído)',
    'Para ações dependentes, documente a dependência na coluna "Como"',
  ],
  exampleContext: 'Objetivo: Reduzir rejeições na linha B de 8% para 2% até 30/06. O quê: Recalibrar prensa P-03. Por quê: Causa raiz identificada no Ishikawa. Onde: Linha B, Prensa P-03. Quando: 15/03 a 20/03. Quem: João (Manutenção). Como: Seguir instrução técnica IT-034. Quanto: R$ 2.500 (serviço técnico).',
};

const FIELDS = [
  { key: 'what', label: 'O quê?', sublabel: 'What', placeholder: 'Descreva a ação específica...', width: 'w-40' },
  { key: 'why', label: 'Por quê?', sublabel: 'Why', placeholder: 'Justificativa...', width: 'w-32' },
  { key: 'where', label: 'Onde?', sublabel: 'Where', placeholder: 'Local / área...', width: 'w-28' },
  { key: 'when', label: 'Quando?', sublabel: 'When', placeholder: 'Prazo...', width: 'w-28' },
  { key: 'who', label: 'Quem?', sublabel: 'Who', placeholder: 'Responsável...', width: 'w-28' },
  { key: 'how', label: 'Como?', sublabel: 'How', placeholder: 'Método / etapas...', width: 'w-40' },
  { key: 'howMuch', label: 'Quanto?', sublabel: 'How Much', placeholder: 'R$ 0', width: 'w-24' },
];

function generateId() { return Math.random().toString(36).slice(2, 9); }

function newAction(): ActionItem {
  return { id: generateId(), what: '', why: '', where: '', when: '', who: '', how: '', howMuch: '' };
}

interface Props {
  projectId: string;
  toolData: FiveW2HData | null;
  onDataChange: (data: FiveW2HData) => void;
}

export function FiveW2HEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<FiveW2HData>(() => toolData || { objective: '', actions: [] });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const update = useCallback((patch: Partial<FiveW2HData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  const addAction = () => {
    update({ actions: [...data.actions, newAction()] });
  };

  const updateAction = (id: string, patch: Partial<ActionItem>) => {
    update({ actions: data.actions.map((a) => a.id === id ? { ...a, ...patch } : a) });
  };

  const removeAction = (id: string) => {
    update({ actions: data.actions.filter((a) => a.id !== id) });
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/FIVE_W2H`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="max-w-full space-y-5">
        {/* Objective */}
        <div className="max-w-2xl">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
            Objetivo do Plano de Ação
          </label>
          <input
            value={data.objective}
            onChange={(e) => update({ objective: e.target.value })}
            placeholder="Qual resultado este plano de ação deve atingir?"
            className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        {/* Action table */}
        <div className="bg-white border border-[#E5E5E5] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#888888] w-8">#</th>
                {FIELDS.map((f) => (
                  <th key={f.key} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#888888]">
                    <div>{f.label}</div>
                    <div className="text-[#AAAAAA] font-normal normal-case tracking-normal">{f.sublabel}</div>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {data.actions.map((action, index) => (
                <tr key={action.id} className="border-b border-[#E5E5E5] last:border-0 align-top">
                  <td className="px-3 py-2 text-[11px] text-[#AAAAAA] font-mono pt-3">{index + 1}</td>
                  {FIELDS.map((f) => (
                    <td key={f.key} className="px-3 py-2">
                      <textarea
                        value={action[f.key as keyof ActionItem]}
                        onChange={(e) => updateAction(action.id, { [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        rows={2}
                        className="w-full min-w-[100px] text-[12px] text-[#111111] placeholder-[#CCCCCC] bg-transparent focus:outline-none resize-none border-b border-transparent focus:border-[#AAAAAA] transition-colors py-0.5"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 pt-3">
                    <button
                      onClick={() => removeAction(action.id)}
                      className="p-1 text-[#AAAAAA] hover:text-[#DC2626] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.actions.length === 0 && (
            <div className="p-8 text-center text-sm text-[#888888]">
              Nenhuma ação adicionada. Clique em "Adicionar ação" para começar.
            </div>
          )}
        </div>

        <button
          onClick={addAction}
          className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors"
        >
          <Plus size={12} />
          Adicionar ação
        </button>
      </div>
    </ToolShell>
  );
}
