'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { FileText, Printer, Loader2, ExternalLink } from 'lucide-react';

// ─── A3 HTML generator ───────────────────────────────────────────────────────

function buildA3Html(data: {
  project: any;
  tools: any[];
  tasks: any[];
  kpis: any[];
  milestones: any[];
  phases: any[];
}): string {
  const { project, tools, tasks, kpis, milestones, phases } = data;

  const fiveWhys = tools.find((t) => t.toolType === 'FIVE_WHYS')?.data;
  const ishikawa = tools.find((t) => t.toolType === 'ISHIKAWA')?.data;
  const sipoc = tools.find((t) => t.toolType === 'SIPOC')?.data;
  const swot = tools.find((t) => t.toolType === 'SWOT')?.data;
  const fmea = tools.find((t) => t.toolType === 'FMEA')?.data;

  const topTasks = [...tasks]
    .filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH' || t.status !== 'DONE')
    .sort((a, b) => {
      const pOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3);
    })
    .slice(0, 8);

  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const totalTasks = tasks.length;

  const phaseMap: Record<string, string> = {
    PLAN: 'Plan', DO: 'Do', CHECK: 'Check', ACT: 'Act',
    DEFINE: 'Define', MEASURE: 'Measure', ANALYZE: 'Analyze', IMPROVE: 'Improve', CONTROL: 'Control',
  };
  const priorityLabel: Record<string, string> = { CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo' };
  const statusLabel: Record<string, string> = {
    BACKLOG: 'Backlog', TODO: 'A Fazer', IN_PROGRESS: 'Em And.', IN_REVIEW: 'Em Rev.', DONE: 'Concluído', BLOCKED: 'Bloqueado',
  };

  function fmt(v: number | null | undefined, unit = '') {
    if (v == null) return '—';
    return `${v.toLocaleString('pt-BR')}${unit ? ' ' + unit : ''}`;
  }
  function fmtDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  }
  function kpiDirection(dir: string) { return dir === 'UP' ? '↑' : '↓'; }

  const causeAnalysis = (() => {
    if (fiveWhys?.rootCause) {
      return `<p class="text-sm font-semibold mb-1">Causa Raiz (5 Porquês)</p>
        <p class="text-xs text-gray-700 mb-2">${fiveWhys.rootCause}</p>
        ${(fiveWhys.whys || []).map((w: string, i: number) => `<p class="text-xs text-gray-500 pl-2">→ Por quê ${i + 1}: ${w}</p>`).join('')}`;
    }
    if (ishikawa?.effect) {
      const cats = Object.entries(ishikawa.categories || {}) as [string, string[]][];
      return `<p class="text-sm font-semibold mb-1">Diagrama de Ishikawa</p>
        <p class="text-xs text-gray-700 mb-1">Efeito: ${ishikawa.effect}</p>
        ${cats.filter(([, items]) => items.length > 0).map(([cat, items]) =>
          `<p class="text-xs font-medium text-gray-600 mt-1">${cat}:</p>
           ${items.map((i: string) => `<p class="text-xs text-gray-500 pl-2">• ${i}</p>`).join('')}`
        ).join('')}`;
    }
    return '<p class="text-xs text-gray-400 italic">Análise de causa não preenchida.</p>';
  })();

  const swotSection = swot ? `
    <div class="grid grid-cols-2 gap-1 mt-1">
      <div>
        <p class="text-[10px] font-bold text-green-700 uppercase">Forças</p>
        ${(swot.strengths || []).map((s: string) => `<p class="text-[10px] text-gray-600">• ${s}</p>`).join('')}
        <p class="text-[10px] font-bold text-red-700 uppercase mt-1">Fraquezas</p>
        ${(swot.weaknesses || []).map((s: string) => `<p class="text-[10px] text-gray-600">• ${s}</p>`).join('')}
      </div>
      <div>
        <p class="text-[10px] font-bold text-blue-700 uppercase">Oportunidades</p>
        ${(swot.opportunities || []).map((s: string) => `<p class="text-[10px] text-gray-600">• ${s}</p>`).join('')}
        <p class="text-[10px] font-bold text-orange-700 uppercase mt-1">Ameaças</p>
        ${(swot.threats || []).map((s: string) => `<p class="text-[10px] text-gray-600">• ${s}</p>`).join('')}
      </div>
    </div>` : '<p class="text-xs text-gray-400 italic">SWOT não preenchido.</p>';

  const kpiRows = kpis.map((k) => {
    const measurements = k.measurements || [];
    const current = k.current ?? (measurements.length > 0 ? measurements[measurements.length - 1].value : null);
    const progress = k.baseline != null && k.target != null && k.baseline !== k.target
      ? Math.min(100, Math.abs((current - k.baseline) / (k.target - k.baseline)) * 100)
      : null;
    return `<tr>
      <td class="text-xs py-1 pr-2 font-medium">${k.name}</td>
      <td class="text-xs py-1 pr-2 text-gray-500">${fmt(k.baseline, k.unit)}</td>
      <td class="text-xs py-1 pr-2 text-gray-900 font-semibold">${fmt(current, k.unit)}</td>
      <td class="text-xs py-1 pr-2 text-blue-700 font-semibold">${fmt(k.target, k.unit)} ${kpiDirection(k.direction)}</td>
      <td class="text-xs py-1">
        ${progress != null ? `<div style="width:60px;height:6px;background:#E5E5E5;border-radius:2px;display:inline-block;vertical-align:middle">
          <div style="width:${Math.round(progress)}%;height:100%;background:${progress >= 100 ? '#16A34A' : progress >= 60 ? '#D97706' : '#DC2626'};border-radius:2px"></div>
        </div> <span class="text-[10px] text-gray-500">${Math.round(progress)}%</span>` : '—'}
      </td>
    </tr>`;
  }).join('');

  const taskRows = topTasks.map((t, i) => {
    const priorityColor: Record<string, string> = { CRITICAL: '#DC2626', HIGH: '#D97706', MEDIUM: '#555', LOW: '#AAA' };
    return `<tr>
      <td class="text-[10px] py-1 pr-1 text-gray-400">${i + 1}.</td>
      <td class="text-xs py-1 pr-2 font-medium">${t.title}</td>
      <td class="text-[10px] py-1 pr-2 text-gray-500">${t.assigneeName || '—'}</td>
      <td class="text-[10px] py-1 pr-2 text-gray-500">${fmtDate(t.dueDate)}</td>
      <td class="text-[10px] py-1 pr-2" style="color:${priorityColor[t.priority] || '#888'}">${priorityLabel[t.priority] || t.priority}</td>
      <td class="text-[10px] py-1">${statusLabel[t.status] || t.status}</td>
    </tr>`;
  }).join('');

  const phaseProgress = phases.map((p) => `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
      <span style="font-size:10px;width:60px;color:#555">${phaseMap[p.phase] || p.phase}</span>
      <div style="flex:1;height:5px;background:#E5E5E5;border-radius:2px">
        <div style="width:${p.completionPercentage || 0}%;height:100%;background:#111;border-radius:2px"></div>
      </div>
      <span style="font-size:10px;color:#888;width:28px;text-align:right">${p.completionPercentage || 0}%</span>
    </div>`).join('');

  const nextMilestones = milestones
    .filter((m) => m.status !== 'COMPLETED' && m.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    .slice(0, 4);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>A3 — ${project.name}</title>
<style>
  @page { size: A3 landscape; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; background: white; }
  .a3 { width: 100%; height: 100%; display: flex; flex-direction: column; }
  .header { border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 8px; display: flex; align-items: flex-start; justify-content: space-between; }
  .header-left h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.5px; }
  .header-left .sub { font-size: 10px; color: #555; margin-top: 2px; }
  .header-right { text-align: right; font-size: 10px; color: #555; }
  .header-right .code { font-family: monospace; font-size: 12px; font-weight: 700; color: #111; }
  .body { flex: 1; display: grid; grid-template-columns: 58% 42%; gap: 10px; }
  .section { margin-bottom: 8px; }
  .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #E5E5E5; padding-bottom: 3px; margin-bottom: 5px; }
  .box { border: 1px solid #E5E5E5; padding: 6px 8px; margin-bottom: 6px; }
  .box-highlight { background: #FAFAFA; }
  table { border-collapse: collapse; width: 100%; }
  th { font-size: 9px; text-transform: uppercase; color: #888; text-align: left; padding: 2px 4px 4px 0; letter-spacing: 0.5px; border-bottom: 1px solid #E5E5E5; }
  .footer { border-top: 1px solid #E5E5E5; padding-top: 5px; margin-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #888; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="a3">
  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <h1>${project.name}</h1>
      <div class="sub">${project.methodology} · ${project.problemStatement?.slice(0, 120) || ''}</div>
    </div>
    <div class="header-right">
      <div class="code">${project.code}</div>
      <div>Fase atual: ${phaseMap[project.currentPhase] || project.currentPhase}</div>
      <div>Início: ${fmtDate(project.startDate)} · Meta: ${fmtDate(project.targetDate)}</div>
      <div>Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">
    <!-- LEFT COLUMN -->
    <div>
      <!-- Problem Statement -->
      <div class="section">
        <div class="section-title">1. Declaração do Problema</div>
        <div class="box box-highlight">
          <p class="text-xs">${project.problemStatement || '<em style="color:#AAA">Não preenchido.</em>'}</p>
        </div>
      </div>

      <!-- Goals -->
      <div class="section">
        <div class="section-title">2. Objetivo / Meta</div>
        <div class="box">
          <p class="text-xs">${project.goals || '<em style="color:#AAA">Não preenchido.</em>'}</p>
        </div>
      </div>

      <!-- Scope -->
      ${project.scope || project.outOfScope ? `
      <div class="section">
        <div class="section-title">3. Escopo</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div class="box">
            <p style="font-size:9px;font-weight:700;color:#16A34A;text-transform:uppercase;margin-bottom:3px">Inclui</p>
            <p class="text-xs">${project.scope || '—'}</p>
          </div>
          <div class="box">
            <p style="font-size:9px;font-weight:700;color:#DC2626;text-transform:uppercase;margin-bottom:3px">Exclui</p>
            <p class="text-xs">${project.outOfScope || '—'}</p>
          </div>
        </div>
      </div>` : ''}

      <!-- Cause Analysis -->
      <div class="section">
        <div class="section-title">4. Análise de Causa Raiz</div>
        <div class="box">${causeAnalysis}</div>
      </div>

      <!-- SWOT -->
      <div class="section">
        <div class="section-title">5. Análise SWOT</div>
        <div class="box">${swotSection}</div>
      </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div>
      <!-- Progress -->
      <div class="section">
        <div class="section-title">Progresso por Fase</div>
        <div class="box">${phaseProgress}</div>
      </div>

      <!-- KPIs -->
      <div class="section">
        <div class="section-title">Indicadores de Desempenho (KPIs)</div>
        ${kpis.length > 0 ? `
        <table>
          <thead><tr>
            <th>KPI</th><th>Baseline</th><th>Atual</th><th>Meta</th><th>Progresso</th>
          </tr></thead>
          <tbody>${kpiRows}</tbody>
        </table>` : '<p class="text-xs text-gray-400 italic">Nenhum KPI cadastrado.</p>'}
      </div>

      <!-- Financial -->
      ${(project.estimatedSavings || project.actualSavings || project.capexBudget) ? `
      <div class="section">
        <div class="section-title">Financeiro</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
          <div class="box" style="text-align:center">
            <p style="font-size:9px;color:#888;text-transform:uppercase">Savings Estimados</p>
            <p style="font-size:13px;font-weight:700">R$ ${fmt(project.estimatedSavings)}</p>
          </div>
          <div class="box" style="text-align:center">
            <p style="font-size:9px;color:#888;text-transform:uppercase">Savings Realizados</p>
            <p style="font-size:13px;font-weight:700;color:#16A34A">R$ ${fmt(project.actualSavings)}</p>
          </div>
          <div class="box" style="text-align:center">
            <p style="font-size:9px;color:#888;text-transform:uppercase">Budget Total</p>
            <p style="font-size:13px;font-weight:700">R$ ${fmt((project.capexBudget ?? 0) + (project.opexBudget ?? 0))}</p>
          </div>
        </div>
      </div>` : ''}

      <!-- Action Plan -->
      <div class="section">
        <div class="section-title">Plano de Ação (${doneTasks}/${totalTasks} concluídas)</div>
        ${topTasks.length > 0 ? `
        <table>
          <thead><tr>
            <th></th><th>Ação</th><th>Responsável</th><th>Prazo</th><th>Prior.</th><th>Status</th>
          </tr></thead>
          <tbody>${taskRows}</tbody>
        </table>` : '<p class="text-xs text-gray-400 italic">Nenhuma ação cadastrada.</p>'}
      </div>

      <!-- Next milestones -->
      ${nextMilestones.length > 0 ? `
      <div class="section">
        <div class="section-title">Próximos Marcos</div>
        ${nextMilestones.map((m) => `
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="font-size:9px;color:#888;width:60px;shrink:0">${fmtDate(m.dueDate)}</span>
            <span style="font-size:10px;color:#111">${m.title}</span>
          </div>`).join('')}
      </div>` : ''}
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>Plannr — Gestão de Melhoria Contínua</span>
    <span>${project.code} · ${project.methodology} · ${phaseMap[project.currentPhase] || project.currentPhase}</span>
    <span>Revisão gerada em ${new Date().toLocaleDateString('pt-BR')} · v${project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('pt-BR') : '—'}</span>
  </div>
</div>
</body>
</html>`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { id } = useParams();
  const projectId = id as string;
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  async function generateA3(mode: 'print' | 'preview') {
    setGenerating(true);
    setError('');
    try {
      const [projectRes, toolsRes, tasksRes, kpisRes, milestonesRes, phasesRes] = await Promise.all([
        api.get<any>(`/projects/${projectId}`),
        api.get<any>(`/projects/${projectId}/tools`),
        api.get<any>(`/projects/${projectId}/tasks`),
        api.get<any>(`/projects/${projectId}/kpis`),
        api.get<any>(`/projects/${projectId}/milestones`),
        api.get<any>(`/projects/${projectId}/phases`),
      ]);

      const project = projectRes?.data ?? projectRes;
      const tools   = Array.isArray(toolsRes)      ? toolsRes      : (toolsRes?.data      ?? []);
      const tasks    = Array.isArray(tasksRes)      ? tasksRes      : (tasksRes?.data      ?? []);
      const kpis     = Array.isArray(kpisRes)       ? kpisRes       : (kpisRes?.data       ?? []);
      const ms       = Array.isArray(milestonesRes) ? milestonesRes : (milestonesRes?.data ?? []);
      const phases   = Array.isArray(phasesRes)     ? phasesRes     : (phasesRes?.data     ?? []);

      const html = buildA3Html({ project, tools, tasks, kpis, milestones: ms, phases });

      if (mode === 'preview') {
        setPreviewHtml(html);
      } else {
        const win = window.open('', '_blank');
        if (!win) { setError('Bloqueio de popup — permita popups para este site e tente novamente.'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 600);
      }
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
        <p className="text-xs text-[#888888]">Gere relatórios executivos em formato A3 a partir dos dados do projeto</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* A3 Report */}
        <div className="bg-white border border-[#E5E5E5] p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[#111111]" />
            <h3 className="text-sm font-semibold text-[#111111]">Relatório A3</h3>
          </div>
          <p className="text-[11px] text-[#888888] leading-relaxed mb-4">
            Relatório executivo em formato A3 (paisagem) com problema, causa raiz, SWOT, plano de ação,
            KPIs e financeiro. Abre em nova aba para impressão ou save as PDF.
          </p>

          <div className="text-[11px] text-[#888888] bg-[#FAFAFA] border border-[#E5E5E5] p-3 mb-4 space-y-1">
            <p className="font-semibold text-[#555555]">O relatório inclui automaticamente:</p>
            <p>• Declaração do problema e meta</p>
            <p>• Escopo do projeto</p>
            <p>• Análise de causa raiz (5 Porquês ou Ishikawa)</p>
            <p>• Análise SWOT</p>
            <p>• Progresso por fase</p>
            <p>• KPIs: baseline → atual → meta</p>
            <p>• Plano de ação (top ações por prioridade)</p>
            <p>• Próximos marcos e resumo financeiro</p>
          </div>

          {error && (
            <p className="text-[11px] text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 mb-3">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateA3('print')}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] disabled:opacity-50 transition-colors"
            >
              {generating
                ? <><Loader2 size={11} className="animate-spin" /> Gerando...</>
                : <><Printer size={11} /> Imprimir / Salvar PDF</>
              }
            </button>
            <button
              onClick={() => generateA3('preview')}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#E5E5E5] text-[#555555] text-xs font-medium hover:bg-[#F4F4F4] disabled:opacity-50 transition-colors"
            >
              <ExternalLink size={11} /> Pré-visualizar
            </button>
          </div>

          <p className="text-[10px] text-[#AAAAAA] mt-3">
            Na janela de impressão: selecione "Salvar como PDF" para baixar o arquivo.
            Recomendado papel A3 em modo paisagem, margens mínimas.
          </p>
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

      {/* Inline preview */}
      {previewHtml && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#111111] uppercase tracking-widest">Pré-visualização do A3</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateA3('print')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-medium hover:bg-[#333333] transition-colors"
              >
                <Printer size={11} /> Imprimir
              </button>
              <button
                onClick={() => setPreviewHtml(null)}
                className="px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#555555] hover:bg-[#F4F4F4] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
          <div className="border border-[#E5E5E5] overflow-hidden" style={{ height: '620px' }}>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full"
              title="A3 Preview"
              sandbox="allow-same-origin"
            />
          </div>
          <p className="text-[10px] text-[#AAAAAA] mt-2">
            Pré-visualização aproximada. O resultado final pode variar conforme o navegador e configurações de impressão.
          </p>
        </div>
      )}
    </div>
  );
}
