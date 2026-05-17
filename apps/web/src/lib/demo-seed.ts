// Demo seed — creates a complete example PDCA project in localStorage.
// Called when the user clicks "Carregar Projeto Demo" and no projects exist.

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function daysFromNow(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

function dbGet<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function dbSet<T>(key: string, val: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(val));
}

export function seedDemoProject(userId: string, orgId: string): string {
  const projId = uid();

  // ── Project ──────────────────────────────────────────────────────────────
  const project = {
    id: projId,
    code: 'PDCA-2026-001',
    organizationId: orgId,
    ownerId: userId,
    name: 'Redução de Lead Time na Expedição',
    description: 'Projeto de melhoria contínua para redução do lead time de expedição de 18 para 10 dias, eliminando multas contratuais e aumentando a satisfação dos clientes.',
    methodology: 'PDCA',
    priority: 'HIGH',
    status: 'ACTIVE',
    currentPhase: 'CHECK',
    problemStatement: 'O lead time médio da área de expedição está em 18 dias, muito acima do contratual de 12 dias. Isso gera multas de R$ 45.000/mês e risco de perda de contratos estratégicos no próximo renewal em setembro/2026.',
    goals: 'Reduzir o lead time de expedição de 18 para 10 dias até 30/09/2026, eliminando 80% das multas por atraso e aumentando o índice de entregas no prazo de 68% para 90%.',
    scope: 'Processo de expedição na planta de Guarulhos: emissão de NF, separação e carregamento.',
    outOfScope: 'Processo produtivo, gestão de compras e fornecedores externos.',
    startDate: daysAgo(120),
    targetDate: daysFromNow(135),
    estimatedSavings: 432000,
    actualSavings: 198000,
    estimatedRoi: 2.4,
    capexBudget: 85000,
    opexBudget: 24000,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(2),
  };

  const projects = dbGet<any[]>('pdca_projects', []);
  projects.push(project);
  dbSet('pdca_projects', projects);

  // ── Phases ───────────────────────────────────────────────────────────────
  const phases = dbGet<any[]>('pdca_phases', []);
  phases.push(
    { id: uid(), projectId: projId, phase: 'PLAN', status: 'COMPLETED', completionPercentage: 100, createdAt: daysAgo(120) },
    { id: uid(), projectId: projId, phase: 'DO',   status: 'COMPLETED', completionPercentage: 100, createdAt: daysAgo(90) },
    { id: uid(), projectId: projId, phase: 'CHECK',status: 'IN_PROGRESS', completionPercentage: 65, createdAt: daysAgo(45) },
    { id: uid(), projectId: projId, phase: 'ACT',  status: 'NOT_STARTED', completionPercentage: 0,  createdAt: daysAgo(45) },
  );
  dbSet('pdca_phases', phases);

  // ── Tools ────────────────────────────────────────────────────────────────
  const tools = dbGet<any[]>('pdca_tools', []);

  // 5 Whys
  tools.push({
    id: uid(), projectId: projId, toolType: 'FIVE_WHYS', phase: 'PLAN', status: 'DONE', updatedAt: daysAgo(105),
    data: {
      problem: 'Lead time de expedição está em 18 dias (meta: 12 dias)',
      whys: [
        'A emissão da Nota Fiscal leva em média 3 dias a mais que o previsto',
        'O sistema ERP não está integrado com o módulo fiscal para emissão automática de NF',
        'A integração foi planejada na migração de ERP de 2024, mas o módulo fiscal não foi incluído no escopo final',
        'O gerente de TI retirou o módulo do escopo para cumprir o prazo de go-live, sem validar com a área de expedição',
        'Não havia critérios formais de aceite definidos pelo usuário final no projeto de migração de ERP',
      ],
      rootCause: 'Ausência de critérios formais de aceite pelos usuários finais em projetos de TI, permitindo que funcionalidades críticas sejam removidas do escopo sem impacto visível até a operação.',
      containment: 'Criar SOP emergencial: aprovação manual de NF pelo supervisor em até 4h. Prazo: implementado.',
    },
  });

  // Ishikawa
  tools.push({
    id: uid(), projectId: projId, toolType: 'ISHIKAWA', phase: 'PLAN', status: 'DONE', updatedAt: daysAgo(100),
    data: {
      effect: 'Lead time de expedição elevado (18 dias vs. meta de 12 dias)',
      categories: {
        Method: ['Falta de SOP atualizado para emissão de NF', 'Processo de carregamento sem sequenciamento', 'Aprovação de documentos via e-mail (não sistematizado)'],
        Machine: ['ERP sem integração com módulo fiscal', 'Impressoras de etiquetas com falha frequente (2x/semana)', 'Balança de conferência descalibrada'],
        Material: ['Documentação incompleta dos fornecedores na entrada de NF', 'Etiquetas de envio com dados incorretos', 'Embalagens inadequadas para tipo de carga'],
        Manpower: ['Turnover de 28% no setor de expedição em 2025', 'Apenas 1 operador habilitado a emitir NF por turno', 'Treinamento inexistente para novos colaboradores'],
        Measurement: ['Lead time não monitorado diariamente', 'KPIs de expedição não acompanhados em reunião diária', 'Métrica de "entrega no prazo" não calculada por cliente'],
        Environment: ['Layout do armazém não otimizado — área de separação distante da doca', 'Fluxo físico de mercadoria não sinalizado', 'Temperatura inadequada causa re-trabalho em produtos sensíveis'],
      },
    },
  });

  // GUT Matrix
  tools.push({
    id: uid(), projectId: projId, toolType: 'GUT_MATRIX', phase: 'PLAN', status: 'DONE', updatedAt: daysAgo(98),
    data: {
      problems: [
        { id: uid(), description: 'Falta de integração ERP-Fiscal (emissão manual de NF)', gravity: 5, urgency: 5, tendency: 5, score: 125 },
        { id: uid(), description: 'Apenas 1 operador habilitado por turno para emitir NF', gravity: 5, urgency: 4, tendency: 4, score: 80 },
        { id: uid(), description: 'Layout inadequado do armazém', gravity: 4, urgency: 3, tendency: 4, score: 48 },
        { id: uid(), description: 'Falta de SOP e padronização do processo', gravity: 4, urgency: 4, tendency: 3, score: 48 },
        { id: uid(), description: 'Alto turnover no setor de expedição', gravity: 3, urgency: 3, tendency: 4, score: 36 },
        { id: uid(), description: 'Impressoras de etiquetas com falha frequente', gravity: 3, urgency: 3, tendency: 2, score: 18 },
        { id: uid(), description: 'Documentação incompleta de fornecedores', gravity: 2, urgency: 3, tendency: 3, score: 18 },
      ],
    },
  });

  // SWOT
  tools.push({
    id: uid(), projectId: projId, toolType: 'SWOT', phase: 'PLAN', status: 'DONE', updatedAt: daysAgo(95),
    data: {
      strengths: ['Equipe operacional comprometida e motivada com o projeto', 'Histórico de dados disponíveis (últimos 18 meses)', 'Apoio da diretoria e patrocínio do VP de Operações', 'Parceria sólida com área de TI para integração do ERP'],
      weaknesses: ['ERP sem integração com módulo fiscal — processo manual', 'Falta de SOPs documentados e atualizados', 'Alto índice de turnover na equipe de expedição (28%)', 'Ausência de indicadores monitorados em tempo real'],
      opportunities: ['Novo módulo fiscal do ERP em fase de testes (go-live previsto para Q2/2026)', 'Renovação contratual em set/2026 — melhora na entrega pode aumentar receita em 15%', 'Implementação de WMS planejada para 2027 — este projeto cria a base de dados necessária'],
      threats: ['Prazo contratual rígido — multas aumentam progressivamente após 90 dias de atraso', 'Concorrentes já operam com lead time de 8-10 dias', 'Risco de perda de 3 contratos estratégicos no renewal de setembro'],
    },
  });

  // SIPOC
  tools.push({
    id: uid(), projectId: projId, toolType: 'SIPOC', phase: 'PLAN', status: 'DONE', updatedAt: daysAgo(92),
    data: {
      rows: [
        { id: uid(), suppliers: 'Área de Produção', inputs: 'Produto acabado + Ordem de expedição', process: 'Recebimento e conferência do produto', outputs: 'Produto conferido e registrado no sistema', customers: 'Separação/Picking' },
        { id: uid(), suppliers: 'Sistema ERP', inputs: 'Pedido de venda aprovado', process: 'Emissão de NF e documentação fiscal', outputs: 'NF emitida e DANFE impresso', customers: 'Carregamento' },
        { id: uid(), suppliers: 'Separação', inputs: 'NF emitida + produto separado', process: 'Carregamento no veículo', outputs: 'Carga carregada e lacrada', customers: 'Transportadora' },
        { id: uid(), suppliers: 'Transportadora', inputs: 'Carga + documentação', process: 'Entrega ao cliente final', process_steps: 'Rastreamento + entrega + coleta de assinatura', outputs: 'Comprovante de entrega (POD)', customers: 'Cliente Final' },
      ],
    },
  });

  // 5W2H
  tools.push({
    id: uid(), projectId: projId, toolType: 'FIVE_W2H', phase: 'PLAN', status: 'DONE', updatedAt: daysAgo(90),
    data: {
      actions: [
        { id: uid(), what: 'Integrar ERP com módulo fiscal para emissão automática de NF', why: 'Eliminar o principal gargalo: emissão manual leva 3 dias a mais', where: 'Setor de TI + Expedição, planta Guarulhos', when: daysFromNow(-80), who: 'Lucas Mendes (TI) + Ana Paula (Expedição)', how: 'Configuração do módulo SAP FI integrado ao SD com aprovação automática para pedidos até R$ 50k', howMuch: 'R$ 65.000 (CAPEX)' },
        { id: uid(), what: 'Treinar 4 operadores adicionais para emissão de NF', why: 'Eliminar gargalo de pessoa única — risco operacional e de turnover', where: 'Sala de treinamento + ERP em ambiente de homologação', when: daysFromNow(-60), who: 'RH + Supervisor de Expedição (Carlos Lima)', how: 'Treinamento ERP (8h) + simulação de emissão + certificação interna', howMuch: 'R$ 8.000 (OPEX — horas de treinador + material)' },
        { id: uid(), what: 'Redesenhar layout do armazém — área de separação próxima à doca', why: 'Reduzir distância percorrida em 60% e eliminar cruzamento de fluxos', where: 'Armazém planta Guarulhos', when: daysFromNow(-30), who: 'Rodrigo Faria (Engenharia) + Equipe de Expedição', how: 'Reposicionamento de prateleiras, demarcação de piso, sinalização visual', howMuch: 'R$ 12.000 (CAPEX)' },
        { id: uid(), what: 'Criar SOP de expedição e implantar reunião diária de indicadores', why: 'Padronizar o processo e tornar desvios visíveis em tempo real', where: 'Expedição — quadro de gestão visual na entrada do armazém', when: daysFromNow(15), who: 'Ana Paula (Expedição) + Lean Specialist', how: 'Documentar SOP no sistema de qualidade ISO + reunião 7h15 com quadro físico (lead time, entregas dia)', howMuch: 'R$ 4.000 (OPEX — design + impressão de quadro)' },
      ],
    },
  });

  // ACT Standardization
  tools.push({
    id: uid(), projectId: projId, toolType: 'ACT_STANDARDIZATION', phase: 'ACT', status: 'IN_PROGRESS', updatedAt: daysAgo(10),
    data: {
      standardizations: [
        { id: uid(), type: 'SOP', title: 'SOP-EXP-001: Emissão de NF via ERP', status: 'DRAFT', responsible: 'Ana Paula Silva', reviewDate: daysFromNow(20), version: '1.0' },
        { id: uid(), type: 'TRAINING', title: 'Treinamento ERP para emissão de NF — módulo SD/FI', status: 'APPROVED', responsible: 'Carlos Lima', reviewDate: daysFromNow(30), version: '1.0' },
        { id: uid(), type: 'AUDIT', title: 'Auditoria mensal de lead time por transportadora', status: 'DRAFT', responsible: 'Rodrigo Faria', reviewDate: daysFromNow(45), version: '1.0' },
      ],
      lessonsLearned: [
        { id: uid(), title: 'Critérios de aceite em projetos de TI são críticos', description: 'A ausência de critérios formais de aceite pelo usuário final na migração de ERP 2024 resultou em um módulo essencial (NF) fora do escopo. Em futuros projetos de TI, o responsável operacional DEVE validar e assinar os critérios de aceite antes do kick-off.', category: 'PROCESS', impact: 'HIGH', author: 'Ana Paula Silva' },
        { id: uid(), title: 'Treinamento cruzado previne gargalos de pessoa única', description: 'Depender de um único operador para emissão de NF criou risco operacional grave. A política de "no mínimo 3 operadores certificados por função crítica" deve ser adotada como padrão em todas as áreas.', category: 'PEOPLE', impact: 'HIGH', author: 'Carlos Lima' },
        { id: uid(), title: 'Gestão visual acelera identificação de desvios', description: 'A implantação do quadro de gestão visual com reunião diária de 15 min reduziu o tempo de resposta a desvios de 3 dias para 4 horas. Simples e de baixo custo — replicar para outras áreas.', category: 'TOOL', impact: 'MEDIUM', author: 'Rodrigo Faria' },
      ],
    },
  });

  // ── Tasks ────────────────────────────────────────────────────────────────
  const tasks = dbGet<any[]>('pdca_tasks', []);
  const taskDefs = [
    { title: 'Mapear o processo atual de expedição (AS-IS)', status: 'DONE', priority: 'HIGH', assignee: 'Ana Paula Silva', checklist: [{ id: uid(), text: 'Entrevistar operadores', done: true }, { id: uid(), text: 'Cronometrar cada etapa', done: true }, { id: uid(), text: 'Registrar no fluxograma', done: true }] },
    { title: 'Integrar ERP com módulo fiscal (NF automática)', status: 'DONE', priority: 'CRITICAL', assignee: 'Lucas Mendes', checklist: [{ id: uid(), text: 'Levantar requisitos com fiscal', done: true }, { id: uid(), text: 'Configurar integração SAP FI/SD', done: true }, { id: uid(), text: 'Homologar com usuários', done: true }, { id: uid(), text: 'Go-live e monitoramento', done: true }] },
    { title: 'Treinar 4 operadores para emissão de NF', status: 'DONE', priority: 'HIGH', assignee: 'Carlos Lima', checklist: [{ id: uid(), text: 'Agendar sala + ERP homologação', done: true }, { id: uid(), text: 'Conduzir treinamento (8h)', done: true }, { id: uid(), text: 'Aplicar avaliação prática', done: true }] },
    { title: 'Redesenhar layout do armazém', status: 'DONE', priority: 'MEDIUM', assignee: 'Rodrigo Faria', checklist: [{ id: uid(), text: 'Elaborar planta proposta', done: true }, { id: uid(), text: 'Aprovar com segurança', done: true }, { id: uid(), text: 'Executar movimentação de prateleiras', done: true }] },
    { title: 'Criar SOP-EXP-001 (emissão de NF)', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Ana Paula Silva', checklist: [{ id: uid(), text: 'Rascunho do SOP', done: true }, { id: uid(), text: 'Revisão com equipe', done: false }, { id: uid(), text: 'Aprovação na qualidade', done: false }] },
    { title: 'Implantar reunião diária + quadro de gestão visual', status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'Ana Paula Silva', checklist: [{ id: uid(), text: 'Definir indicadores do quadro', done: true }, { id: uid(), text: 'Instalar quadro no armazém', done: false }, { id: uid(), text: 'Conduzir 1ª reunião piloto', done: false }] },
    { title: 'Auditar processo com lead time ≤ 10 dias', status: 'TODO', priority: 'MEDIUM', assignee: 'Rodrigo Faria', checklist: [] },
    { title: 'Apresentar resultados finais à diretoria', status: 'TODO', priority: 'HIGH', assignee: 'Carlos Lima', checklist: [] },
    { title: 'Submeter projeto ao banco de projetos corporativos', status: 'BACKLOG', priority: 'LOW', assignee: 'Ana Paula Silva', checklist: [] },
  ];

  taskDefs.forEach((def, i) => {
    tasks.push({
      id: uid(),
      projectId: projId,
      position: (i + 1) * 1000,
      title: def.title,
      status: def.status,
      priority: def.priority,
      assigneeName: def.assignee,
      checklist: def.checklist,
      completionPercentage: def.status === 'DONE' ? 100 : def.status === 'IN_PROGRESS' ? 50 : 0,
      createdAt: daysAgo(110 - i * 5),
      updatedAt: daysAgo(Math.max(1, 30 - i * 3)),
      ...(def.status === 'DONE' ? { completedAt: daysAgo(30 - i * 2) } : {}),
    });
  });
  dbSet('pdca_tasks', tasks);

  // ── KPIs + Measurements ─────────────────────────────────────────────────
  const kpis = dbGet<any[]>('pdca_kpis', []);

  // KPI 1 — Lead Time (dias)
  const kpi1Id = uid();
  const ltMeasurements = [18,17.5,18,16.5,15,15.5,14,13.5,14,12.5,13,11.5,12,11,10.5,11,10,10,9.5,10].map((v, i) => ({
    id: uid(), kpiId: kpi1Id,
    value: v, date: daysAgo(95 - i * 4.5), notes: '',
    createdAt: daysAgo(95 - i * 4.5),
  }));
  kpis.push({
    id: kpi1Id, projectId: projId,
    name: 'Lead Time de Expedição', unit: 'dias', direction: 'DOWN',
    baseline: 18, target: 10, current: 10,
    measurements: ltMeasurements,
    createdAt: daysAgo(115), updatedAt: daysAgo(1),
  });

  // KPI 2 — Entregas no prazo (%)
  const kpi2Id = uid();
  const onTimeMeasurements = [68,70,71,74,76,78,81,84,86,88].map((v, i) => ({
    id: uid(), kpiId: kpi2Id,
    value: v, date: daysAgo(90 - i * 9), notes: '',
    createdAt: daysAgo(90 - i * 9),
  }));
  kpis.push({
    id: kpi2Id, projectId: projId,
    name: 'Entregas no Prazo', unit: '%', direction: 'UP',
    baseline: 68, target: 90, current: 88,
    measurements: onTimeMeasurements,
    createdAt: daysAgo(115), updatedAt: daysAgo(5),
  });

  // KPI 3 — Custo de multas (R$ mil)
  const kpi3Id = uid();
  const finesMeasurements = [45,42,38,33,28,22,16,12,9,8].map((v, i) => ({
    id: uid(), kpiId: kpi3Id,
    value: v, date: daysAgo(90 - i * 9), notes: '',
    createdAt: daysAgo(90 - i * 9),
  }));
  kpis.push({
    id: kpi3Id, projectId: projId,
    name: 'Custo de Multas por Atraso', unit: 'R$ mil', direction: 'DOWN',
    baseline: 45, target: 9, current: 8,
    measurements: finesMeasurements,
    createdAt: daysAgo(115), updatedAt: daysAgo(5),
  });

  // KPI 4 — Operadores certificados (NF)
  const kpi4Id = uid();
  const certMeasurements = [1,1,2,2,3,4,5].map((v, i) => ({
    id: uid(), kpiId: kpi4Id,
    value: v, date: daysAgo(60 - i * 8), notes: '',
    createdAt: daysAgo(60 - i * 8),
  }));
  kpis.push({
    id: kpi4Id, projectId: projId,
    name: 'Operadores Certificados (NF)', unit: 'pessoas', direction: 'UP',
    baseline: 1, target: 5, current: 5,
    measurements: certMeasurements,
    createdAt: daysAgo(115), updatedAt: daysAgo(10),
  });

  dbSet('pdca_kpis', kpis);

  // ── Milestones ───────────────────────────────────────────────────────────
  const milestones = dbGet<any[]>('pdca_milestones', []);
  const milestoneDefs = [
    { title: 'Diagnóstico e Mapeamento AS-IS concluído', status: 'COMPLETED', date: daysAgo(100) },
    { title: 'Integração ERP-Fiscal implementada e validada', status: 'COMPLETED', date: daysAgo(75) },
    { title: 'Treinamento de operadores concluído', status: 'COMPLETED', date: daysAgo(55) },
    { title: 'Redesign de layout implementado', status: 'COMPLETED', date: daysAgo(35) },
    { title: 'Meta de lead time ≤ 10 dias atingida', status: 'COMPLETED', date: daysAgo(7) },
    { title: 'SOPs aprovados e publicados no sistema de qualidade', status: 'IN_PROGRESS', date: daysFromNow(20) },
    { title: 'Gestão visual implantada e reunião diária estabilizada', status: 'PENDING', date: daysFromNow(35) },
    { title: 'Apresentação de resultados à diretoria', status: 'PENDING', date: daysFromNow(50) },
    { title: 'Encerramento formal e transferência para rotina', status: 'PENDING', date: daysFromNow(75) },
  ];
  milestoneDefs.forEach((def) => {
    milestones.push({ id: uid(), projectId: projId, ...def, createdAt: daysAgo(119) });
  });
  dbSet('pdca_milestones', milestones);

  // ── Knowledge articles ───────────────────────────────────────────────────
  const knowledge = dbGet<any[]>('pdca_knowledge', []);
  knowledge.push(
    {
      id: uid(), organizationId: orgId,
      title: 'Como reduzir lead time em operações logísticas',
      content: 'O lead time logístico é composto por diversas etapas que, quando mapeadas e monitoradas individualmente, revelam os principais gargalos. As melhores práticas incluem: integração de sistemas (ERP-WMS), gestão visual em tempo real, multifuncionalidade da equipe e revisão periódica de layout.',
      tags: ['lead-time', 'logística', 'expedição', 'PDCA'],
      category: 'LOGISTICS', views: 38, author: 'Ana Paula Silva',
      createdAt: daysAgo(20), updatedAt: daysAgo(5),
    },
    {
      id: uid(), organizationId: orgId,
      title: '5 Whys: guia prático para análise de causa raiz',
      content: 'O método dos 5 Porquês é uma técnica de análise de causa raiz desenvolvida por Taiichi Ohno na Toyota. O objetivo é chegar à causa sistêmica de um problema perguntando "por quê?" repetidamente. Dica: a causa raiz geralmente envolve um processo, sistema ou política — não uma pessoa.',
      tags: ['5-whys', 'causa-raiz', 'lean', 'análise'],
      category: 'TOOLS', views: 74, author: 'Carlos Lima',
      createdAt: daysAgo(45), updatedAt: daysAgo(15),
    },
    {
      id: uid(), organizationId: orgId,
      title: 'Gráfico de Controle (SPC/CEP): interpretação de sinais de processo instável',
      content: 'O Gráfico de Controle distingue variação natural (causa comum) de variação especial (causa especial). Pontos fora dos limites UCL/LCL indicam causa especial — investigue imediatamente. Os 8 testes de Nelson ajudam a identificar padrões que sugerem instabilidade mesmo sem pontos fora dos limites.',
      tags: ['SPC', 'CEP', 'qualidade', 'estatística', 'controle'],
      category: 'QUALITY', views: 52, author: 'Rodrigo Faria',
      createdAt: daysAgo(60), updatedAt: daysAgo(20),
    },
    {
      id: uid(), organizationId: orgId,
      title: 'Matriz GUT: priorização objetiva de problemas',
      content: 'A Matriz GUT prioriza problemas com base em três critérios: Gravidade (impacto se nada for feito), Urgência (prazo para ação) e Tendência (piora com o tempo). Score = G × U × T. Escala 1-5 para cada critério, resultando em scores de 1 a 125. Problemas com score ≥ 75 são prioridade crítica.',
      tags: ['GUT', 'priorização', 'ferramentas', 'lean'],
      category: 'TOOLS', views: 91, author: 'Carlos Lima',
      createdAt: daysAgo(80), updatedAt: daysAgo(30),
    },
  );
  dbSet('pdca_knowledge', knowledge);

  return projId;
}
