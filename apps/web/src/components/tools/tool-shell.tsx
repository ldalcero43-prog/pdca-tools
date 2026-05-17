'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, BookOpen, X, Lightbulb, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
}

interface ToolMeta {
  name: string;
  description: string;
  objective: string;
  whenToUse: string[];
  whenToAvoid: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  stepByStep: TutorialStep[];
  commonErrors: string[];
  bestPractices: string[];
  exampleContext?: string;
}

interface ToolShellProps {
  meta: ToolMeta;
  saving?: boolean;
  lastSaved?: Date | null;
  onSave?: () => void;
  children: React.ReactNode;
}

const DIFFICULTY_LABELS = {
  beginner: { label: 'Iniciante', color: 'text-[#16A34A]' },
  intermediate: { label: 'Intermediário', color: 'text-[#D97706]' },
  advanced: { label: 'Avançado', color: 'text-[#DC2626]' },
};

export function ToolShell({ meta, saving, lastSaved, onSave, children }: ToolShellProps) {
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [tutorialTab, setTutorialTab] = useState<'guide' | 'tips'>('guide');

  const diff = DIFFICULTY_LABELS[meta.difficulty];

  return (
    <div className="flex h-full">
      {/* Editor area */}
      <div className={cn('flex flex-col flex-1 min-w-0 transition-all', tutorialOpen ? 'mr-0' : '')}>
        {/* Tool header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-white shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[#111111]">{meta.name}</h2>
            <p className="text-[11px] text-[#888888] mt-0.5">{meta.objective}</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-[11px] text-[#AAAAAA] flex items-center gap-1">
                <Clock size={10} />
                Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {onSave && (
              <button
                onClick={onSave}
                disabled={saving}
                className="px-3 py-1.5 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            )}
            <button
              onClick={() => setTutorialOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium transition-colors',
                tutorialOpen
                  ? 'border-[#111111] bg-[#111111] text-white'
                  : 'border-[#E5E5E5] text-[#555555] hover:bg-[#F4F4F4]',
              )}
            >
              <BookOpen size={11} />
              Tutorial
            </button>
          </div>
        </div>

        {/* Tool content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>

      {/* Tutorial panel */}
      {tutorialOpen && (
        <div className="w-80 shrink-0 border-l border-[#E5E5E5] bg-[#FAFAFA] flex flex-col">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-[#E5E5E5] bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen size={12} className="text-[#888888]" />
              <span className="text-xs font-semibold text-[#111111]">Tutorial</span>
            </div>
            <button
              onClick={() => setTutorialOpen(false)}
              className="p-1 hover:bg-[#F4F4F4] rounded-sm transition-colors"
            >
              <X size={12} className="text-[#888888]" />
            </button>
          </div>

          {/* Meta info */}
          <div className="px-4 py-3 border-b border-[#E5E5E5] bg-white shrink-0">
            <div className="flex items-center gap-3">
              <span className={cn('text-[11px] font-medium', diff.color)}>{diff.label}</span>
              <span className="text-[#E5E5E5]">|</span>
              <span className="text-[11px] text-[#888888] flex items-center gap-1">
                <Clock size={10} />
                {meta.estimatedDuration}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E5E5E5] shrink-0">
            {(['guide', 'tips'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTutorialTab(tab)}
                className={cn(
                  'flex-1 py-2 text-[11px] font-medium transition-colors',
                  tutorialTab === tab
                    ? 'border-b-2 border-[#111111] text-[#111111]'
                    : 'text-[#888888] hover:text-[#555555]',
                )}
              >
                {tab === 'guide' ? 'Passo a Passo' : 'Dicas & Erros'}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {tutorialTab === 'guide' && (
              <>
                {/* Description */}
                <div>
                  <p className="text-[11px] text-[#555555] leading-relaxed">{meta.description}</p>
                </div>

                {/* When to use */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">Quando Usar</p>
                  <ul className="space-y-1.5">
                    {meta.whenToUse.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 size={11} className="text-[#16A34A] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[#555555] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* When to avoid */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">Quando Evitar</p>
                  <ul className="space-y-1.5">
                    {meta.whenToAvoid.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <X size={11} className="text-[#DC2626] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[#555555] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2">Como Executar</p>
                  <ol className="space-y-3">
                    {meta.stepByStep.map((step, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#E5E5E5] text-[#555555] text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[11px] font-medium text-[#111111]">{step.title}</p>
                          <p className="text-[11px] text-[#888888] leading-relaxed mt-0.5">{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Example */}
                {meta.exampleContext && (
                  <div className="bg-white border border-[#E5E5E5] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2 flex items-center gap-1">
                      <Lightbulb size={10} />
                      Exemplo Prático
                    </p>
                    <p className="text-[11px] text-[#555555] leading-relaxed">{meta.exampleContext}</p>
                  </div>
                )}
              </>
            )}

            {tutorialTab === 'tips' && (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2 flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-[#16A34A]" />
                    Boas Práticas
                  </p>
                  <ul className="space-y-2">
                    {meta.bestPractices.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#16A34A] shrink-0 mt-2" />
                        <span className="text-[11px] text-[#555555] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888] mb-2 flex items-center gap-1">
                    <AlertTriangle size={10} className="text-[#D97706]" />
                    Erros Comuns
                  </p>
                  <ul className="space-y-2">
                    {meta.commonErrors.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#D97706] shrink-0 mt-2" />
                        <span className="text-[11px] text-[#555555] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
