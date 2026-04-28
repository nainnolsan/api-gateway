import { RestClient, ServiceHealth, UpstreamRequestContext } from '../utils/upstream';

export interface ApplicationFiltersInput {
  stage?: string;
  company?: string;
  roleType?: string;
  fromDate?: string;
  toDate?: string;
  q?: string;
}

export interface CreateApplicationInput {
  company: string;
  roleTitle: string;
  roleType: string;
  stage: string;
  appliedAt: string;
  location?: string;
  source?: string;
  salaryRange?: string;
  notes?: string;
  contactEmail?: string;
}

export interface UpdateApplicationInput extends Partial<CreateApplicationInput> {}

export type EmailProvider = 'gmail' | 'outlook';

export interface InternshipApplication {
  id: string;
  company: string;
  roleTitle: string;
  roleType: string;
  stage: string;
  appliedAt: string;
  lastUpdatedAt: string;
  location?: string;
  source?: string;
  salaryRange?: string;
  notes?: string;
  contactEmail?: string;
}

export interface PipelineEvent {
  id: string;
  fromStage?: string;
  toStage: string;
  eventDate: string;
  notes?: string;
}

export interface ApplicationJourney {
  application: InternshipApplication;
  stageTimeline: PipelineEvent[];
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

export interface DashboardMetrics {
  totalApplied: number;
  totalOnlineAssessments: number;
  totalInterviews: number;
  totalOffers: number;
  totalRejected: number;
  conversionRate: number;
}

export interface FunnelNode {
  name: string;
}

export interface FunnelLink {
  source: number;
  target: number;
  value: number;
}

export interface FunnelFlow {
  nodes: FunnelNode[];
  links: FunnelLink[];
}

export interface PipelineColumn {
  stage: string;
  total: number;
  applications: InternshipApplication[];
}

export interface DailyApplicationsPoint {
  date: string;
  applied: number;
  interview: number;
  offer: number;
}

export interface StageDistributionItem {
  stage: string;
  value: number;
}

export interface AnalyticsOverview {
  daily: DailyApplicationsPoint[];
  stageDistribution: StageDistributionItem[];
}

export interface EmailConnectorStatus {
  provider: EmailProvider;
  connected: boolean;
  authUrl?: string;
  lastSyncAt?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  company: string;
  snippet: string;
  receivedAt: string;
  stageHint?: string;
}

export interface EmailCenter {
  connectors: EmailConnectorStatus[];
  threads: EmailThread[];
}

export interface StageLayoutItem {
  id: string;
  label: string;
  position: number;
  enabled: boolean;
  isCustom: boolean;
}

// ---- Service-level response shapes (internal) ----

interface ServiceWrapper<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ServiceMetricsData {
  summary: { total: number; active: number; offers: number; rejections: number };
  byStatus: { status: string; count: number }[];
  last30DaysEvents: { day: string; events: number }[];
  emails: { inbound: number; outbound: number };
}

interface ServiceFunnelFlowData {
  nodes: FunnelNode[];
  links: FunnelLink[];
}

interface ServiceStageLayoutData {
  id: string;
  label: string;
  position: number;
  enabled: boolean;
  isCustom: boolean;
}

interface ServiceApplication {
  id: string;
  user_id: string;
  company_id: string | null;
  company_name: string | null;
  role_title: string;
  status: string;
  source: string | null;
  location: string | null;
  salary_range: string | null;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ServicePipelineEvent {
  id: string;
  from_status: string | null;
  to_status: string;
  event_date: string;
  notes: string | null;
}

// ---- Mapping helpers ----

const DB_TO_STAGE: Record<string, string> = {
  saved: 'Applied',
  applied: 'Applied',
  screening: 'OnlineAssessment',
  interview: 'Interview',
  technical: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Rejected',
  hired: 'Offer',
};

const STAGE_TO_DB: Record<string, string> = {
  Applied: 'applied',
  OnlineAssessment: 'screening',
  Interview: 'interview',
  Offer: 'offer',
  Rejected: 'rejected',
};

function mapApplication(row: ServiceApplication): InternshipApplication {
  return {
    id: row.id,
    company: row.company_name ?? 'Unknown',
    roleTitle: row.role_title,
    roleType: 'Internship',
    stage: DB_TO_STAGE[row.status] ?? 'Applied',
    appliedAt: row.applied_at ?? row.created_at,
    lastUpdatedAt: row.updated_at,
    location: row.location ?? undefined,
    source: row.source ?? undefined,
    salaryRange: row.salary_range ?? undefined,
    notes: row.notes ?? undefined,
    contactEmail: undefined,
  };
}

function mapPipelineEvent(row: ServicePipelineEvent): PipelineEvent {
  return {
    id: row.id,
    fromStage: row.from_status ? (DB_TO_STAGE[row.from_status] ?? 'Applied') : undefined,
    toStage: DB_TO_STAGE[row.to_status] ?? 'Applied',
    eventDate: row.event_date,
    notes: row.notes ?? undefined,
  };
}

const STAGE_ORDER = ['Applied', 'OnlineAssessment', 'Interview', 'Offer', 'Rejected'] as const;

export class InternshipAPI extends RestClient {
  constructor(baseURL: string, timeoutMs: number, retries: number) {
    super({
      serviceName: 'internship-service',
      baseURL,
      timeoutMs,
      retries,
    });
  }

  async getDashboardMetrics(context: UpstreamRequestContext): Promise<DashboardMetrics> {
    const res = await this.get<ServiceWrapper<ServiceMetricsData>>('/api/metrics/dashboard', context);
    const d = res.data;
    const byStatus = d.byStatus ?? [];
    const total = d.summary.total;

    const countFor = (...statuses: string[]) =>
      byStatus.filter(s => statuses.includes(s.status)).reduce((acc, s) => acc + s.count, 0);

    const totalOffers = countFor('offer', 'hired');
    const conversionRate = total > 0 ? parseFloat(((totalOffers / total) * 100).toFixed(1)) : 0;

    return {
      totalApplied: total,
      totalOnlineAssessments: countFor('screening'),
      totalInterviews: countFor('interview', 'technical'),
      totalOffers,
      totalRejected: countFor('rejected', 'withdrawn'),
      conversionRate,
    };
  }

  async getFunnelFlow(context: UpstreamRequestContext): Promise<FunnelFlow> {
    const res = await this.get<ServiceWrapper<ServiceFunnelFlowData>>('/api/metrics/funnel-flow', context);
    return res.data;
  }

  async getApplications(
    filters: ApplicationFiltersInput,
    context: UpstreamRequestContext
  ): Promise<InternshipApplication[]> {
    const params: Record<string, unknown> = {};
    if (filters.stage) params.status = STAGE_TO_DB[filters.stage] ?? filters.stage.toLowerCase();
    if (filters.company || filters.q) params.search = filters.company ?? filters.q;

    const res = await this.get<ServiceWrapper<ServiceApplication[]>>('/api/applications', context, params);
    return (res.data ?? []).map(mapApplication);
  }

  async createApplication(
    input: CreateApplicationInput,
    context: UpstreamRequestContext
  ): Promise<InternshipApplication> {
    const body: Record<string, unknown> = {
      companyName: input.company,
      roleTitle: input.roleTitle,
      status: STAGE_TO_DB[input.stage] ?? 'applied',
      appliedAt: input.appliedAt,
    };
    if (input.location) body.location = input.location;
    if (input.source) body.source = input.source;
    if (input.salaryRange) body.salaryRange = input.salaryRange;
    if (input.notes) body.notes = input.notes;

    const res = await this.post<ServiceWrapper<ServiceApplication>>('/api/applications', context, body);
    return mapApplication(res.data);
  }

  async updateApplication(
    id: string,
    input: UpdateApplicationInput,
    context: UpstreamRequestContext
  ): Promise<InternshipApplication> {
    const body: Record<string, unknown> = {};
    if (input.company !== undefined) body.companyName = input.company;
    if (input.roleTitle !== undefined) body.roleTitle = input.roleTitle;
    if (input.stage !== undefined) body.status = STAGE_TO_DB[input.stage] ?? input.stage.toLowerCase();
    if (input.appliedAt !== undefined) body.appliedAt = input.appliedAt;
    if (input.location !== undefined) body.location = input.location;
    if (input.source !== undefined) body.source = input.source;
    if (input.salaryRange !== undefined) body.salaryRange = input.salaryRange;
    if (input.notes !== undefined) body.notes = input.notes;

    const res = await this.patch<ServiceWrapper<ServiceApplication>>(`/api/applications/${id}`, context, body);
    return mapApplication(res.data);
  }

  async deleteApplication(id: string, context: UpstreamRequestContext): Promise<ActionResponse> {
    await this.delete(`/api/applications/${id}`, context);
    return {
      success: true,
      message: 'Application deleted successfully',
    };
  }

  async getApplicationJourney(id: string, context: UpstreamRequestContext): Promise<ApplicationJourney> {
    const appRes = await this.get<ServiceWrapper<ServiceApplication>>(`/api/applications/${id}`, context);
    const timelineRes = await this.get<ServiceWrapper<ServicePipelineEvent[]>>(
      `/api/applications/${id}/pipeline-events`,
      context,
    );

    return {
      application: mapApplication(appRes.data),
      stageTimeline: (timelineRes.data ?? []).map(mapPipelineEvent),
    };
  }

  async addStageEvent(
    id: string,
    input: { toStage: string; eventDate?: string; notes?: string },
    context: UpstreamRequestContext,
  ): Promise<PipelineEvent> {
    const body: Record<string, unknown> = {
      toStatus: STAGE_TO_DB[input.toStage] ?? input.toStage.toLowerCase(),
    };

    if (input.eventDate) body.eventDate = input.eventDate;
    if (input.notes) body.notes = input.notes;

    const res = await this.post<ServiceWrapper<ServicePipelineEvent>>(
      `/api/applications/${id}/pipeline-events`,
      context,
      body,
    );

    return mapPipelineEvent(res.data);
  }

  async updateStageEvent(
    id: string,
    eventId: string,
    input: { toStage?: string; eventDate?: string; notes?: string },
    context: UpstreamRequestContext,
  ): Promise<PipelineEvent> {
    const body: Record<string, unknown> = {};

    if (input.toStage !== undefined) body.toStatus = STAGE_TO_DB[input.toStage] ?? input.toStage.toLowerCase();
    if (input.eventDate !== undefined) body.eventDate = input.eventDate;
    if (input.notes !== undefined) body.notes = input.notes;

    const res = await this.patch<ServiceWrapper<ServicePipelineEvent>>(
      `/api/applications/${id}/pipeline-events/${eventId}`,
      context,
      body,
    );

    return mapPipelineEvent(res.data);
  }

  async deleteStageEvent(id: string, eventId: string, context: UpstreamRequestContext): Promise<ActionResponse> {
    await this.delete(`/api/applications/${id}/pipeline-events/${eventId}`, context);
    return {
      success: true,
      message: 'Pipeline event deleted successfully',
    };
  }

  async getPipelineBoard(context: UpstreamRequestContext): Promise<PipelineColumn[]> {
    const res = await this.get<ServiceWrapper<ServiceApplication[]>>('/api/applications', context);
    const apps = (res.data ?? []).map(mapApplication);

    const columnMap = new Map<string, InternshipApplication[]>(
      STAGE_ORDER.map(s => [s, []])
    );
    for (const app of apps) {
      const col = columnMap.get(app.stage) ?? columnMap.get('Applied')!;
      col.push(app);
    }

    return STAGE_ORDER.map(stage => ({
      stage,
      total: columnMap.get(stage)!.length,
      applications: columnMap.get(stage)!,
    }));
  }

  async getAnalyticsOverview(context: UpstreamRequestContext): Promise<AnalyticsOverview> {
    const res = await this.get<ServiceWrapper<ServiceMetricsData>>('/api/metrics/dashboard', context);
    const d = res.data;

    const daily: DailyApplicationsPoint[] = (d.last30DaysEvents ?? []).map(e => ({
      date: e.day,
      applied: e.events,
      interview: 0,
      offer: 0,
    }));

    const merged = new Map<string, number>();
    for (const item of (d.byStatus ?? [])) {
      const stage = DB_TO_STAGE[item.status] ?? 'Applied';
      merged.set(stage, (merged.get(stage) ?? 0) + item.count);
    }
    const stageDistribution: StageDistributionItem[] = Array.from(merged.entries()).map(
      ([stage, value]) => ({ stage, value })
    );

    return { daily, stageDistribution };
  }

  getEmailCenter(_context: UpstreamRequestContext): Promise<EmailCenter> {
    return Promise.resolve({ connectors: [], threads: [] });
  }

  connectEmailProvider(
    _provider: EmailProvider,
    _context: UpstreamRequestContext
  ): Promise<{ redirectUrl: string }> {
    return Promise.resolve({ redirectUrl: '' });
  }

  async getStageLayout(context: UpstreamRequestContext): Promise<StageLayoutItem[]> {
    const res = await this.get<ServiceWrapper<ServiceStageLayoutData[]>>('/api/settings/stage-layout', context);
    return res.data ?? [];
  }

  async saveStageLayout(
    layout: Array<{ id: string; label: string; enabled: boolean; isCustom: boolean }>,
    context: UpstreamRequestContext,
  ): Promise<ActionResponse> {
    await this.patch<ServiceWrapper<unknown>>('/api/settings/stage-layout', context, { layout });
    return {
      success: true,
      message: 'Stage layout saved successfully',
    };
  }

  // SaaS Discovery
  async getSwipeHistory(context: UpstreamRequestContext): Promise<Array<{ job_id: string; status: string }>> {
    const res = await this.get<ServiceWrapper<Array<{ job_id: string; status: string }>>>('/api/discovery/history', context);
    return res.data ?? [];
  }

  async swipeJob(
    jobId: string,
    status: string,
    companyName: string | undefined | null,
    roleTitle: string | undefined | null,
    location: string | undefined | null,
    url: string | undefined | null,
    context: UpstreamRequestContext
  ): Promise<ActionResponse> {
    const res = await this.post<ServiceWrapper<unknown>>('/api/discovery/swipe', context, {
      jobId,
      status,
      companyName,
      roleTitle,
      location,
      url,
    });
    return {
      success: res.success,
      message: res.message || `Trabajo ${status}`,
    };
  }

  healthCheck(path: string, requestId: string): Promise<ServiceHealth> {
    return super.healthCheck(path, requestId);
  }
}
