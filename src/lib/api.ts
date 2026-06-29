/**
 * API client for the Backero Viral Video Production backend (FastAPI).
 *
 * Base URL comes from the VITE_API_URL env var, falling back to localhost:8000
 * for local development (see backend/start.sh / start.bat — the backend
 * always runs on port 8000 by default).
 */

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, opts);
  } catch (err) {
    throw new ApiError(
      0,
      `Could not reach the backend at ${API_BASE_URL}. Is it running? (npm/uvicorn start.sh / start.bat)`
    );
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && data && typeof data === 'object' && 'detail' in data
        ? String((data as Record<string, unknown>).detail)
        : null) || `Request failed: ${method} ${path} (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

/* ------------------------------------------------------------------ */
/*  Health                                                              */
/* ------------------------------------------------------------------ */

export const health = {
  check: () => get<{ status: string; service: string; db: string }>('/health'),
};

/* ------------------------------------------------------------------ */
/*  Dashboard / Briefs                                                  */
/* ------------------------------------------------------------------ */

export interface BriefListItem {
  id: string;
  title: string;
  current_phase: number;
  status: string;
  creator_name?: string | null;
  creator_initials?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MetricsResponse {
  total_videos: number;
  in_progress: { total: number; by_phase: Record<string, number> };
  pending_approvals: { total: number; by_role: Record<string, number> };
  recent_activity: { id: string; name: string; phase: number; updated_at: string }[];
}

export interface PipelineBrief {
  id: string;
  name: string;
  creator_initials?: string | null;
}

export interface PipelineResponse {
  phases: { phase: number; count: number; briefs: PipelineBrief[] }[];
}

export interface CreateBriefRequest {
  title: string;
  creator_name: string;
  creator_initials: string;
  on_camera_actor?: string;
  brand_company?: string;
}

export const dashboard = {
  metrics: (dateRangeDays = 30) =>
    get<MetricsResponse>(`/api/dashboard/metrics?date_range=${dateRangeDays}`),
  pipeline: () => get<PipelineResponse>('/api/dashboard/pipeline'),
  listBriefs: (opts: { dateRange?: number; page?: number; limit?: number; status?: string; phase?: number } = {}) => {
    const params = new URLSearchParams();
    if (opts.dateRange !== undefined) params.set('date_range', String(opts.dateRange));
    if (opts.page !== undefined) params.set('page', String(opts.page));
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts.status) params.set('status', opts.status);
    if (opts.phase !== undefined) params.set('phase', String(opts.phase));
    return get<{ briefs: BriefListItem[]; total: number; page: number; limit: number }>(
      `/api/dashboard/briefs?${params.toString()}`
    );
  },
  createBrief: (req: CreateBriefRequest) =>
    post<{ success: boolean; brief_id: string; brief: BriefListItem }>('/api/dashboard/briefs', req),
  updateBrief: (briefId: string, req: Record<string, unknown>) =>
    patch<{ success: boolean; brief: BriefListItem }>(`/api/dashboard/briefs/${briefId}`, req),
  deleteBrief: (briefId: string, hard = false) =>
    del<{ success: boolean }>(`/api/dashboard/briefs/${briefId}?hard=${hard}`),
};

/* ------------------------------------------------------------------ */
/*  Phase 1                                                             */
/* ------------------------------------------------------------------ */

export interface KnowledgeNugget {
  type: string;
  text: string;
  source?: string;
  rationale?: string;
  color?: string;
}

export interface Phase1Payload {
  platform?: string | null;
  niche?: string | null;
  sub_niche?: string | null;
  topic?: string | null;
  viral_reference_url?: string | null;
  copy_elements?: string[] | null;
  time_to_value?: string | null;
  content_style?: string | null;
  hook_text?: string | null;
  knowledge_nuggets?: KnowledgeNugget[] | null;
  blacklist_words?: string[] | null;
  ai_generated?: boolean;
  batch_id?: string | null;
  production_date?: string | null;
  on_camera_actor?: string | null;
  brand_company?: string | null;
  reference_description?: string | null;
  selected_nugget_index?: number | null;
  nugget_rationale?: string | null;
  language?: string | null;
  content_creator?: string | null;
  number_of_actors?: number | null;
  aspect_ratio?: string | null;
  estimated_length?: string | null;
  actor_brief?: string | null;
}

export const phase1 = {
  get: (briefId: string) => get<{ success: boolean; data: Phase1Payload }>(`/api/phase1/${briefId}`),
  save: (briefId: string, data: Phase1Payload) =>
    post<{ success: boolean; data: Phase1Payload }>(`/api/phase1/${briefId}`, data),
  patch: (briefId: string, data: Partial<Phase1Payload>) =>
    patch<{ success: boolean; data: Phase1Payload }>(`/api/phase1/${briefId}`, data),
  advance: (briefId: string, data?: Phase1Payload) =>
    post<{ success: boolean; next_phase: number }>(`/api/phase1/${briefId}/advance`, data),
  validateHook: (briefId: string, hookText: string) =>
    post<{ valid: boolean; score: number; issues: string[]; suggestions: string[] }>(
      `/api/phase1/${briefId}/validate-hook`,
      { hook_text: hookText }
    ),
  extractNuggets: (briefId: string, topic: string, researchText = '') =>
    post<{ success: boolean; nuggets: KnowledgeNugget[] }>(`/api/phase1/${briefId}/extract-nuggets`, {
      topic,
      research_text: researchText,
    }),
  subNiches: (niche: string) => get<{ niche: string; sub_niches: string[] }>(`/api/phase1/sub-niches/${niche}`),
  fluffExamples: (briefId: string, niche: string, topic = '', language = 'EN') =>
    post<{ success: boolean; examples: { fluff: string; specific: string }[] }>(
      `/api/phase1/${briefId}/fluff-examples`,
      { niche, topic, language }
    ),
  suggestTopics: (briefId: string, niche: string, subNiche = '') =>
    post<{ success: boolean; topics: { topic: string; hook_angle: string; viral_score: number; why: string }[] }>(
      `/api/phase1/${briefId}/suggest-topics`,
      { niche, sub_niche: subNiche }
    ),
};

/* ------------------------------------------------------------------ */
/*  Phase 2                                                             */
/* ------------------------------------------------------------------ */

export interface Phase2Payload {
  content_type?: string | null;
  selected_format?: string | null;
  selected_structure?: string | null;
  format_tier?: string | null;
  recommendation_level?: string | null;
  platform_boost_applied?: boolean;
  data_citations?: Record<string, unknown>[] | null;
  cta_type?: string | null;
  cta_text?: string | null;
}

export const phase2 = {
  contentTypes: () => get<{ content_types: unknown }>('/api/phase2/content-types'),
  combos: (contentType: string, platform = '') =>
    get<unknown>(`/api/phase2/combos/${contentType}?platform=${encodeURIComponent(platform)}`),
  get: (briefId: string) =>
    get<{ success: boolean; data: Phase2Payload; platform: string | null }>(`/api/phase2/${briefId}`),
  save: (briefId: string, data: Phase2Payload) =>
    post<{ success: boolean; data: Phase2Payload }>(`/api/phase2/${briefId}`, data),
  advance: (briefId: string) =>
    post<{ success: boolean; next_phase: number }>(`/api/phase2/${briefId}/advance`),
  recommend: (briefId: string, contentType: string, platform: string) =>
    post<unknown>(`/api/phase2/${briefId}/recommend`, { content_type: contentType, platform }),
};

/* ------------------------------------------------------------------ */
/*  Phase 3                                                             */
/* ------------------------------------------------------------------ */

export const phase3 = {
  get: (briefId: string) => get<{ generated: boolean } & Record<string, unknown>>(`/api/phase3/${briefId}`),
  generate: (briefId: string) => post<Record<string, unknown>>(`/api/phase3/${briefId}/generate`),
  updateScene: (briefId: string, sceneNum: number, body: Record<string, unknown>) =>
    patch<{ success: boolean; scene: Record<string, unknown> }>(
      `/api/phase3/${briefId}/scenes/${sceneNum}`,
      body
    ),
  regenerateScene: (briefId: string, sceneNum: number) =>
    post<{ success: boolean; scene: Record<string, unknown> }>(
      `/api/phase3/${briefId}/regenerate-scene/${sceneNum}`
    ),
  advance: (briefId: string) =>
    post<{ success: boolean; next_phase: number }>(`/api/phase3/${briefId}/advance`),
  goldenRulesCheck: (briefId: string) =>
    get<{ checks: Record<string, unknown>[] }>(`/api/phase3/${briefId}/golden-rules-check`),
};

/* ------------------------------------------------------------------ */
/*  Phase 4                                                             */
/* ------------------------------------------------------------------ */

export const phase4 = {
  get: (briefId: string) => get<Record<string, unknown>>(`/api/phase4/${briefId}`),
  runChecks: (briefId: string) => post<Record<string, unknown>>(`/api/phase4/${briefId}/run-checks`),
  overrideCheck: (briefId: string, checkId: string) =>
    patch<{ success: boolean; quality_score: number; overall_verdict: string }>(
      `/api/phase4/${briefId}/checks/${checkId}/override`
    ),
  submitApproval: (briefId: string, role: string, status: string, feedback = '') =>
    post<{ success: boolean; overall_verdict: string; role_approvals: unknown[] }>(
      `/api/phase4/${briefId}/approvals/${encodeURIComponent(role)}/submit`,
      { status, feedback }
    ),
  getApprovals: (briefId: string) => get<{ role_approvals: unknown[] }>(`/api/phase4/${briefId}/approvals`),
  advance: (briefId: string) =>
    post<{ success: boolean; next_phase: number }>(`/api/phase4/${briefId}/advance`),
  revise: (briefId: string) =>
    post<{ success: boolean; next_phase: number }>(`/api/phase4/${briefId}/revise`),
};

/* ------------------------------------------------------------------ */
/*  Phase 5                                                             */
/* ------------------------------------------------------------------ */

export const phase5 = {
  get: (briefId: string) => get<Record<string, unknown>>(`/api/phase5/${briefId}`),
  tabView: (briefId: string, tab: 'all' | 'actor' | 'camera' | 'edit' | 'script' | 'golden-rules') =>
    get<Record<string, unknown>>(`/api/phase5/${briefId}/tab/${tab}`),
  exportDocxUrl: (briefId: string) => `${API_BASE_URL}/api/phase5/${briefId}/export/docx`,
  exportHistory: (briefId: string) => get<{ history: unknown[] }>(`/api/phase5/${briefId}/export/history`),
  advance: (briefId: string) =>
    post<{ success: boolean; next_phase: number }>(`/api/phase5/${briefId}/advance`),
};

/* ------------------------------------------------------------------ */
/*  Phase 6                                                             */
/* ------------------------------------------------------------------ */

export const phase6 = {
  nodeTypes: () => get<{ node_types: unknown }>('/api/phase6/node-types'),
  get: (briefId: string) => get<{ generated: boolean } & Record<string, unknown>>(`/api/phase6/${briefId}`),
  generate: (briefId: string) => post<Record<string, unknown>>(`/api/phase6/${briefId}/generate`),
  updateNode: (briefId: string, nodeId: string, body: Record<string, unknown>) =>
    patch<{ success: boolean; node: Record<string, unknown> }>(`/api/phase6/${briefId}/nodes/${nodeId}`, body),
  addNode: (briefId: string, body: Record<string, unknown>) =>
    post<{ success: boolean; node: Record<string, unknown> }>(`/api/phase6/${briefId}/nodes`, body),
  deleteNode: (briefId: string, nodeId: string, force = false) =>
    del<{ deleted: boolean; edges_removed: number }>(`/api/phase6/${briefId}/nodes/${nodeId}?force=${force}`),
  addEdge: (briefId: string, fromPort: string, toPort: string) =>
    post<{ success: boolean; edge: Record<string, unknown> }>(`/api/phase6/${briefId}/edges`, {
      from_port: fromPort,
      to_port: toPort,
    }),
  deleteEdge: (briefId: string, edgeId: string) =>
    del<{ deleted: boolean }>(`/api/phase6/${briefId}/edges/${edgeId}`),
  renderPrompts: (briefId: string) =>
    post<{ success: boolean; nodes: Record<string, unknown>[] }>(`/api/phase6/${briefId}/render-prompts`),
  exportPipeline: (briefId: string) => get<Record<string, unknown>>(`/api/phase6/${briefId}/export`),
};
