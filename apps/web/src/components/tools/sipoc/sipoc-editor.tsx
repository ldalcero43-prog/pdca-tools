'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SipocItem {
  id: string;
  text: string;
}

interface SipocData {
  processName: string;
  processScope: string;
  suppliers: SipocItem[];
  inputs: SipocItem[];
  process: SipocItem[];
  outputs: SipocItem[];
  customers: SipocItem[];
}

const COLUMNS = [
  {
    key: 'suppliers',
    label: 'Fornecedores',
    sublabel: 'Suppliers',
    letter: 'S',
    description: 'Quem fornece as entradas?',
    color: '#2563EB',
  },
  {
    key: 'inputs',
    label: 'Entradas',
    sublabel: 'Inputs',
    letter: 'I',
    description: 'O que entra no processo?',
    color: '#7C3AED',
  },
  {
    key: 'process',
    label: 'Processo',
    sublabel: 'Process',
    letter: 'P',
    description: 'Principais etapas (macro)',
    color: '#111111',
  },
  {
    key: 'outputs',
    label: 'Saídas',
    sublabel: 'Outputs',
    letter: 'O',
    description: 'O que o processo gera?',
    color: '#D97706',
  },
  {
    key: 'customers',
    label: 'Clientes',
    sublabel: 'Customers',
    letter: 'C',
    description: 'Quem recebe as saídas?',
    color: '#16A34A',
  },
];

const META = {
  name: 'SIPOC',
  description: 'O SIPOC é um mapa de alto nível do processo que identifica Fornecedores, Entradas, o Processo principal, Saídas e Clientes. É fundamental para definir o escopo e os limites do projeto antes de aprofundar a análise.',
  objective: 'Mapear o processo de ponta a ponta e definir o escopo do projeto',
  whenToUse: [
    'No início do projeto para estabelecer limites e escopo claros',
    'Para alinhar a equipe sobre o que está dentro e fora do projeto',
    'Quando diferentes áreas têm visões diferentes sobre o processo',
    'Como base para identificar onde coletar dados e medir',
  ],
  whenToAvoid: [
    'Para mapeamento detalhado de processo — use fluxograma ou VSM',
    'Quando o processo já está bem documentado e todos estão alinhados',
    'Para análise de causas — o SIPOC é descritivo, não analítico',
  ],
  difficulty: 'intermediate' as const,
  estimatedDuration: '1–2 horas',
  stepByStep: [
    { title: 'Defina o processo', description: 'Escolha um nome claro para o processo e defina seu início e fim (escopo).' },
    { title: 'Mapeie as etapas do Processo', description: 'Liste 5–7 macro-etapas do processo. Não detalhe — use verbos no infinitivo (Receber, Processar, Entregar).' },
    { title: 'Identifique as Saídas', description: 'O que o processo produz? Pode ser um produto, serviço, relatório, decisão.' },
    { title: 'Identifique os Clientes', description: 'Quem recebe e usa as saídas? Podem ser internos ou externos.' },
    { title: 'Identifique as Entradas', description: 'O que é necessário para executar o processo? Informações, materiais, dados, aprovações.' },
    { title: 'Identifique os Fornecedores', description: 'Quem fornece as entradas? Relacione cada fornecedor com sua entrada.' },
  ],
  commonErrors: [
    'Detalhar demais as etapas do processo — o SIPOC é macro (5–7 etapas)',
    'Confundir Entradas com Saídas — a entrada alimenta o processo, a saída é resultado dele',
    'Esquecer de incluir clientes internos (próxima área do fluxo)',
    'Usar o SIPOC para análise de causa — ele mapeia, não analisa',
  ],
  bestPractices: [
    'Preencha de P → O → C → I → S (processo primeiro, depois derivar o restante)',
    'Inclua medidas para cada saída — o que define que a saída é "boa"?',
    'Liste clientes em ordem de impacto — quem é mais crítico?',
    'Valide com representantes de cada área mencionada',
  ],
  exampleContext: 'Processo: Atendimento de Pedidos. S: ERP, Vendas, Fornecedor X. I: Pedido do cliente, estoque disponível, guia de romaneio. P: Receber pedido → Conferir estoque → Separar produtos → Embalar → Expedir → Confirmar entrega. O: Pedido entregue, NF emitida, confirmação de entrega. C: Cliente final, Financeiro (NF), Logística.',
};

function generateId() { return Math.random().toString(36).slice(2, 9); }

const DEFAULT_DATA: SipocData = {
  processName: '',
  processScope: '',
  suppliers: [],
  inputs: [],
  process: [],
  outputs: [],
  customers: [],
};

interface Props {
  projectId: string;
  toolData: SipocData | null;
  onDataChange: (data: SipocData) => void;
}

export function SipocEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<SipocData>(() => toolData || DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const update = useCallback((patch: Partial<SipocData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  const addItem = (column: string) => {
    const current = (data[column as keyof SipocData] as SipocItem[]);
    update({ [column]: [...current, { id: generateId(), text: '' }] });
  };

  const updateItem = (column: string, id: string, text: string) => {
    const items = (data[column as keyof SipocData] as SipocItem[]).map((item) =>
      item.id === id ? { ...item, text } : item,
    );
    update({ [column]: items });
  };

  const removeItem = (column: string, id: string) => {
    const items = (data[column as keyof SipocData] as SipocItem[]).filter((item) => item.id !== id);
    update({ [column]: items });
  };

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/SIPOC`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Process info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
              Nome do Processo
            </label>
            <input
              value={data.processName}
              onChange={(e) => update({ processName: e.target.value })}
              placeholder="Ex: Atendimento de Pedidos..."
              className="w-full px-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
              Escopo (início → fim)
            </label>
            <input
              value={data.processScope}
              onChange={(e) => update({ processScope: e.target.value })}
              placeholder="De: recebimento do pedido → Até: confirmação de entrega"
              className="w-full px-3 py-2 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>
        </div>

        {/* SIPOC columns */}
        <div className="grid grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const items = data[col.key as keyof SipocData] as SipocItem[];
            return (
              <div key={col.key} className="flex flex-col">
                {/* Header */}
                <div
                  className="flex flex-col items-center justify-center py-3 px-2 mb-2 border-b-2"
                  style={{ borderColor: col.color }}
                >
                  <span
                    className="text-2xl font-black leading-none mb-1"
                    style={{ color: col.color }}
                  >
                    {col.letter}
                  </span>
                  <span className="text-[11px] font-semibold text-[#111111]">{col.label}</span>
                  <span className="text-[10px] text-[#888888] text-center mt-0.5">{col.description}</span>
                </div>

                {/* Items */}
                <div className="flex-1 space-y-2 bg-white border border-[#E5E5E5] p-3 min-h-[200px]">
                  {items.map((item, index) => (
                    <div key={item.id} className="group relative">
                      <div className="flex items-start gap-1">
                        <span
                          className="text-[10px] font-semibold shrink-0 mt-1"
                          style={{ color: col.color }}
                        >
                          {index + 1}.
                        </span>
                        <textarea
                          value={item.text}
                          onChange={(e) => updateItem(col.key, item.id, e.target.value)}
                          placeholder="..."
                          rows={2}
                          className="flex-1 text-[12px] text-[#111111] placeholder-[#CCCCCC] bg-transparent focus:outline-none resize-none border-b border-[#F0F0F0] focus:border-[#AAAAAA] transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => removeItem(col.key, item.id)}
                        className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-white border border-[#E5E5E5] rounded-sm"
                      >
                        <Trash2 size={9} className="text-[#DC2626]" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(col.key)}
                    className="w-full text-[11px] text-[#AAAAAA] hover:text-[#555555] transition-colors flex items-center justify-center gap-1 py-1 border border-dashed border-[#E5E5E5] hover:border-[#AAAAAA]"
                  >
                    <Plus size={10} />
                    Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}
