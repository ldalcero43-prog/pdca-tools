'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  CheckCircle2, ArrowRight, ChevronDown, ChevronUp,
  BarChart3, Users, FileText, Shield, Clock, Zap,
  Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Data ─────────────────────────────────────────────────────────────── */

const BENEFITS = [
  { Icon: BarChart3, title: 'Visibilidade total do portfólio', body: 'Saiba em tempo real em que estágio está cada projeto de melhoria da sua equipe — sem precisar perguntar.' },
  { Icon: Users, title: 'Padronização da metodologia', body: 'Todo Green Belt e Black Belt segue o mesmo framework, independentemente da filial ou turno.' },
  { Icon: FileText, title: 'A3 gerado em um clique', body: 'O relatório é exportado direto da plataforma, com layout profissional e dados atualizados — sem retrabalho.' },
  { Icon: Shield, title: 'Memória organizacional', body: 'Quando alguém sai da empresa, o conhecimento fica. O projeto permanece acessível, completo e auditável.' },
  { Icon: Clock, title: 'Acompanhamento sem cobrar', body: 'A plataforma sinaliza o que está em atraso antes da reunião acontecer — gestão de prazo automática.' },
  { Icon: Zap, title: 'Engajamento real do time', body: 'Quando a ferramenta é simples, o time usa. Quando é usada diariamente, vira hábito — e hábito vira cultura.' },
];

const PAIN_POINTS = [
  'Projetos de melhoria que começam com força total e somem em 60 dias.',
  'Planilhas de PDCA versionadas em "_FINAL_v3_revisado.xlsx".',
  'Reuniões mensais onde ninguém sabe em que pé está o projeto do outro.',
  'A3 montado manualmente no PowerPoint, na véspera da apresentação à diretoria.',
  'O Green Belt sai da empresa e leva o histórico do projeto junto com ele.',
  'Cultura de melhoria contínua que existe no discurso, mas não na prática diária.',
];

const OFFER_FEATURES = [
  'Acesso completo à plataforma Plannr',
  'Múltiplos usuários da mesma empresa',
  'Todas as ferramentas Lean integradas (PDCA, DMAIC, Ishikawa, 5 Porquês, FMEA)',
  'Acompanhamento centralizado de projetos e ações',
  'Arquivamento e histórico completo de cada projeto',
  'Exportação automática em formato A3',
  'Atualizações contínuas sem custo adicional',
];

const FAQ_ITEMS = [
  { q: 'Quanto tempo minha equipe precisa para começar a usar?', a: 'A partir do cadastro, o acesso é imediato. O primeiro projeto pode ser estruturado em menos de 15 minutos, mesmo por usuários sem experiência prévia em Lean Six Sigma.' },
  { q: 'O Plannr serve para empresas sem cultura de melhoria estabelecida?', a: 'Sim. A plataforma foi desenhada tanto para empresas com programa Lean maduro quanto para pequenas e médias empresas iniciando a jornada. Os fluxos guiados ensinam a metodologia durante o uso.' },
  { q: 'Como funciona o acesso para múltiplos usuários?', a: 'O plano Empresa permite o cadastro de múltiplos usuários vinculados à mesma conta corporativa, com visibilidade compartilhada de todos os projetos em andamento.' },
  { q: 'E se a ferramenta não atender ao que minha empresa precisa?', a: 'Você tem 7 dias para testar com sua equipe inteira. Se não for útil, o cancelamento e o reembolso integral são processados sem questionamentos. O risco é nosso.' },
  { q: 'Quais ferramentas estão disponíveis dentro da plataforma?', a: 'PDCA, DMAIC, A3, Ishikawa, 5 Porquês, FMEA, Matriz GUT, SIPOC, Fluxograma, 5W2H e Pareto — todas integradas e com saída automática em formato A3.' },
  { q: 'Os dados dos projetos da minha empresa são confidenciais?', a: 'Sim. Cada conta corporativa tem acesso isolado, com tratamento de dados conforme a LGPD. Nenhum dado de projeto é compartilhado entre clientes.' },
  { q: 'Quais formas de pagamento são aceitas?', a: 'Cartão de crédito, com cobrança mensal recorrente. O cancelamento pode ser feito a qualquer momento, sem multa contratual.' },
];

const OBJECTIONS = [
  { q: '"Já usamos planilhas, por que pagar por um software?"', a: 'Planilhas funcionam até o terceiro projeto simultâneo. A partir daí, viram um problema maior do que o que tentam resolver. O Plannr custa menos do que uma hora de trabalho do seu Black Belt por mês.' },
  { q: '"Meu time não vai adotar essa ferramenta."', a: 'Foi exatamente por isso que o Plannr foi desenhado com fluxos guiados. O usuário não precisa decorar a metodologia — a plataforma conduz o preenchimento etapa por etapa.' },
  { q: '"Não temos tempo para implementar mais uma ferramenta."', a: 'A implementação do Plannr não exige projeto de TI. É acesso web, cadastro do time e início imediato. Os primeiros projetos podem ser cadastrados no mesmo dia em que sua empresa assina.' },
  { q: '"Já tentei outros sistemas e ninguém usou."', a: 'A diferença está no escopo. Sistemas genéricos exigem que sua equipe adapte a metodologia ao software. O Plannr foi construído por e para profissionais de melhoria contínua — a metodologia já está nele.' },
];

/* ─── Sub-components ────────────────────────────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E5E5E5]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start justify-between py-5 text-left gap-6">
        <span className="text-sm font-medium text-[#111111] leading-snug">{q}</span>
        {open
          ? <ChevronUp size={16} className="shrink-0 text-[#888888] mt-0.5" />
          : <ChevronDown size={16} className="shrink-0 text-[#888888] mt-0.5" />}
      </button>
      {open && <p className="pb-5 text-sm text-[#555555] leading-relaxed">{a}</p>}
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-b from-transparent via-black/5 to-black/10 rounded-2xl blur-xl -z-10" />
      <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.18)] overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F5F5] border-b border-[#E5E5E5]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#DDDDDD]" />
            <div className="w-3 h-3 rounded-full bg-[#DDDDDD]" />
            <div className="w-3 h-3 rounded-full bg-[#DDDDDD]" />
          </div>
          <div className="flex-1 mx-4 h-6 bg-white border border-[#E5E5E5] rounded flex items-center px-3 max-w-xs">
            <span className="text-[10px] text-[#888888] truncate">app.plannr.com.br/projetos/red-refugo</span>
          </div>
        </div>

        {/* App shell */}
        <div className="flex h-[380px] sm:h-[420px]">
          {/* Sidebar */}
          <div className="w-36 sm:w-44 bg-[#111111] flex flex-col shrink-0">
            <div className="flex items-center gap-2 px-3 py-3.5 border-b border-white/10">
              <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center shrink-0">
                <span className="text-[9px] font-black text-[#111111]">P</span>
              </div>
              <span className="text-[11px] font-bold text-white tracking-tight">Plannr</span>
            </div>
            <div className="px-2 py-2 space-y-0.5">
              {[
                { label: 'Dashboard', active: false },
                { label: 'Projetos', active: true },
                { label: 'Kanban', active: false },
                { label: 'Timeline', active: false },
                { label: 'Relatórios', active: false },
                { label: 'Equipe', active: false },
              ].map(({ label, active }) => (
                <div key={label} className={cn('px-2 py-1.5 text-[10px] rounded-sm cursor-default transition-colors', active ? 'bg-white/15 text-white font-semibold' : 'text-white/40 hover:text-white/60')}>
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-auto px-2 pb-3">
              <div className="px-2 py-2 border border-white/10 rounded-sm">
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Empresa</p>
                <p className="text-[10px] text-white/70 font-medium truncate">Metalúrgica Alfa S.A.</p>
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#FAFAFA]">
            {/* Project header */}
            <div className="px-4 py-3 bg-white border-b border-[#E5E5E5] flex items-center justify-between shrink-0">
              <div>
                <p className="text-[10px] text-[#888888] mb-0.5">Projetos / Redução de Refugo — Linha 3</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#111111]">DMAIC</span>
                  <span className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
                  <span className="text-[10px] text-[#D97706] font-semibold">Analyze</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 text-[10px] font-medium text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A]">Em andamento</div>
                <div className="px-2.5 py-1 text-[10px] font-semibold bg-[#111111] text-white cursor-default">Exportar A3</div>
              </div>
            </div>

            {/* Phase tabs */}
            <div className="flex items-center border-b border-[#E5E5E5] bg-white px-4 shrink-0">
              {[
                { label: 'Define', color: '#2563EB', done: true },
                { label: 'Measure', color: '#7C3AED', done: true },
                { label: 'Analyze', color: '#D97706', done: false },
                { label: 'Improve', color: '#16A34A', done: false },
                { label: 'Control', color: '#111111', done: false },
              ].map(({ label, color, done }) => (
                <div
                  key={label}
                  className={cn('flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-medium border-b-2 cursor-default',
                    label === 'Analyze' ? 'border-[#D97706]' : 'border-transparent',
                  )}
                  style={{ color: label === 'Analyze' ? color : done ? '#555555' : '#AAAAAA' }}
                >
                  {done && <CheckCircle2 size={9} style={{ color }} />}
                  {label}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 p-4 overflow-hidden">
              <div className="grid grid-cols-3 gap-3 h-full">
                {/* Left: KPIs */}
                <div className="col-span-1 flex flex-col gap-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-[#888888]">KPIs</p>
                  {[
                    { label: 'Taxa de Refugo', value: '4,2%', target: '< 1,0%', delta: '-1.8pp', color: '#D97706' },
                    { label: 'PPM', value: '42.000', target: '< 10.000', delta: '↓ 12%', color: '#16A34A' },
                    { label: 'Retrabalho', value: '11,3h', target: '< 4h', delta: '-2h', color: '#D97706' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white border border-[#E5E5E5] p-2.5">
                      <p className="text-[9px] text-[#888888] mb-1">{kpi.label}</p>
                      <p className="text-base font-black text-[#111111] leading-none mb-1">{kpi.value}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] text-[#888888]">Meta: {kpi.target}</p>
                        <p className="text-[8px] font-semibold" style={{ color: kpi.color }}>{kpi.delta}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Tool + Actions */}
                <div className="col-span-2 flex flex-col gap-2.5">
                  <div className="bg-white border border-[#E5E5E5] p-3 flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-[#888888]">Diagrama de Ishikawa</p>
                      <span className="text-[8px] text-[#D97706] border border-[#D97706]/30 px-1.5 py-0.5 bg-[#FFFBEB]">Em uso</span>
                    </div>
                    {/* Simplified fishbone */}
                    <div className="space-y-1.5">
                      {[
                        { cat: 'Máquina', causes: ['Desgaste da garra', 'Calibração desalinhada'] },
                        { cat: 'Método', causes: ['Setup fora do padrão', 'Instrução desatualizada'] },
                        { cat: 'Material', causes: ['Variação do fornecedor', 'Umidade no estoque'] },
                      ].map(({ cat, causes }) => (
                        <div key={cat} className="flex items-start gap-2">
                          <span className="text-[8px] font-bold text-[#111111] w-14 shrink-0 pt-0.5">{cat}</span>
                          <div className="flex flex-wrap gap-1">
                            {causes.map((c) => (
                              <span key={c} className="text-[8px] px-1.5 py-0.5 bg-[#F5F5F5] text-[#555555] border border-[#E5E5E5]">{c}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E5E5E5] p-3">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#888888] mb-2">Ações abertas</p>
                    <div className="space-y-1.5">
                      {[
                        { title: 'Recalibrar fuso da célula 3B', owner: 'R. Oliveira', date: '12/05', status: 'DONE' },
                        { title: 'Atualizar IQ-034 com novo parâmetro', owner: 'M. Costa', date: '19/05', status: 'IN_PROGRESS' },
                        { title: 'Auditoria de recebimento com fornecedor', owner: 'A. Lima', date: '26/05', status: 'TODO' },
                      ].map((a) => (
                        <div key={a.title} className="flex items-center gap-2">
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                            a.status === 'DONE' ? 'bg-[#16A34A]' : a.status === 'IN_PROGRESS' ? 'bg-[#D97706]' : 'bg-[#DDDDDD]'
                          )} />
                          <p className={cn('text-[9px] flex-1 truncate', a.status === 'DONE' ? 'line-through text-[#AAAAAA]' : 'text-[#111111]')}>{a.title}</p>
                          <p className="text-[8px] text-[#888888] shrink-0">{a.owner}</p>
                          <p className="text-[8px] text-[#888888] shrink-0">{a.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-white text-[#111111] antialiased">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Image src="/logo-plannr.png" alt="Plannr" width={26} height={26} className="object-contain" />
            <span className="text-sm font-bold tracking-tight">Plannr</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[['#solucao', 'Produto'], ['#beneficios', 'Benefícios'], ['#preco', 'Preço'], ['#faq', 'FAQ']].map(([href, label]) => (
              <a key={label} href={href} className="text-sm text-[#555555] hover:text-[#111111] transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#555555] hover:text-[#111111] transition-colors px-3 py-2">Entrar</Link>
            <Link href="/register" className="px-4 py-2 bg-[#111111] text-white text-sm font-semibold hover:bg-[#333333] transition-colors">
              Começar agora
            </Link>
          </div>

          <button className="md:hidden p-2 text-[#555555]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#E5E5E5] bg-white px-6 py-4 space-y-3">
            {[['#solucao', 'Produto'], ['#beneficios', 'Benefícios'], ['#preco', 'Preço'], ['#faq', 'FAQ']].map(([href, label]) => (
              <a key={label} href={href} className="block text-sm text-[#555555]" onClick={() => setMobileOpen(false)}>{label}</a>
            ))}
            <div className="pt-3 flex flex-col gap-2 border-t border-[#E5E5E5]">
              <Link href="/login" className="text-sm text-center text-[#555555] py-2">Entrar</Link>
              <Link href="/register" className="text-sm text-center bg-[#111111] text-white py-3 font-semibold">Começar agora</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-20 pb-12 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#E5E5E5] text-xs text-[#555555] mb-10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0" />
            Mais de 100 empresas já estruturaram seus projetos com o Plannr
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[64px] font-black tracking-tight leading-[1.05] mb-7 text-[#111111]">
            A plataforma que centraliza<br className="hidden sm:block" /> toda a melhoria contínua<br className="hidden sm:block" /> da sua empresa.
          </h1>

          <p className="text-base sm:text-lg text-[#555555] max-w-2xl mx-auto mb-10 leading-relaxed">
            PDCA, DMAIC, A3, Ishikawa e 5 Porquês integrados em uma única ferramenta. Crie, acompanhe e arquive todos os projetos da sua equipe — com exportação automática em formato A3.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-[#111111] text-white text-sm font-bold hover:bg-[#333333] transition-colors w-full sm:w-auto justify-center"
            >
              Começar agora — 7 dias de garantia <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 border border-[#E5E5E5] text-[#555555] hover:border-[#111111] hover:text-[#111111] transition-colors text-sm font-medium w-full sm:w-auto text-center"
            >
              Já tenho conta — Entrar
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#888888]">
            {['Acesso imediato', 'R$ 109,90/mês por empresa', 'Cancele quando quiser'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-[#16A34A]" /> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16 px-2">
          <DashboardMockup />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#111111] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '+100', label: 'empresas usando o Plannr' },
            { value: '+1.500', label: 'profissionais ativos' },
            { value: '7 dias', label: 'de garantia incondicional' },
            { value: '< R$ 4/dia', label: 'para toda a equipe' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-white mb-1">{s.value}</p>
              <p className="text-xs text-white/40 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN ── */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-5">O problema</p>
            <h2 className="text-3xl font-black leading-tight text-[#111111] mb-6">
              Se você lidera operações, qualidade ou processos, provavelmente já passou por isso:
            </h2>
            <p className="text-sm text-[#555555] leading-relaxed mb-8">
              Esse é o custo invisível de operar sem uma plataforma única — e ele aparece nos KPIs que não melhoram.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-xs font-bold hover:bg-[#333333] transition-colors">
              Resolver isso agora <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {PAIN_POINTS.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-[#E5E5E5]">
                <div className="w-5 h-5 rounded-full border border-[#DC2626]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <X size={9} className="text-[#DC2626]" />
                </div>
                <p className="text-sm text-[#555555] leading-snug">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solucao" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-5">A solução</p>
            <h2 className="text-3xl font-black leading-tight text-[#111111] mb-5">
              O Plannr foi desenvolvido para empresas que tratam melhoria contínua como disciplina, não como projeto isolado.
            </h2>
            <p className="text-sm text-[#555555] leading-relaxed">
              Em um único ambiente, sua equipe estrutura projetos, acompanha o andamento em tempo real e arquiva o histórico completo de cada melhoria. E quando chega o momento de apresentar resultados à diretoria, o relatório A3 é gerado automaticamente — sem retrabalho. Sem versão desatualizada.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Estruture o projeto', body: 'Defina o problema, o escopo e a equipe com ferramentas guiadas — SIPOC, 5W2H, Fluxograma. Em qualquer metodologia: PDCA ou DMAIC.' },
              { step: '02', title: 'Execute com rastreabilidade', body: 'Cada ação tem responsável, prazo e status. O Kanban mantém o time alinhado e a plataforma sinaliza atrasos automaticamente.' },
              { step: '03', title: 'Exporte o A3 em um clique', body: 'O relatório é gerado com os dados que sua equipe já preencheu durante a execução — layout profissional, pronto para a diretoria.' },
            ].map((s) => (
              <div key={s.step} className="p-7 border border-[#E5E5E5] hover:border-[#111111] transition-colors group">
                <p className="text-5xl font-black text-[#F0F0F0] group-hover:text-[#E5E5E5] mb-5 transition-colors">{s.step}</p>
                <h3 className="text-sm font-bold text-[#111111] mb-2">{s.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section id="beneficios" className="py-24 px-6 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-5 text-center">Benefícios</p>
          <h2 className="text-3xl font-black text-center mb-14">O que muda na sua operação</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BENEFITS.map(({ Icon, title, body }) => (
              <div key={title} className="bg-white p-6 border border-[#E5E5E5] hover:border-[#111111] transition-colors group">
                <div className="w-9 h-9 border border-[#E5E5E5] group-hover:border-[#111111] flex items-center justify-center mb-5 transition-colors">
                  <Icon size={16} className="text-[#555555]" />
                </div>
                <h3 className="text-sm font-bold text-[#111111] mb-2">{title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OBJECTIONS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-5 text-center">Objeções comuns</p>
          <h2 className="text-3xl font-black text-center mb-12">Respostas diretas</h2>
          <div className="space-y-4">
            {OBJECTIONS.map((obj) => (
              <div key={obj.q} className="border border-[#E5E5E5] p-6 hover:border-[#AAAAAA] transition-colors">
                <p className="text-sm font-bold text-[#111111] mb-2 italic">{obj.q}</p>
                <p className="text-sm text-[#555555] leading-relaxed">{obj.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="preco" className="py-24 px-6 bg-[#111111]">
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5 text-center">Plano Empresa</p>
          <div className="text-center mb-10">
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-5xl font-black text-white">R$ 109,90</span>
              <span className="text-lg text-white/40 mb-1">/mês</span>
            </div>
            <p className="text-sm text-white/40">Menos de R$ 4 por dia para profissionalizar a gestão da melhoria contínua de toda a sua equipe.</p>
          </div>

          <div className="bg-white p-8 mb-4">
            <div className="space-y-3.5">
              {OFFER_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <CheckCircle2 size={14} className="text-[#16A34A] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#555555]">{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-[#E5E5E5]">
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#111111] text-white text-sm font-bold hover:bg-[#333333] transition-colors"
              >
                Assinar o Plannr <ArrowRight size={15} />
              </Link>
              <p className="text-center text-xs text-[#888888] mt-3">Cartão de crédito · Cancele quando quiser · 7 dias de garantia</p>
            </div>
          </div>

          <div className="border border-white/15 p-6">
            <p className="text-sm font-bold text-white mb-2">Garantia Incondicional de 7 Dias</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Se por qualquer motivo a plataforma não atender às expectativas da sua empresa, basta solicitar o cancelamento dentro do prazo de 7 dias e o valor integral é devolvido. Sem questionamentos. O risco é nosso. A decisão é sua.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-5 text-center">Dúvidas</p>
          <h2 className="text-3xl font-black text-center mb-12">Perguntas frequentes</h2>
          <div>
            {FAQ_ITEMS.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 bg-[#FAFAFA] border-t border-[#E5E5E5]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-[#111111] leading-tight mb-8">
            Sua empresa pode continuar gerenciando melhoria contínua em planilhas dispersas. Ou pode dar à sua equipe uma plataforma à altura da disciplina que ela já pratica.
          </h2>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#111111] text-white text-sm font-bold hover:bg-[#333333] transition-colors"
          >
            Assinar o Plannr — Plano Empresa <ArrowRight size={15} />
          </Link>
          <p className="text-xs text-[#888888] mt-4">R$ 109,90/mês · 7 dias de garantia incondicional · Acesso imediato para toda a equipe</p>

          <p className="mt-14 text-xs text-[#888888] max-w-xl mx-auto leading-relaxed italic border-t border-[#E5E5E5] pt-8">
            A diferença entre uma empresa que melhora ano após ano e uma que estagnou não está na metodologia — todas conhecem PDCA, DMAIC e Lean. A diferença está na disciplina de execução. E disciplina exige a ferramenta certa.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#E5E5E5] py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-plannr.png" alt="Plannr" width={20} height={20} className="object-contain" />
            <span className="text-sm font-bold">Plannr</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#888888]">
            <Link href="/login" className="hover:text-[#111111] transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-[#111111] transition-colors">Cadastrar</Link>
            <a href="#faq" className="hover:text-[#111111] transition-colors">FAQ</a>
            <a href="#preco" className="hover:text-[#111111] transition-colors">Preço</a>
          </div>
          <p className="text-xs text-[#888888]">© 2025 Plannr · LGPD compliant</p>
        </div>
      </footer>

    </div>
  );
}
