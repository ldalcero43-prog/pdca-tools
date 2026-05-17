'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

interface Why {
  id: string;
  text: string;
}

interface FiveWhysData {
  problem: string;
  whys: Why[];
  rootCause: string;
  containmentAction: string;
}

const META = {
  name: '5 Porquês',
  description: 'A técnica dos 5 Porquês é um método iterativo de análise de causa raiz. Ao questionar "por quê?" repetidamente (tipicamente 5 vezes), você aprofunda a análise além dos sintomas superficiais até encontrar a causa fundamental.',
  objective: 'Identificar a causa raiz de um problema através de questionamentos sucessivos',
  whenToUse: [
    'Problemas simples a moderados com uma cadeia causal clara',
    'Quando a equipe já tem boa compreensão do processo',
    'Análise rápida de incidentes ou defeitos pontuais',
    'Como ponto de partida antes de usar ferramentas mais complexas',
  ],
  whenToAvoid: [
    'Problemas complexos com múltiplas causas inter-relacionadas (use Ishikawa)',
    'Quando a equipe não conhece bem o processo',
    'Causas que envolvem variáveis humanas subjetivas',
  ],
  difficulty: 'beginner' as const,
  estimatedDuration: '30–60 min',
  stepByStep: [
    { title: 'Defina o problema', description: 'Escreva o problema de forma clara, específica e observável. Inclua dados: frequência, impacto, localização.' },
    { title: 'Pergunte o primeiro "Por quê?"', description: 'Identifique a causa direta e mais óbvia do problema. Evite pular para soluções.' },
    { title: 'Continue perguntando', description: 'Para cada resposta, pergunte "Por quê aquilo aconteceu?" até chegar à causa raiz (tipicamente 3–7 porquês).' },
    { title: 'Valide a cadeia causal', description: 'Leia de trás para frente: "X causou Y, que causou Z…" — se a lógica se sustenta, você chegou à causa raiz.' },
    { title: 'Defina a ação corretiva', description: 'A ação corretiva deve atacar a causa raiz, não o sintoma. Defina responsável e prazo.' },
  ],
  commonErrors: [
    'Parar nos sintomas (os 2–3 primeiros porquês geralmente ainda são sintomas)',
    'Misturar causas de diferentes naturezas em uma única cadeia',
    'Definir ações que corrigem apenas o sintoma imediato',
    'Formular o problema de forma vaga sem dados',
  ],
  bestPractices: [
    'Use dados e fatos, não opiniões — "a máquina parou 3x esta semana" em vez de "a máquina está ruim"',
    'Involve a equipe operacional: eles conhecem a causa raiz na prática',
    'Uma boa causa raiz é algo sobre o qual você pode tomar ação direta',
    'Se encontrar múltiplas causas em um único porquê, ramifique a análise',
  ],
  exampleContext: 'Problema: O pedido do cliente X foi entregue com 2 dias de atraso. Por quê? → O caminhão saiu tarde. Por quê? → O produto não estava embalado a tempo. Por quê? → Faltou material de embalagem. Por quê? → O estoque não foi reposto. Por quê? → Não há processo de reposição automática. → Causa raiz: ausência de processo de reposição de materiais de embalagem.',
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

interface Props {
  projectId: string;
  toolData: FiveWhysData | null;
  onDataChange: (data: FiveWhysData) => void;
}

export function FiveWhysEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<FiveWhysData>(() => toolData || {
    problem: '',
    whys: [{ id: generateId(), text: '' }],
    rootCause: '',
    containmentAction: '',
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const update = useCallback((patch: Partial<FiveWhysData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  const updateWhy = (id: string, text: string) => {
    update({ whys: data.whys.map((w) => w.id === id ? { ...w, text } : w) });
  };

  const addWhy = () => {
    update({ whys: [...data.whys, { id: generateId(), text: '' }] });
  };

  const removeWhy = (id: string) => {
    if (data.whys.length <= 1) return;
    update({ whys: data.whys.filter((w) => w.id !== id) });
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/FIVE_WHYS`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Problem statement */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
            Problema / Sintoma
          </label>
          <textarea
            value={data.problem}
            onChange={(e) => update({ problem: e.target.value })}
            rows={3}
            placeholder="Descreva o problema com dados: O quê, Onde, Quando, Quanto impacta..."
            className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors resize-none"
          />
        </div>

        {/* Why chain */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-3">
            Cadeia de Porquês
          </label>

          <div className="space-y-2">
            {data.whys.map((why, index) => (
              <div key={why.id} className="flex items-start gap-3">
                {/* Connector */}
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div className="w-6 h-6 rounded-full bg-[#111111] text-white text-[11px] font-semibold flex items-center justify-center">
                    {index + 1}
                  </div>
                  {index < data.whys.length - 1 && (
                    <div className="w-px h-4 bg-[#E5E5E5] mt-1" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[11px] font-medium text-[#555555]">
                      {index === 0 ? 'Por quê o problema acontece?' : `Por quê "${data.whys[index - 1].text.slice(0, 40)}${data.whys[index - 1].text.length > 40 ? '…' : ''}"?`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={why.text}
                      onChange={(e) => updateWhy(why.id, e.target.value)}
                      placeholder={`Resposta ${index + 1}...`}
                      className="flex-1 px-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
                    />
                    {data.whys.length > 1 && (
                      <button
                        onClick={() => removeWhy(why.id)}
                        className="p-2 text-[#AAAAAA] hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Arrow down + Add */}
          <div className="flex items-center gap-3 mt-2 ml-9">
            <ChevronDown size={14} className="text-[#AAAAAA]" />
            <button
              onClick={addWhy}
              className="flex items-center gap-1 text-xs text-[#555555] hover:text-[#111111] transition-colors"
            >
              <Plus size={12} />
              Adicionar "Por quê"
            </button>
          </div>
        </div>

        {/* Root cause */}
        <div className="border-t border-[#E5E5E5] pt-6">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
            Causa Raiz Identificada
          </label>
          <textarea
            value={data.rootCause}
            onChange={(e) => update({ rootCause: e.target.value })}
            rows={2}
            placeholder="Descreva a causa fundamental identificada ao final da cadeia..."
            className="w-full px-3 py-2.5 border border-[#111111] bg-[#FAFAFA] text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors resize-none font-medium"
          />
        </div>

        {/* Containment action */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
            Ação Corretiva (sobre a causa raiz)
          </label>
          <textarea
            value={data.containmentAction}
            onChange={(e) => update({ containmentAction: e.target.value })}
            rows={2}
            placeholder="Que ação ataca diretamente a causa raiz? Quem é responsável? Qual o prazo?"
            className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors resize-none"
          />
        </div>
      </div>
    </ToolShell>
  );
}
