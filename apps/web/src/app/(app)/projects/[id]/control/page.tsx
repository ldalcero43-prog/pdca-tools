'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Plus, FileText, BookOpen, CheckCircle2, Save, X } from 'lucide-react';

interface LessonLearned {
  id: string;
  category: string;
  description: string;
  recommendation: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface StandardizationItem {
  id: string;
  title: string;
  type: 'SOP' | 'TRAINING' | 'AUDIT' | 'OTHER';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  responsible: string;
  dueDate: string;
  notes: string;
}

interface ActData {
  lessonsLearned: LessonLearned[];
  standardizationItems: StandardizationItem[];
  closureSummary: string;
}

const LESSON_CATEGORIES = ['Processo', 'Tecnologia', 'Pessoas', 'Comunicação', 'Gestão', 'Outros'];
const IMPACT_COLORS: Record<string, string> = {
  HIGH: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
  MEDIUM: 'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]',
  LOW: 'text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]',
};
const ITEM_TYPES = [
  { value: 'SOP', label: 'POP / Instrução de Trabalho' },
  { value: 'TRAINING', label: 'Treinamento' },
  { value: 'AUDIT', label: 'Auditoria' },
  { value: 'OTHER', label: 'Outro' },
];
const ITEM_STATUSES = [
  { value: 'PENDING', label: 'Pendente', color: 'text-[#888888]' },
  { value: 'IN_PROGRESS', label: 'Em Andamento', color: 'text-[#D97706]' },
  { value: 'DONE', label: 'Concluído', color: 'text-[#16A34A]' },
];

function generateId() { return Math.random().toString(36).slice(2, 9); }

export default function ControlPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [data, setData] = useState<ActData>({
    lessonsLearned: [],
    standardizationItems: [],
    closureSummary: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'standardization' | 'lessons' | 'closure'>('standardization');

  useEffect(() => {
    api.get<any>(`/projects/${projectId}/tools/ACT_STANDARDIZATION`)
      .then((res) => {
        if (res?.data) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/tools/ACT_STANDARDIZATION`, { data });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const addLesson = () => {
    setData((d) => ({
      ...d,
      lessonsLearned: [...d.lessonsLearned, {
        id: generateId(),
        category: 'Processo',
        description: '',
        recommendation: '',
        impact: 'MEDIUM',
      }],
    }));
  };

  const updateLesson = (id: string, patch: Partial<LessonLearned>) => {
    setData((d) => ({ ...d, lessonsLearned: d.lessonsLearned.map((l) => l.id === id ? { ...l, ...patch } : l) }));
  };

  const removeLesson = (id: string) => {
    setData((d) => ({ ...d, lessonsLearned: d.lessonsLearned.filter((l) => l.id !== id) }));
  };

  const addItem = () => {
    setData((d) => ({
      ...d,
      standardizationItems: [...d.standardizationItems, {
        id: generateId(),
        title: '',
        type: 'SOP',
        status: 'PENDING',
        responsible: '',
        dueDate: '',
        notes: '',
      }],
    }));
  };

  const updateItem = (id: string, patch: Partial<StandardizationItem>) => {
    setData((d) => ({ ...d, standardizationItems: d.standardizationItems.map((i) => i.id === id ? { ...i, ...patch } : i) }));
  };

  const removeItem = (id: string) => {
    setData((d) => ({ ...d, standardizationItems: d.standardizationItems.filter((i) => i.id !== id) }));
  };

  const doneItems = data.standardizationItems.filter((i) => i.status === 'DONE').length;
  const totalItems = data.standardizationItems.length;

  if (loading) return <div className="p-8 text-sm text-[#888888]">Carregando...</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-white shrink-0">
        <div className="flex items-center gap-4">
          {(['standardization', 'lessons', 'closure'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'text-xs font-medium pb-1 border-b-2 transition-colors',
                activeTab === tab ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#888888] hover:text-[#555555]',
              )}
            >
              {tab === 'standardization' ? 'Padronização' : tab === 'lessons' ? 'Lições Aprendidas' : 'Encerramento'}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
        >
          <Save size={11} />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Standardization tab */}
        {activeTab === 'standardization' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#111111]">Plano de Padronização</h2>
                <p className="text-[11px] text-[#888888] mt-0.5">
                  Defina as ações para garantir que as melhorias implementadas se tornem permanentes
                </p>
              </div>
              {totalItems > 0 && (
                <span className={cn('text-[11px] font-medium', doneItems === totalItems ? 'text-[#16A34A]' : 'text-[#888888]')}>
                  {doneItems}/{totalItems} concluídos
                </span>
              )}
            </div>

            <div className="bg-white border border-[#E5E5E5]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E5E5]">
                    {['Ação de Padronização', 'Tipo', 'Status', 'Responsável', 'Prazo', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#888888]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.standardizationItems.map((item) => {
                    const statusConf = ITEM_STATUSES.find((s) => s.value === item.status);
                    return (
                      <tr key={item.id} className="border-b border-[#E5E5E5] last:border-0 align-top">
                        <td className="px-4 py-3">
                          <input
                            value={item.title}
                            onChange={(e) => updateItem(item.id, { title: e.target.value })}
                            placeholder="Ex: Revisar POP-042..."
                            className="w-full text-sm text-[#111111] placeholder-[#AAAAAA] bg-transparent focus:outline-none border-b border-transparent focus:border-[#E5E5E5] transition-colors py-0.5"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.type}
                            onChange={(e) => updateItem(item.id, { type: e.target.value as any })}
                            className="text-xs text-[#555555] bg-transparent focus:outline-none"
                          >
                            {ITEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.status}
                            onChange={(e) => updateItem(item.id, { status: e.target.value as any })}
                            className={cn('text-xs font-medium bg-transparent focus:outline-none', statusConf?.color)}
                          >
                            {ITEM_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={item.responsible}
                            onChange={(e) => updateItem(item.id, { responsible: e.target.value })}
                            placeholder="Nome..."
                            className="w-28 text-xs text-[#555555] placeholder-[#AAAAAA] bg-transparent focus:outline-none border-b border-transparent focus:border-[#E5E5E5] transition-colors py-0.5"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateItem(item.id, { dueDate: e.target.value })}
                            className="text-xs text-[#555555] bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeItem(item.id)} className="p-1 text-[#AAAAAA] hover:text-[#DC2626] transition-colors">
                            <X size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.standardizationItems.length === 0 && (
                <div className="p-8 text-center text-sm text-[#888888]">
                  Adicione ações de padronização para garantir a sustentabilidade das melhorias
                </div>
              )}
            </div>
            <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors">
              <Plus size={12} />
              Adicionar ação de padronização
            </button>
          </div>
        )}

        {/* Lessons learned tab */}
        {activeTab === 'lessons' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#111111]">Lições Aprendidas</h2>
                <p className="text-[11px] text-[#888888] mt-0.5">Registre aprendizados para projetos futuros</p>
              </div>
              <button
                onClick={addLesson}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#555555] hover:bg-[#F4F4F4] transition-colors"
              >
                <Plus size={12} />
                Adicionar lição
              </button>
            </div>

            <div className="space-y-4">
              {data.lessonsLearned.map((lesson) => (
                <div key={lesson.id} className="bg-white border border-[#E5E5E5] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={lesson.category}
                        onChange={(e) => updateLesson(lesson.id, { category: e.target.value })}
                        className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] bg-transparent focus:outline-none border border-[#E5E5E5] px-2 py-1"
                      >
                        {LESSON_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <select
                        value={lesson.impact}
                        onChange={(e) => updateLesson(lesson.id, { impact: e.target.value as any })}
                        className={cn('text-[10px] font-medium border px-2 py-1 bg-transparent focus:outline-none', IMPACT_COLORS[lesson.impact])}
                      >
                        <option value="HIGH">Impacto Alto</option>
                        <option value="MEDIUM">Impacto Médio</option>
                        <option value="LOW">Impacto Baixo</option>
                      </select>
                    </div>
                    <button onClick={() => removeLesson(lesson.id)} className="p-1 text-[#AAAAAA] hover:text-[#DC2626] transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">O que aprendemos</label>
                      <textarea
                        value={lesson.description}
                        onChange={(e) => updateLesson(lesson.id, { description: e.target.value })}
                        rows={2}
                        placeholder="Descreva o aprendizado..."
                        className="w-full text-sm text-[#111111] placeholder-[#AAAAAA] bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-2 focus:outline-none focus:border-[#111111] resize-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-1">Recomendação para projetos futuros</label>
                      <textarea
                        value={lesson.recommendation}
                        onChange={(e) => updateLesson(lesson.id, { recommendation: e.target.value })}
                        rows={2}
                        placeholder="O que deve ser feito diferente?"
                        className="w-full text-sm text-[#111111] placeholder-[#AAAAAA] bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-2 focus:outline-none focus:border-[#111111] resize-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {data.lessonsLearned.length === 0 && (
                <div className="p-10 text-center border border-dashed border-[#E5E5E5]">
                  <BookOpen size={24} className="text-[#AAAAAA] mx-auto mb-3" />
                  <p className="text-sm text-[#888888]">Nenhuma lição registrada</p>
                  <button onClick={addLesson} className="mt-2 text-xs text-[#555555] hover:text-[#111111] transition-colors">
                    + Adicionar primeira lição
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Closure tab */}
        {activeTab === 'closure' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-[#111111]">Encerramento do Projeto</h2>
              <p className="text-[11px] text-[#888888] mt-0.5">
                Documente o resultado final e o impacto gerado pelo projeto
              </p>
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Padronização', value: `${doneItems}/${totalItems}`, icon: FileText, ok: doneItems === totalItems },
                { label: 'Lições Aprendidas', value: `${data.lessonsLearned.length}`, icon: BookOpen, ok: data.lessonsLearned.length > 0 },
                { label: 'Encerramento', value: data.closureSummary.length > 0 ? 'Documentado' : 'Pendente', icon: CheckCircle2, ok: data.closureSummary.length > 0 },
              ].map((card) => (
                <div key={card.label} className={cn('p-4 border', card.ok ? 'border-[#16A34A]/30 bg-[#F0FDF4]' : 'border-[#E5E5E5] bg-white')}>
                  <card.icon size={14} className={cn('mb-2', card.ok ? 'text-[#16A34A]' : 'text-[#AAAAAA]')} />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">{card.label}</p>
                  <p className={cn('text-sm font-semibold mt-0.5', card.ok ? 'text-[#16A34A]' : 'text-[#111111]')}>{card.value}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#888888] mb-2">
                Resumo de Encerramento
              </label>
              <textarea
                value={data.closureSummary}
                onChange={(e) => setData((d) => ({ ...d, closureSummary: e.target.value }))}
                rows={8}
                placeholder="Descreva os resultados alcançados, o impacto financeiro realizado, comparativo antes×depois, principais desafios superados e agradecimentos à equipe..."
                className="w-full px-4 py-3 border border-[#E5E5E5] bg-white text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:border-[#111111] transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4">
              <p className="text-[11px] text-[#888888]">
                <span className="font-semibold text-[#555555]">Próximos passos após o encerramento:</span>{' '}
                Apresente os resultados para a liderança, publique as lições aprendidas na base de conhecimento, e monitore os KPIs por 90 dias para confirmar sustentação das melhorias.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
