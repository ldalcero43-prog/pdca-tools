'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ToolShell } from '@/components/tools/tool-shell';
import { cn } from '@/lib/utils';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface FmeaRow {
  id: string;
  process: string;
  failureMode: string;
  failureEffect: string;
  severity: number;
  failureCause: string;
  occurrence: number;
  currentControls: string;
  detection: number;
  rpn: number;
  recommendedAction: string;
  responsible: string;
  targetDate: string;
  status: 'open' | 'in_progress' | 'closed';
}

interface FmeaData {
  scope: string;
  rows: FmeaRow[];
}

const META = {
  name: 'FMEA',
  description: 'Análise de Modos de Falha e Efeitos (FMEA) identifica proativamente como um processo pode falhar, avalia o risco de cada falha e prioriza ações corretivas antes que o problema ocorra.',
  objective: 'Identificar, priorizar e mitigar modos de falha em processos ou produtos antes que causem impacto ao cliente',
  whenToUse: [
    'Antes de lançar um novo produto ou processo (FMEA preventivo)',
    'Ao analisar causas de falhas recorrentes',
    'Quando o processo tiver alto impacto em segurança ou qualidade',
    'Na fase DO do PDCA para planejar ações de mitigação de risco',
  ],
  whenToAvoid: [
    'Problemas simples com causa raiz única (use 5 Porquês)',
    'Quando não há dados suficientes sobre a frequência das falhas',
  ],
  difficulty: 'advanced' as const,
  estimatedDuration: '3–8 horas',
  stepByStep: [
    { title: 'Defina o escopo', description: 'Delimite o processo ou produto a ser analisado. Seja específico: etapa, função ou componente.' },
    { title: 'Liste os modos de falha', description: 'Para cada função do processo, identifique como ela pode deixar de cumprir seu propósito.' },
    { title: 'Avalie Severidade (S)', description: 'Impacto da falha no cliente: 1 (sem efeito) a 10 (segurança/regulatório).' },
    { title: 'Avalie Ocorrência (O)', description: 'Probabilidade de a causa ocorrer: 1 (improvável) a 10 (quase certo).' },
    { title: 'Avalie Detecção (D)', description: 'Capacidade de detectar a falha antes do cliente: 1 (sempre detectado) a 10 (impossível detectar).' },
    { title: 'Calcule o RPN', description: 'RPN = S × O × D. Priorize falhas com RPN ≥ 100. Não existe limite "aceitável" universal — use o contexto.' },
    { title: 'Defina ações', description: 'Para cada RPN crítico, defina ação (preferencialmente reduzir S, depois O, depois D), responsável e prazo.' },
  ],
  commonErrors: [
    'Avaliar S, O e D com base em opinião sem dados — use histórico de falhas',
    'Focar apenas no RPN e ignorar S alto (severidade ≥ 8 exige ação independente do RPN)',
    'Não reavaliação o RPN após implementar as ações',
    'Listar modos de falha genéricos como "o processo falha" em vez de ser específico',
  ],
  bestPractices: [
    'Severidade ≥ 9 sempre exige ação, independentemente do RPN total',
    'Após implementar ações, recalcule o RPN para validar a redução de risco',
    'Envolva quem opera o processo: eles conhecem as falhas reais',
    'FMEA é um documento vivo — atualize sempre que o processo mudar',
  ],
  exampleContext: 'Exemplo: Processo de emissão de NF. Modo de falha: NF emitida com dados errados. Efeito: Entrega bloqueada pela transportadora. S=8. Causa: Cadastro de cliente desatualizado no ERP. O=5. Controle atual: Revisão manual pelo supervisor. D=4. RPN=160 → Ação: Bloqueio sistêmico de pedido se cadastro sem validação há >90 dias.',
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function rpnColor(rpn: number): { bg: string; text: string; label: string } {
  if (rpn >= 200) return { bg: '#FEF2F2', text: '#DC2626', label: 'Crítico' };
  if (rpn >= 100) return { bg: '#FFFBEB', text: '#D97706', label: 'Alto' };
  if (rpn >= 40)  return { bg: '#FEFCE8', text: '#CA8A04', label: 'Médio' };
  return { bg: '#F0FDF4', text: '#16A34A', label: 'Baixo' };
}

function ScoreButton({ value, onChange, max = 10 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-0.5 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={cn(
            'w-5 h-5 text-[9px] font-semibold rounded-sm transition-colors',
            value === n ? 'bg-[#111111] text-white' : 'bg-[#F0F0F0] text-[#555555] hover:bg-[#E5E5E5]',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function emptyRow(): FmeaRow {
  return {
    id: uid(),
    process: '', failureMode: '', failureEffect: '',
    severity: 5, failureCause: '', occurrence: 3,
    currentControls: '', detection: 5,
    rpn: 75,
    recommendedAction: '', responsible: '', targetDate: '', status: 'open',
  };
}

interface Props {
  projectId: string;
  toolData: FmeaData | null;
  onDataChange: (data: FmeaData) => void;
}

export function FmeaEditor({ projectId, toolData, onDataChange }: Props) {
  const [data, setData] = useState<FmeaData>(() => toolData || { scope: '', rows: [emptyRow()] });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const update = useCallback((patch: Partial<FmeaData>) => {
    setData((d) => {
      const next = { ...d, ...patch };
      onDataChange(next);
      return next;
    });
  }, [onDataChange]);

  function updateRow(id: string, patch: Partial<FmeaRow>) {
    const rows = data.rows.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, ...patch };
      updated.rpn = updated.severity * updated.occurrence * updated.detection;
      return updated;
    });
    update({ rows });
  }

  function addRow() {
    const row = emptyRow();
    update({ rows: [...data.rows, row] });
    setExpandedRow(row.id);
  }

  function removeRow(id: string) {
    update({ rows: data.rows.filter((r) => r.id !== id) });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/FMEA`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const sortedRows = [...data.rows].sort((a, b) => b.rpn - a.rpn);

  return (
    <ToolShell meta={META} saving={saving} lastSaved={lastSaved} onSave={handleSave}>
      <div className="space-y-4 min-w-0">
        {/* Scope */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1.5">
            Escopo do FMEA
          </label>
          <input
            value={data.scope}
            onChange={(e) => update({ scope: e.target.value })}
            placeholder="Ex: Processo de emissão de NF — planta Guarulhos"
            className="w-full px-3 py-2 border border-[#E5E5E5] text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        {/* Summary stats */}
        {data.rows.length > 0 && (
          <div className="flex items-center gap-4 py-2 text-[11px]">
            {[{ label: 'Crítico (≥200)', color: '#DC2626', count: data.rows.filter(r => r.rpn >= 200).length },
              { label: 'Alto (100–199)', color: '#D97706', count: data.rows.filter(r => r.rpn >= 100 && r.rpn < 200).length },
              { label: 'Médio (40–99)', color: '#CA8A04', count: data.rows.filter(r => r.rpn >= 40 && r.rpn < 100).length },
              { label: 'Baixo (<40)', color: '#16A34A', count: data.rows.filter(r => r.rpn < 40).length },
            ].map(({ label, color, count }) => count > 0 && (
              <span key={label} style={{ color }} className="font-medium">{count} {label}</span>
            ))}
          </div>
        )}

        {/* FMEA rows */}
        <div className="space-y-2">
          {sortedRows.map((row) => {
            const risk = rpnColor(row.rpn);
            const isExpanded = expandedRow === row.id;
            return (
              <div key={row.id} className="border border-[#E5E5E5] bg-white">
                {/* Row header (always visible) */}
                <button
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors"
                  onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                >
                  <span
                    className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-sm min-w-[52px] text-center"
                    style={{ background: risk.bg, color: risk.text }}
                  >
                    RPN {row.rpn}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#111111] truncate">
                        {row.process || <span className="text-[#AAAAAA]">Processo não definido</span>}
                      </span>
                      {row.failureMode && (
                        <span className="text-[11px] text-[#888888] truncate">→ {row.failureMode}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#888888]">
                      <span>S={row.severity}</span>
                      <span>O={row.occurrence}</span>
                      <span>D={row.detection}</span>
                      {row.status === 'closed' && <span className="text-[#16A34A] font-medium">✓ Fechado</span>}
                      {row.status === 'in_progress' && <span className="text-[#D97706] font-medium">Em andamento</span>}
                    </div>
                  </div>
                  {row.rpn >= 200 && <AlertTriangle size={13} className="text-[#DC2626] shrink-0" />}
                  <span className="text-[#AAAAAA] text-xs shrink-0">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#E5E5E5] p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Função / Processo</label>
                        <input
                          value={row.process}
                          onChange={(e) => updateRow(row.id, { process: e.target.value })}
                          placeholder="Ex: Emissão de Nota Fiscal"
                          className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Modo de Falha</label>
                        <input
                          value={row.failureMode}
                          onChange={(e) => updateRow(row.id, { failureMode: e.target.value })}
                          placeholder="Como a função pode falhar?"
                          className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Efeito da Falha (para o cliente/processo seguinte)</label>
                      <input
                        value={row.failureEffect}
                        onChange={(e) => updateRow(row.id, { failureEffect: e.target.value })}
                        placeholder="Qual o impacto se a falha ocorrer?"
                        className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-3 bg-[#FAFAFA] border border-[#F0F0F0]">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
                          Severidade (S) = {row.severity}
                        </label>
                        <p className="text-[10px] text-[#AAAAAA] mb-1.5">Impacto no cliente (1=mínimo, 10=segurança)</p>
                        <ScoreButton value={row.severity} onChange={(v) => updateRow(row.id, { severity: v })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
                          Ocorrência (O) = {row.occurrence}
                        </label>
                        <p className="text-[10px] text-[#AAAAAA] mb-1.5">Frequência da causa (1=rara, 10=frequente)</p>
                        <ScoreButton value={row.occurrence} onChange={(v) => updateRow(row.id, { occurrence: v })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
                          Detecção (D) = {row.detection}
                        </label>
                        <p className="text-[10px] text-[#AAAAAA] mb-1.5">Dificuldade de detectar (1=fácil, 10=impossível)</p>
                        <ScoreButton value={row.detection} onChange={(v) => updateRow(row.id, { detection: v })} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Causa da Falha</label>
                      <input
                        value={row.failureCause}
                        onChange={(e) => updateRow(row.id, { failureCause: e.target.value })}
                        placeholder="Por que o modo de falha pode ocorrer?"
                        className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Controles Atuais</label>
                      <input
                        value={row.currentControls}
                        onChange={(e) => updateRow(row.id, { currentControls: e.target.value })}
                        placeholder="O que existe hoje para prevenir ou detectar a falha?"
                        className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>

                    <div className="border-t border-[#E5E5E5] pt-3">
                      <div
                        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-sm"
                        style={{ background: risk.bg, border: `1px solid ${risk.bg}` }}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: risk.text }}>
                          RPN = {row.rpn} — Risco {risk.label}
                        </span>
                        {row.severity >= 9 && (
                          <span className="text-[10px] font-medium text-[#DC2626] ml-auto">
                            ⚠ S≥9: ação obrigatória
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Ação Recomendada</label>
                          <input
                            value={row.recommendedAction}
                            onChange={(e) => updateRow(row.id, { recommendedAction: e.target.value })}
                            placeholder="O que fazer para reduzir S, O ou D?"
                            className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Responsável</label>
                          <input
                            value={row.responsible}
                            onChange={(e) => updateRow(row.id, { responsible: e.target.value })}
                            placeholder="Nome"
                            className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Prazo</label>
                          <input
                            type="date"
                            value={row.targetDate}
                            onChange={(e) => updateRow(row.id, { targetDate: e.target.value })}
                            className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Status</label>
                          <select
                            value={row.status}
                            onChange={(e) => updateRow(row.id, { status: e.target.value as FmeaRow['status'] })}
                            className="w-full px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                          >
                            <option value="open">Aberto</option>
                            <option value="in_progress">Em andamento</option>
                            <option value="closed">Fechado</option>
                          </select>
                        </div>
                        <div className="flex items-end pb-0.5">
                          <button
                            onClick={() => removeRow(row.id)}
                            className="px-3 py-1.5 text-[#DC2626] border border-[#FECACA] text-xs hover:bg-[#FEF2F2] transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={11} />
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-[#AAAAAA] text-xs text-[#555555] hover:border-[#111111] hover:text-[#111111] transition-colors w-full justify-center"
        >
          <Plus size={12} />
          Adicionar modo de falha
        </button>
      </div>
    </ToolShell>
  );
}
