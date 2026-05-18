// LocalStorage-based API client — no backend required.
// All data persists in the browser's localStorage.
// To switch to real backend: replace this file with the HTTP version.

export class ApiError extends Error {
  constructor(public status: number, public code: string | number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function dbSet<T>(key: string, val: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(val));
}

function dbGet<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
}

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
function ts() { return new Date().toISOString(); }

// ─── Data layer ───────────────────────────────────────────────────────────────

const DB = {
  users:      () => dbGet<any[]>('pdca_users', []),
  orgs:       () => dbGet<any[]>('pdca_orgs', []),
  projects:   () => dbGet<any[]>('pdca_projects', []),
  phases:     () => dbGet<any[]>('pdca_phases', []),
  tools:      () => dbGet<any[]>('pdca_tools', []),
  tasks:      () => dbGet<any[]>('pdca_tasks', []),
  kpis:       () => dbGet<any[]>('pdca_kpis', []),
  milestones: () => dbGet<any[]>('pdca_milestones', []),
  knowledge:  () => dbGet<any[]>('pdca_knowledge', []),
  save: {
    users:      (d: any[]) => dbSet('pdca_users', d),
    orgs:       (d: any[]) => dbSet('pdca_orgs', d),
    projects:   (d: any[]) => dbSet('pdca_projects', d),
    phases:     (d: any[]) => dbSet('pdca_phases', d),
    tools:      (d: any[]) => dbSet('pdca_tools', d),
    tasks:      (d: any[]) => dbSet('pdca_tasks', d),
    kpis:       (d: any[]) => dbSet('pdca_kpis', d),
    milestones: (d: any[]) => dbSet('pdca_milestones', d),
    knowledge:  (d: any[]) => dbSet('pdca_knowledge', d),
  },
};

function currentUser() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('pdca_access_token');
  if (!token) return null;
  return DB.users().find((u) => u.id === token) ?? null;
}

function projectPhases(projectId: string) {
  return DB.phases().filter((p) => p.projectId === projectId);
}

function projectCompletion(projectId: string) {
  const phases = projectPhases(projectId);
  if (!phases.length) return 0;
  return Math.round(phases.reduce((s, p) => s + (p.completionPercentage || 0), 0) / phases.length);
}

function orgSequence(orgId: string) {
  const count = DB.projects().filter((p) => p.organizationId === orgId).length;
  return String(count + 1).padStart(3, '0');
}

function buildProjectSummary(p: any) {
  const owner = DB.users().find((u) => u.id === p.ownerId);
  return {
    ...p,
    ownerName: owner?.name ?? '—',
    completionPercentage: projectCompletion(p.id),
    taskCount: DB.tasks().filter((t) => t.projectId === p.id).length,
    memberCount: 1,
  };
}

function buildProjectDetail(p: any) {
  const owner = DB.users().find((u) => u.id === p.ownerId);
  const phases = projectPhases(p.id);
  const kpis = DB.kpis()
    .filter((k) => k.projectId === p.id)
    .map((kpi) => {
      const measurements: any[] = kpi.measurements || [];
      const current = measurements.length > 0 ? measurements[measurements.length - 1].value : kpi.baseline;
      return { ...kpi, current };
    });
  return {
    ...p,
    ownerName: owner?.name ?? '—',
    completionPercentage: projectCompletion(p.id),
    members: [],
    phases,
    kpis,
  };
}

function calcSpc(kpiId: string) {
  const kpi = DB.kpis().find((k) => k.id === kpiId);
  if (!kpi?.measurements || kpi.measurements.length < 2) return null;
  const vals: number[] = kpi.measurements.map((m: any) => Number(m.value));
  const mean = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
  const variance = vals.reduce((s: number, v: number) => s + Math.pow(v - mean, 2), 0) / vals.length;
  const stdDev = Math.sqrt(variance);
  const ucl = mean + 3 * stdDev;
  const lcl = mean - 3 * stdDev;
  const violations: any[] = [];
  const points = kpi.measurements.map((m: any, i: number) => {
    const v = Number(m.value);
    const isViolation = v > ucl || v < lcl;
    if (isViolation) violations.push({ index: i, type: 'beyond_3sigma' });
    return { date: m.date, value: v, isViolation };
  });
  return { mean, stdDev, ucl, lcl, violations, points };
}

// ─── URL pattern matcher ──────────────────────────────────────────────────────

function matchPattern(pattern: string, path: string): string[] | null {
  const pp = pattern.split('/');
  const tp = path.split('/');
  if (pp.length !== tp.length) return null;
  const out: string[] = [];
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) out.push(decodeURIComponent(tp[i]));
    else if (pp[i] !== tp[i]) return null;
  }
  return out;
}

// ─── Route table ──────────────────────────────────────────────────────────────

type Handler = (params: string[], body: any, query: Record<string, string>) => any;

const ROUTES: Array<{ method: string; pattern: string; fn: Handler }> = [

  // Auth
  { method: 'POST', pattern: '/auth/register', fn: (_, body) => {
    const users = DB.users();
    if (users.find((u) => u.email === body.email))
      throw new ApiError(409, 'EMAIL_TAKEN', 'E-mail já cadastrado');
    const org = { id: uid(), name: body.organizationName, slug: body.organizationName.toLowerCase().replace(/\s+/g, '-'), createdAt: ts() };
    const user = { id: uid(), name: body.name, email: body.email, password: body.password, role: 'ADMIN', organizationId: org.id, organizationName: org.name, isActive: true, createdAt: ts() };
    const orgs = DB.orgs(); orgs.push(org); DB.save.orgs(orgs);
    users.push(user); DB.save.users(users);
    if (typeof window !== 'undefined') localStorage.setItem('pdca_access_token', user.id);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: org.id, organizationName: org.name }, accessToken: user.id, refreshToken: uid() };
  }},

  { method: 'POST', pattern: '/auth/login', fn: (_, body) => {
    const user = DB.users().find((u) => u.email === body.email && u.password === body.password);
    if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos');
    const org = DB.orgs().find((o) => o.id === user.organizationId);
    if (typeof window !== 'undefined') localStorage.setItem('pdca_access_token', user.id);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId, organizationName: org?.name ?? '' }, accessToken: user.id, refreshToken: uid() };
  }},

  { method: 'GET', pattern: '/auth/me', fn: () => {
    const u = currentUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED', 'Não autenticado');
    const org = DB.orgs().find((o) => o.id === u.organizationId);
    return { id: u.id, name: u.name, email: u.email, role: u.role, organizationId: u.organizationId, organizationName: org?.name ?? '' };
  }},

  { method: 'POST', pattern: '/auth/logout', fn: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('pdca_access_token');
    return {};
  }},

  { method: 'POST', pattern: '/auth/refresh', fn: () => {
    const u = currentUser();
    return { accessToken: u?.id ?? '' };
  }},

  // Projects
  { method: 'GET', pattern: '/projects', fn: (_, __, query) => {
    const u = currentUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED', 'Não autenticado');
    let list = DB.projects().filter((p) => p.organizationId === u.organizationId);
    if (query.status) list = list.filter((p) => p.status === query.status);
    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    }
    list = list
      .map(buildProjectSummary)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const limit = parseInt(query.limit ?? '50');
    return { data: list.slice(0, limit), meta: { total: list.length, page: 1, limit } };
  }},

  { method: 'POST', pattern: '/projects', fn: (_, body) => {
    const u = currentUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED', 'Não autenticado');
    const project = {
      id: uid(),
      code: `PDCA-${new Date().getFullYear()}-${orgSequence(u.organizationId)}`,
      organizationId: u.organizationId,
      ownerId: u.id,
      name: body.name,
      description: body.description ?? null,
      methodology: body.methodology ?? 'PDCA',
      priority: body.priority ?? 'MEDIUM',
      status: 'ACTIVE',
      currentPhase: body.methodology === 'DMAIC' ? 'DEFINE' : 'PLAN',
      problemStatement: body.problemStatement ?? null,
      goals: body.goals ?? null,
      scope: body.scope ?? null,
      outOfScope: body.outOfScope ?? null,
      startDate: body.startDate ?? null,
      targetDate: body.targetDate ?? null,
      estimatedSavings: body.estimatedSavings ?? null,
      actualSavings: null,
      capexBudget: body.capexBudget ?? null,
      opexBudget: body.opexBudget ?? null,
      createdAt: ts(),
      updatedAt: ts(),
    };
    const projects = DB.projects(); projects.push(project); DB.save.projects(projects);
    const phases = DB.phases();
    const isDmaic = body.methodology === 'DMAIC';
    const phaseList = isDmaic
      ? ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL']
      : ['PLAN', 'DO', 'CHECK', 'ACT'];
    phaseList.forEach((phase, i) => {
      phases.push({ id: uid(), projectId: project.id, phase, status: i === 0 ? 'IN_PROGRESS' : 'NOT_STARTED', completionPercentage: 0, createdAt: ts() });
    });
    DB.save.phases(phases);
    return { id: project.id };
  }},

  { method: 'GET', pattern: '/projects/:id', fn: ([id]) => {
    const p = DB.projects().find((p) => p.id === id);
    if (!p) throw new ApiError(404, 'NOT_FOUND', 'Projeto não encontrado');
    return buildProjectDetail(p);
  }},

  { method: 'PUT', pattern: '/projects/:id', fn: ([id], body) => {
    const projects = DB.projects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx < 0) throw new ApiError(404, 'NOT_FOUND', 'Projeto não encontrado');
    projects[idx] = { ...projects[idx], ...body, updatedAt: ts() };
    DB.save.projects(projects);
    return buildProjectSummary(projects[idx]);
  }},

  // Milestones
  { method: 'GET', pattern: '/projects/:id/milestones', fn: ([id]) =>
    DB.milestones().filter((m) => m.projectId === id)
  },

  { method: 'POST', pattern: '/projects/:id/milestones', fn: ([id], body) => {
    const m = { id: uid(), projectId: id, status: 'PENDING', ...body, createdAt: ts() };
    const ms = DB.milestones(); ms.push(m); DB.save.milestones(ms);
    return m;
  }},

  // Tools
  { method: 'GET', pattern: '/projects/:id/tools', fn: ([id], __, query) => {
    let list = DB.tools().filter((t) => t.projectId === id);
    if (query.phase) list = list.filter((t) => t.phase === query.phase);
    return list;
  }},

  { method: 'GET', pattern: '/projects/:id/tools/:toolType', fn: ([id, toolType]) => {
    const t = DB.tools().find((t) => t.projectId === id && t.toolType === toolType);
    if (!t) throw new ApiError(404, 'NOT_FOUND', 'Não encontrado');
    return t;
  }},

  { method: 'DELETE', pattern: '/projects/:id', fn: ([id]) => {
    DB.save.projects(DB.projects().filter((p) => p.id !== id));
    DB.save.phases(DB.phases().filter((p) => p.projectId !== id));
    DB.save.tools(DB.tools().filter((t) => t.projectId !== id));
    DB.save.tasks(DB.tasks().filter((t) => t.projectId !== id));
    DB.save.kpis(DB.kpis().filter((k) => k.projectId !== id));
    DB.save.milestones(DB.milestones().filter((m) => m.projectId !== id));
    return {};
  }},

  { method: 'PUT', pattern: '/projects/:id/tools/:toolType', fn: ([id, toolType], body) => {
    const PDCA_PHASE_MAP: Record<string, string> = {
      FIVE_WHYS: 'PLAN', ISHIKAWA: 'PLAN', SWOT: 'PLAN',
      SIPOC: 'PLAN', PARETO: 'PLAN', FLOWCHART: 'PLAN',
      GUT_MATRIX: 'DO', FIVE_W2H: 'DO', FMEA: 'DO', KANBAN: 'DO',
      ACT_STANDARDIZATION: 'ACT',
    };
    const DMAIC_PHASE_MAP: Record<string, string> = {
      SIPOC: 'DEFINE', FLOWCHART: 'DEFINE', SWOT: 'DEFINE',
      PARETO: 'MEASURE',
      FIVE_WHYS: 'ANALYZE', ISHIKAWA: 'ANALYZE', FMEA: 'ANALYZE',
      GUT_MATRIX: 'IMPROVE', FIVE_W2H: 'IMPROVE', KANBAN: 'IMPROVE',
      ACT_STANDARDIZATION: 'CONTROL',
    };
    const proj = DB.projects().find((p) => p.id === id);
    const phaseMap = proj?.methodology === 'DMAIC' ? DMAIC_PHASE_MAP : PDCA_PHASE_MAP;
    const tools = DB.tools();
    const idx = tools.findIndex((t) => t.projectId === id && t.toolType === toolType);
    const item = { id: idx >= 0 ? tools[idx].id : uid(), projectId: id, toolType, phase: phaseMap[toolType] ?? 'PLAN', data: body.data, status: 'IN_PROGRESS', updatedAt: ts() };
    if (idx >= 0) tools[idx] = item; else tools.push(item);
    DB.save.tools(tools);
    return item;
  }},

  // Tasks
  { method: 'GET', pattern: '/projects/:id/tasks', fn: ([id]) => {
    const list = DB.tasks().filter((t) => t.projectId === id);
    return { data: list, meta: { total: list.length } };
  }},

  { method: 'POST', pattern: '/projects/:id/tasks', fn: ([id], body) => {
    const existing = DB.tasks().filter((t) => t.projectId === id && t.status === (body.status || 'BACKLOG'));
    const position = existing.reduce((max, t) => Math.max(max, t.position || 0), 0) + 1000;
    const task = { id: uid(), projectId: id, position, priority: 'MEDIUM', completionPercentage: 0, checklist: [], ...body, createdAt: ts(), updatedAt: ts() };
    const tasks = DB.tasks(); tasks.push(task); DB.save.tasks(tasks);
    return task;
  }},

  { method: 'GET', pattern: '/projects/:id/tasks/:taskId', fn: ([, taskId]) => {
    const t = DB.tasks().find((t) => t.id === taskId);
    if (!t) throw new ApiError(404, 'NOT_FOUND', 'Tarefa não encontrada');
    return t;
  }},

  { method: 'PUT', pattern: '/projects/:id/tasks/:taskId', fn: ([, taskId], body) => {
    const tasks = DB.tasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx < 0) throw new ApiError(404, 'NOT_FOUND', 'Tarefa não encontrada');
    const updated = { ...tasks[idx], ...body, updatedAt: ts() };
    if (body.status === 'DONE' && !updated.completedAt) updated.completedAt = ts();
    tasks[idx] = updated;
    DB.save.tasks(tasks);
    return updated;
  }},

  { method: 'DELETE', pattern: '/projects/:id/tasks/:taskId', fn: ([, taskId]) => {
    DB.save.tasks(DB.tasks().filter((t) => t.id !== taskId));
    return {};
  }},

  // KPIs
  { method: 'GET', pattern: '/projects/:id/kpis', fn: ([id]) => {
    const list = DB.kpis().filter((k) => k.projectId === id).map((kpi) => {
      const measurements: any[] = kpi.measurements || [];
      const current = measurements.length > 0 ? Number(measurements[measurements.length - 1].value) : kpi.baseline;
      const b = Number(kpi.baseline);
      const tgt = Number(kpi.target);
      const cur = Number(current);
      const progress = kpi.baseline != null && kpi.target != null && b !== tgt
        ? Math.round(((cur - b) / (tgt - b)) * 100)
        : null;
      const vals = measurements.map((m: any) => Number(m.value));
      const trend = vals.length >= 2
        ? vals[vals.length - 1] > vals[vals.length - 2] ? 'up' : vals[vals.length - 1] < vals[vals.length - 2] ? 'down' : 'stable'
        : 'stable';
      return { ...kpi, current, progress, trend, isOnTrack: progress != null ? progress >= 0 : null };
    });
    return { data: list, meta: { total: list.length } };
  }},

  { method: 'POST', pattern: '/projects/:id/kpis', fn: ([id], body) => {
    const kpi = { id: uid(), projectId: id, measurements: [], current: body.baseline ?? null, ...body, createdAt: ts(), updatedAt: ts() };
    const kpis = DB.kpis(); kpis.push(kpi); DB.save.kpis(kpis);
    return kpi;
  }},

  { method: 'PUT', pattern: '/projects/:id/kpis/:kpiId', fn: ([,, kpiId], body) => {
    const kpis = DB.kpis();
    const idx = kpis.findIndex((k) => k.id === kpiId);
    if (idx < 0) throw new ApiError(404, 'NOT_FOUND', 'KPI não encontrado');
    kpis[idx] = { ...kpis[idx], ...body, updatedAt: ts() };
    DB.save.kpis(kpis);
    return kpis[idx];
  }},

  { method: 'POST', pattern: '/projects/:id/kpis/:kpiId/measurements', fn: ([,, kpiId], body) => {
    const kpis = DB.kpis();
    const idx = kpis.findIndex((k) => k.id === kpiId);
    if (idx < 0) throw new ApiError(404, 'NOT_FOUND', 'KPI não encontrado');
    const m = { id: uid(), kpiId, value: Number(body.value), date: body.date ?? ts(), notes: body.notes ?? '', createdAt: ts() };
    kpis[idx] = { ...kpis[idx], measurements: [...(kpis[idx].measurements || []), m], current: m.value, updatedAt: ts() };
    DB.save.kpis(kpis);
    return m;
  }},

  { method: 'GET', pattern: '/projects/:id/kpis/:kpiId/spc', fn: ([,, kpiId]) => {
    const spc = calcSpc(kpiId);
    if (!spc) throw new ApiError(400, 'INSUFFICIENT_DATA', 'Mínimo 2 medições para SPC');
    return spc;
  }},

  // Knowledge
  { method: 'GET', pattern: '/knowledge', fn: () => ({
    data: DB.knowledge(), meta: { total: DB.knowledge().length }
  })},

  // Reports (offline stub)
  { method: 'POST', pattern: '/projects/:id/reports/a3', fn: () => ({
    url: '#', message: 'PDF disponível com backend. Modo offline: use Ctrl+P para imprimir.'
  })},
];

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function dispatch(method: string, rawPath: string, body: any, query: Record<string, string>): any {
  const path = rawPath.startsWith('/api') ? rawPath.slice(4) : rawPath;
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    const params = matchPattern(route.pattern, path);
    if (params === null) continue;
    return route.fn(params, body ?? {}, query);
  }
  throw new ApiError(404, 'NOT_FOUND', `Route not found: ${method} ${path}`);
}

async function request<T>(method: string, path: string, body?: any, query: Record<string, string> = {}): Promise<T> {
  await new Promise((r) => setTimeout(r, 60)); // natural feel
  try {
    return dispatch(method, path, body, query) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, 'INTERNAL_ERROR', String(err));
  }
}

// ─── Public API (identical interface to the HTTP version) ─────────────────────

export const api = {
  get: <T>(path: string, params?: Record<string, any>) => {
    const query: Record<string, string> = {};
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) query[k] = String(v); });
    return request<T>('GET', path, undefined, query);
  },
  post:   <T>(path: string, body?: any) => request<T>('POST', path, body),
  put:    <T>(path: string, body?: any) => request<T>('PUT', path, body),
  patch:  <T>(path: string, body?: any) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
