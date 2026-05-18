'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Informações Básicas' },
  { id: 2, label: 'Problema & Objetivos' },
  { id: 3, label: 'Timeline & Financeiro' },
];

const MAIN_METHODOLOGIES = [
  {
    value: 'PDCA',
    label: 'PDCA',
    subtitle: 'Plan → Do → Check → Act',
    description: 'Ciclo clássico de melhoria contínua. Ideal para projetos de eliminação de desperdícios, padronização e melhoria incremental de processos.',
    phases: ['Plan', 'Do', 'Check', 'Act'],
    phaseColors: ['text-[#2563EB]', 'text-[#D97706]', 'text-[#16A34A]', 'text-[#7C3AED]'],
  },
  {
    value: 'DMAIC',
    label: 'DMAIC',
    subtitle: 'Define → Measure → Analyze → Improve → Control',
    description: 'Metodologia Six Sigma estruturada e orientada a dados. Indicada quando há necessidade de análise estatística e controle rigoroso de variações de processo.',
    phases: ['Define', 'Measure', 'Analyze', 'Improve', 'Control'],
    phaseColors: ['text-[#2563EB]', 'text-[#7C3AED]', 'text-[#D97706]', 'text-[#16A34A]', 'text-[#111111]'],
  },
];
const OTHER_METHODOLOGIES = ['KAIZEN', 'LEAN', 'BPM'];
const PRIORITIES = [
  { value: 'CRITICAL', label: 'Crítico' },
  { value: 'HIGH', label: 'Alto' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'LOW', label: 'Baixo' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1
    name: '',
    description: '',
    methodology: 'PDCA',
    priority: 'MEDIUM',
    // Step 2
    problemStatement: '',
    goals: '',
    scope: '',
    outOfScope: '',
    // Step 3
    startDate: '',
    targetDate: '',
    estimatedSavings: '',
    capexBudget: '',
    opexBudget: '',
    financialImpact: '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        methodology: form.methodology,
        priority: form.priority,
        problemStatement: form.problemStatement || undefined,
        goals: form.goals || undefined,
        scope: form.scope || undefined,
        outOfScope: form.outOfScope || undefined,
        startDate: form.startDate || undefined,
        targetDate: form.targetDate || undefined,
      };
      if (form.estimatedSavings) payload.estimatedSavings = parseFloat(form.estimatedSavings);
      if (form.capexBudget) payload.capexBudget = parseFloat(form.capexBudget);
      if (form.opexBudget) payload.opexBudget = parseFloat(form.opexBudget);
      if (form.financialImpact) payload.financialImpact = form.financialImpact;

      const project = await api.post<{ id: string }>('/projects', payload);
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar title="Novo Projeto" subtitle="Preencha as informações do projeto" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Steps indicator */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                      step > s.id
                        ? 'bg-[#111111] text-white'
                        : step === s.id
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#F0F0F0] text-[#888888]',
                    )}
                  >
                    {step > s.id ? <Check size={11} /> : s.id}
                  </div>
                  <span className={cn('text-xs font-medium', step >= s.id ? 'text-[#111111]' : 'text-[#888888]')}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-px w-8 mx-3', step > s.id ? 'bg-[#111111]' : 'bg-[#E5E5E5]')} />
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-white border border-[#E5E5E5] p-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="field-label">Nome do Projeto *</label>
                  <input
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Ex: Redução de Lead Time de Entrega"
                    className="field-input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="field-label">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={3}
                    placeholder="Descreva brevemente o contexto e objetivos do projeto..."
                    className="field-input resize-none"
                  />
                </div>
                <div>
                  <label className="field-label">Metodologia</label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {MAIN_METHODOLOGIES.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => update('methodology', m.value)}
                        className={cn(
                          'text-left p-4 border transition-all',
                          form.methodology === m.value
                            ? 'border-[#111111] bg-[#111111] text-white'
                            : 'border-[#E5E5E5] bg-white hover:border-[#AAAAAA]',
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold tracking-tight">{m.label}</span>
                          <div className="flex gap-1">
                            {m.phases.map((p) => (
                              <span
                                key={p}
                                className={cn('text-[9px] font-semibold px-1 py-0.5 border',
                                  form.methodology === m.value ? 'border-white/30 text-white/80' : 'border-[#E5E5E5] text-[#888888]'
                                )}
                              >
                                {p.slice(0, 3).toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className={cn('text-[11px] leading-relaxed', form.methodology === m.value ? 'text-white/70' : 'text-[#888888]')}>
                          {m.description}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#888888]">Outros:</span>
                    {OTHER_METHODOLOGIES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => update('methodology', m)}
                        className={cn(
                          'text-[11px] px-2.5 py-1 border transition-colors',
                          form.methodology === m ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#E5E5E5] text-[#555555] hover:border-[#AAAAAA]',
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="field-label">Prioridade</label>
                  <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className="field-input">
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="field-label">Declaração do Problema *</label>
                  <textarea
                    value={form.problemStatement}
                    onChange={(e) => update('problemStatement', e.target.value)}
                    rows={4}
                    placeholder="Descreva o problema de forma clara e objetiva. Ex: A média de lead time de entrega é de 5 dias, resultando em insatisfação de 35% dos clientes..."
                    className="field-input resize-none"
                  />
                  <p className="text-[11px] text-[#888888] mt-1">
                    Use dados: o que, onde, quando, quanto impacta.
                  </p>
                </div>
                <div>
                  <label className="field-label">Objetivo / Meta *</label>
                  <textarea
                    value={form.goals}
                    onChange={(e) => update('goals', e.target.value)}
                    rows={3}
                    placeholder="Ex: Reduzir o lead time de entrega de 5 dias para 2 dias até 31/03/2024, resultando em economia de R$ 500K/ano."
                    className="field-input resize-none"
                  />
                  <p className="text-[11px] text-[#888888] mt-1">
                    Seja específico: de X para Y até data Z.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Escopo (Inclui)</label>
                    <textarea
                      value={form.scope}
                      onChange={(e) => update('scope', e.target.value)}
                      rows={3}
                      placeholder="O que está incluído no escopo do projeto..."
                      className="field-input resize-none"
                    />
                  </div>
                  <div>
                    <label className="field-label">Fora do Escopo</label>
                    <textarea
                      value={form.outOfScope}
                      onChange={(e) => update('outOfScope', e.target.value)}
                      rows={3}
                      placeholder="O que NÃO está no escopo..."
                      className="field-input resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Data de Início</label>
                    <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Prazo (Meta)</label>
                    <input type="date" value={form.targetDate} onChange={(e) => update('targetDate', e.target.value)} className="field-input" />
                  </div>
                </div>
                <div>
                  <label className="field-label">Savings Estimados (R$)</label>
                  <input
                    type="number"
                    value={form.estimatedSavings}
                    onChange={(e) => update('estimatedSavings', e.target.value)}
                    placeholder="500000"
                    className="field-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Budget CAPEX (R$)</label>
                    <input type="number" value={form.capexBudget} onChange={(e) => update('capexBudget', e.target.value)} placeholder="0" className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Budget OPEX (R$)</label>
                    <input type="number" value={form.opexBudget} onChange={(e) => update('opexBudget', e.target.value)} placeholder="0" className="field-input" />
                  </div>
                </div>
                <div>
                  <label className="field-label">Impacto Financeiro (descrição)</label>
                  <textarea
                    value={form.financialImpact}
                    onChange={(e) => update('financialImpact', e.target.value)}
                    rows={2}
                    placeholder="Descreva o impacto financeiro esperado..."
                    className="field-input resize-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E5E5] text-xs text-[#555555] hover:bg-[#F4F4F4] transition-colors"
            >
              <ChevronLeft size={13} />
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </button>

            {step < STEPS.length ? (
              <button
                onClick={() => form.name.trim() && setStep(s => s + 1)}
                disabled={step === 1 && !form.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próximo <ChevronRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !form.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Criando...' : 'Criar Projeto'}
              </button>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #555555;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .field-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #E5E5E5;
          background: white;
          color: #111111;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .field-input:focus {
          outline: none;
          border-color: #111111;
        }
        .field-input::placeholder {
          color: #AAAAAA;
        }
        select.field-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 30px;
        }
      `}</style>
    </>
  );
}
