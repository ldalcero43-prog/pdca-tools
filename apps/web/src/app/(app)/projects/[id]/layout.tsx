'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { cn, STATUS_LABELS } from '@/lib/utils';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  currentPhase: string;
  methodology: string;
}

const PHASE_TABS = [
  { id: 'overview', label: 'Visão Geral', href: '' },
  { id: 'plan', label: 'Plan', href: '/plan', phase: 'PLAN', color: 'text-[#2563EB]' },
  { id: 'do', label: 'Do', href: '/do', phase: 'DO', color: 'text-[#D97706]' },
  { id: 'check', label: 'Check', href: '/check', phase: 'CHECK', color: 'text-[#16A34A]' },
  { id: 'act', label: 'Act', href: '/act', phase: 'ACT', color: 'text-[#7C3AED]' },
  { id: 'timeline', label: 'Timeline', href: '/timeline' },
  { id: 'reports', label: 'Relatórios', href: '/reports' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-[#888888]',
  ACTIVE: 'text-[#16A34A]',
  ON_HOLD: 'text-[#D97706]',
  COMPLETED: 'text-[#2563EB]',
};

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    api.get<Project>(`/projects/${projectId}`)
      .then(setProject)
      .catch(() => router.push('/projects'));
  }, [projectId]);

  const basePath = `/projects/${projectId}`;

  function isActive(tabHref: string) {
    const full = basePath + tabHref;
    if (tabHref === '') return pathname === basePath || pathname === basePath + '/';
    return pathname.startsWith(full);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="bg-white border-b border-[#E5E5E5] px-6 pt-4 pb-0 shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#888888] mb-3">
          <Link href="/projects" className="hover:text-[#111111] flex items-center gap-1">
            <ArrowLeft size={11} />
            Projetos
          </Link>
          <ChevronRight size={10} />
          {project ? (
            <>
              <span className="font-mono">{project.code}</span>
              <ChevronRight size={10} />
              <span className="text-[#111111] font-medium">{project.name}</span>
            </>
          ) : (
            <span className="text-[#AAAAAA]">Carregando...</span>
          )}
        </div>

        {/* Project title row */}
        {project && (
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-base font-semibold text-[#111111] leading-tight">{project.name}</h1>
            <span className={cn('text-xs font-medium', STATUS_COLORS[project.status] || 'text-[#888888]')}>
              {STATUS_LABELS[project.status] || project.status}
            </span>
            <span className="text-xs text-[#AAAAAA] border border-[#E5E5E5] px-2 py-0.5">
              {project.methodology}
            </span>
          </div>
        )}

        {/* Phase tabs */}
        <nav className="flex items-center gap-0 -mb-px">
          {PHASE_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={basePath + tab.href}
              className={cn(
                'px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive(tab.href)
                  ? `border-[#111111] text-[#111111] ${tab.color || ''}`
                  : 'border-transparent text-[#555555] hover:text-[#111111] hover:border-[#E5E5E5]',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
