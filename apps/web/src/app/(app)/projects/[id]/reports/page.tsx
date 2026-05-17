'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { FileText, Download, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [generating, setGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function generateA3() {
    setGenerating(true);
    setError('');
    setReportUrl(null);
    try {
      const res = await api.post<{ url: string }>(`/projects/${projectId}/reports/a3`, {});
      setReportUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-[#111111] mb-1">Relatórios do Projeto</h2>
        <p className="text-xs text-[#888888]">Gere relatórios executivos e apresentações do projeto</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* A3 Report */}
        <div className="bg-white border border-[#E5E5E5] p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[#111111]" />
            <h3 className="text-sm font-semibold text-[#111111]">Relatório A3</h3>
          </div>
          <p className="text-[11px] text-[#888888] leading-relaxed mb-4">
            Relatório executivo em formato A3 (420×297mm) com problema, análise de causa, plano de ação, KPIs e resultados.
            Ideal para apresentação para liderança.
          </p>
          {reportUrl && (
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#16A34A] mb-3 hover:underline"
            >
              <Download size={11} />
              Download PDF
            </a>
          )}
          {error && <p className="text-[11px] text-[#DC2626] mb-3">{error}</p>}
          <button
            onClick={generateA3}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
          >
            {generating ? <><Loader2 size={11} className="animate-spin" /> Gerando...</> : 'Gerar A3 PDF'}
          </button>
        </div>

        {/* Status report */}
        <div className="bg-white border border-[#E5E5E5] p-5 opacity-60">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[#888888]" />
            <h3 className="text-sm font-semibold text-[#111111]">Relatório de Status</h3>
            <span className="text-[10px] font-medium text-[#AAAAAA] border border-[#E5E5E5] px-1.5 py-0.5">Em breve</span>
          </div>
          <p className="text-[11px] text-[#888888] leading-relaxed">
            Relatório semanal/mensal de progresso com status das tarefas, KPIs e marcos.
          </p>
        </div>
      </div>
    </div>
  );
}
