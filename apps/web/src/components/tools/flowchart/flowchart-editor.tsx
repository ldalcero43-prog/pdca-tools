'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, ArrowDown, GitBranch } from 'lucide-react';

type NodeType = 'start' | 'end' | 'process' | 'decision' | 'document' | 'connector';

interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  yesBranch?: string;
  noBranch?: string;
}

interface FlowchartData {
  title: string;
  nodes: FlowNode[];
}

const META = {
  name: 'Fluxograma de Processo',
  description: 'O fluxograma mapeia visualmente as etapas de um processo, suas decisões, entradas e saídas. Essencial para identificar gargalos, redundâncias e oportunidades de melhoria.',
  objective: 'Visualizar o fluxo completo de um processo para identificar atividades, decisões, entradas, saídas e pontos de melhoria',
  whenToUse: [
    'No início do PDCA para mapear o estado atual (AS-IS)',
    'Para comunicar um processo para a equipe de forma visual',
    'Ao identificar gargalos, retrabalho ou etapas sem valor agregado',
    'Para documentar o processo futuro (TO-BE) após melhoria',
  ],
  whenToAvoid: [
    'Processos extremamente simples que se descrevem em 2–3 linhas',
    'Quando o objetivo é analisar causas (use Ishikawa ou 5 Porquês)',
  ],
  difficulty: 'beginner' as const,
  estimatedDuration: '1–3 horas',
  stepByStep: [
    { title: 'Defina o título e escopo', description: 'Nomeie o processo e defina os limites (início e fim claros).' },
    { title: 'Adicione o início', description: 'Todo fluxograma começa com um nó "Início" (oval).' },
    { title: 'Mapeie as etapas', description: 'Adicione cada atividade como um nó "Processo" (retângulo). Seja específico.' },
    { title: 'Adicione decisões', description: 'Use nós "Decisão" (losango) para pontos onde o fluxo se bifurca (Sim/Não).' },
    { title: 'Finalize', description: 'Adicione um nó "Fim" para cada possível encerramento do processo.' },
    { title: 'Valide com a equipe', description: 'Percorra o fluxo com quem opera o processo — eles identificarão gaps.' },
  ],
  commonErrors: [
    'Incluir muitos detalhes técnicos no fluxograma de alto nível',
    'Esquecer caminhos alternativos (o que acontece quando a decisão é "Não"?)',
    'Misturar o processo atual (AS-IS) com o desejado (TO-BE) no mesmo diagrama',
  ],
  bestPractices: [
    'Faça dois fluxogramas: AS-IS (atual) e TO-BE (futuro/melhorado)',
    'Mantenha simples — se tiver mais de 20 etapas, divida em sub-processos',
    'Use verbos no infinitivo para nomear processos: "Emitir NF", "Conferir produto"',
    'Valide o fluxo percorrendo-o de baixo para cima — ajuda a identificar lacunas',
  ],
  exampleContext: 'Exemplo AS-IS: Receber pedido → Verificar estoque (Decisão: tem estoque?) → Sim: Separar produto → Embalar → Emitir NF → Agendar coleta → Fim. Não: Acionar compras → Aguardar entrega → Voltar para Separar.',
};

const NODE_CONFIG: Record<NodeType, { label: string; shape: string; color: string; border: string; textColor: string }> = {
  start:     { label: 'Início',     shape: 'oval',      color: '#F0FDF4', border: '#16A34A', textColor: '#166534' },
  end:       { label: 'Fim',        shape: 'oval',      color: '#FEF2F2', border: '#DC2626', textColor: '#991B1B' },
  process:   { label: 'Processo',   shape: 'rect',      color: '#EFF6FF', border: '#2563EB', textColor: '#1E40AF' },
  decision:  { label: 'Decisão',    shape: 'diamond',   color: '#FFFBEB', border: '#D97706', textColor: '#92400E' },
  document:  { label: 'Documento',  shape: 'doc',       color: '#F5F3FF', border: '#7C3AED', textColor: '#4C1D95' },
  connector: { label: 'Conector',   shape: 'circle',    color: '#F9F9F9', border: '#888888', textColor: '#555555' },
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function NodeShape({ node }: { node: FlowNode }) {
  const cfg = NODE_CONFIG[node.type];

  if (node.type === 'decision') {
    return (
      <div className="flex flex-col items-center">
        <div
          className="relative flex items-center justify-center"
          style={{ width: 140, height: 70 }}
        >
          <svg viewBox="0 0 140 70" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <polygon
              points="70,2 138,35 70,68 2,35"
              fill={cfg.color}
              stroke={cfg.border}
              strokeWidth="1.5"
            />
          </svg>
          <span className="relative z-10 text-[11px] font-medium text-center px-2" style={{ color: cfg.textColor }}>
            {node.label || 'Decisão'}
          </span>
        </div>
        {(node.yesBranch || node.noBranch) && (
          <div className="flex gap-6 text-[10px] text-[#888888] mt-1">
            <span className="text-[#16A34A]">↙ Sim: {node.yesBranch || '...'}</span>
            <span className="text-[#DC2626]">↘ Não: {node.noBranch || '...'}</span>
          </div>
        )}
      </div>
    );
  }

  if (node.type === 'start' || node.type === 'end') {
    return (
      <div
        className="px-6 py-2 text-[12px] font-semibold text-center min-w-[100px]"
        style={{
          background: cfg.color,
          border: `1.5px solid ${cfg.border}`,
          borderRadius: 999,
          color: cfg.textColor,
        }}
      >
        {node.label || cfg.label}
      </div>
    );
  }

  if (node.type === 'document') {
    return (
      <div
        className="px-4 py-2 text-[11px] font-medium text-center min-w-[140px]"
        style={{
          background: cfg.color,
          border: `1.5px solid ${cfg.border}`,
          borderRadius: '4px 4px 0 0',
          borderBottom: `1.5px wavy ${cfg.border}`,
          color: cfg.textColor,
        }}
      >
        {node.label || 'Documento'}
      </div>
    );
  }

  return (
    <div
      className="px-4 py-2 text-[11px] font-medium text-center min-w-[140px]"
      style={{
        background: cfg.color,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 2,
        color: cfg.textColor,
      }}
    >
      {node.label || cfg.label}
      {node.description && (
        <div className="text-[10px] opacity-70 mt-0.5">{node.description}</div>
      )}
    </div>
  );
}

interface Props {
  projectId: string;
  toolData: FlowchartData | null;
  onDataChange: (data: FlowchartData) => void;
}

export function FlowchartEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<FlowchartData>(() => toolData || {
    title: '',
    nodes: [
      { id: uid(), type: 'start', label: 'Início' },
      { id: uid(), type: 'process', label: '' },
      { id: uid(), type: 'end', label: 'Fim' },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);

  const update = useCallback((patch: Partial<FlowchartData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  function updateNode(id: string, patch: Partial<FlowNode>) {
    update({ nodes: data.nodes.map((n) => n.id === id ? { ...n, ...patch } : n) });
  }

  function addNode(afterId: string, type: NodeType = 'process') {
    const idx = data.nodes.findIndex((n) => n.id === afterId);
    const newNode: FlowNode = { id: uid(), type, label: '' };
    const nodes = [...data.nodes];
    nodes.splice(idx + 1, 0, newNode);
    update({ nodes });
    setEditingNode(newNode.id);
  }

  function removeNode(id: string) {
    if (data.nodes.length <= 1) return;
    update({ nodes: data.nodes.filter((n) => n.id !== id) });
    if (editingNode === id) setEditingNode(null);
  }

  function moveNode(id: string, dir: -1 | 1) {
    const idx = data.nodes.findIndex((n) => n.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === data.nodes.length - 1)) return;
    const nodes = [...data.nodes];
    [nodes[idx], nodes[idx + dir]] = [nodes[idx + dir], nodes[idx]];
    update({ nodes });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/FLOWCHART`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="flex gap-6 min-w-0">
        {/* Editor panel */}
        <div className="w-80 shrink-0 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">
              Título do Fluxograma
            </label>
            <input
              value={data.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Ex: Processo de Expedição — AS-IS"
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
              Etapas ({data.nodes.length})
            </label>

            <div className="space-y-1.5">
              {data.nodes.map((node, idx) => {
                const cfg = NODE_CONFIG[node.type];
                const isEditing = editingNode === node.id;
                return (
                  <div key={node.id} className={cn('border transition-colors', isEditing ? 'border-[#111111]' : 'border-[#E5E5E5]')}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#FAFAFA]"
                      onClick={() => setEditingNode(isEditing ? null : node.id)}
                    >
                      <span className="text-[10px] font-semibold w-4 text-center text-[#AAAAAA]">{idx + 1}</span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
                        style={{ background: cfg.color, color: cfg.textColor, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                      <span className="flex-1 text-xs text-[#111111] truncate">{node.label || <span className="text-[#AAAAAA]">sem label</span>}</span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveNode(node.id, -1); }} className="p-0.5 text-[#AAAAAA] hover:text-[#555555]">
                          <ArrowUp size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveNode(node.id, 1); }} className="p-0.5 text-[#AAAAAA] hover:text-[#555555]">
                          <ArrowDown size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="p-0.5 text-[#AAAAAA] hover:text-[#DC2626]">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="px-3 pb-3 space-y-2 border-t border-[#E5E5E5]">
                        <div className="pt-2">
                          <label className="block text-[9px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Tipo</label>
                          <div className="flex flex-wrap gap-1">
                            {(Object.keys(NODE_CONFIG) as NodeType[]).map((t) => (
                              <button
                                key={t}
                                onClick={() => updateNode(node.id, { type: t })}
                                className={cn('text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors', node.type === t ? 'bg-[#111111] text-white border-[#111111]' : 'border-[#E5E5E5] text-[#555555] hover:border-[#111111]')}
                              >
                                {NODE_CONFIG[t].label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Label</label>
                          <input
                            value={node.label}
                            onChange={(e) => updateNode(node.id, { label: e.target.value })}
                            placeholder="Nome da etapa..."
                            autoFocus
                            className="w-full px-2 py-1 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                          />
                        </div>
                        {node.type === 'process' && (
                          <div>
                            <label className="block text-[9px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Detalhe (opcional)</label>
                            <input
                              value={node.description || ''}
                              onChange={(e) => updateNode(node.id, { description: e.target.value })}
                              placeholder="Responsável, ferramenta, obs..."
                              className="w-full px-2 py-1 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                            />
                          </div>
                        )}
                        {node.type === 'decision' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-semibold text-[#16A34A] mb-1">Caminho SIM</label>
                              <input
                                value={node.yesBranch || ''}
                                onChange={(e) => updateNode(node.id, { yesBranch: e.target.value })}
                                placeholder="Próxima etapa..."
                                className="w-full px-2 py-1 border border-[#BBF7D0] text-xs text-[#111111] focus:outline-none transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-semibold text-[#DC2626] mb-1">Caminho NÃO</label>
                              <input
                                value={node.noBranch || ''}
                                onChange={(e) => updateNode(node.id, { noBranch: e.target.value })}
                                placeholder="Próxima etapa..."
                                className="w-full px-2 py-1 border border-[#FECACA] text-xs text-[#111111] focus:outline-none transition-colors"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-1 flex-wrap pt-1">
                          {(['process', 'decision', 'document', 'end'] as NodeType[]).map((t) => (
                            <button
                              key={t}
                              onClick={() => addNode(node.id, t)}
                              className="text-[9px] px-2 py-0.5 border border-dashed border-[#AAAAAA] text-[#888888] hover:border-[#111111] hover:text-[#111111] transition-colors flex items-center gap-0.5"
                            >
                              <Plus size={8} />
                              {NODE_CONFIG[t].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => addNode(data.nodes[data.nodes.length - 1]?.id ?? '', 'process')}
              className="w-full mt-2 flex items-center justify-center gap-1 py-2 border border-dashed border-[#AAAAAA] text-xs text-[#888888] hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              <Plus size={11} />
              Adicionar etapa
            </button>
          </div>
        </div>

        {/* Visual preview */}
        <div className="flex-1 min-w-0 border border-[#E5E5E5] bg-[#FAFAFA] p-6 overflow-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-4">
            {data.title || 'Pré-visualização'}
          </p>
          <div className="flex flex-col items-center gap-0">
            {data.nodes.map((node, idx) => (
              <div key={node.id} className="flex flex-col items-center">
                <NodeShape node={node} />
                {idx < data.nodes.length - 1 && (
                  <div className="flex flex-col items-center my-1">
                    <div className="w-px h-4 bg-[#C0C0C0]" />
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#C0C0C0]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
