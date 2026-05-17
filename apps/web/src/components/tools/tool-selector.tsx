'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, CheckCircle2, Clock, Zap } from 'lucide-react';

export interface ToolCardInfo {
  type: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  status: 'not_started' | 'in_progress' | 'done';
  recommended?: boolean;
}

interface ToolSelectorProps {
  tools: ToolCardInfo[];
  onSelect: (toolType: string) => void;
  title?: string;
}

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Iniciante', color: 'text-[#16A34A]', dot: 'bg-[#16A34A]' },
  intermediate: { label: 'Intermediário', color: 'text-[#D97706]', dot: 'bg-[#D97706]' },
  advanced: { label: 'Avançado', color: 'text-[#DC2626]', dot: 'bg-[#DC2626]' },
};

const STATUS_CONFIG = {
  not_started: { label: 'Não iniciado', icon: null, color: 'text-[#AAAAAA]' },
  in_progress: { label: 'Em andamento', icon: Clock, color: 'text-[#D97706]' },
  done: { label: 'Concluído', icon: CheckCircle2, color: 'text-[#16A34A]' },
};

export function ToolSelector({ tools, onSelect, title }: ToolSelectorProps) {
  return (
    <div className="p-6">
      {title && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-[#111111]">{title}</h2>
          <p className="text-xs text-[#888888] mt-0.5">Selecione uma ferramenta para iniciar ou continuar</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool) => {
          const diff = DIFFICULTY_CONFIG[tool.difficulty];
          const status = STATUS_CONFIG[tool.status];
          const StatusIcon = status.icon;

          return (
            <button
              key={tool.type}
              onClick={() => onSelect(tool.type)}
              className={cn(
                'text-left p-4 bg-white border transition-all hover:border-[#111111] hover:shadow-sm group',
                tool.status === 'done'
                  ? 'border-[#16A34A]/30'
                  : tool.status === 'in_progress'
                  ? 'border-[#D97706]/30'
                  : 'border-[#E5E5E5]',
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#111111]">{tool.name}</span>
                  {tool.recommended && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 border border-[#FDE68A]">
                      <Zap size={9} />
                      IA
                    </span>
                  )}
                </div>
                <ChevronRight size={12} className="text-[#AAAAAA] shrink-0 group-hover:text-[#111111] transition-colors mt-0.5" />
              </div>

              <p className="text-[11px] text-[#888888] leading-relaxed mb-3 line-clamp-2">{tool.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn('text-[10px] font-medium flex items-center gap-1', diff.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', diff.dot)} />
                    {diff.label}
                  </span>
                  <span className="text-[10px] text-[#AAAAAA] flex items-center gap-0.5">
                    <Clock size={9} />
                    {tool.estimatedDuration}
                  </span>
                </div>
                <span className={cn('text-[10px] font-medium flex items-center gap-0.5', status.color)}>
                  {StatusIcon && <StatusIcon size={10} />}
                  {status.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
