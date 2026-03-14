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

export class InternshipAPI extends RestClient {
  constructor(baseURL: string, timeoutMs: number, retries: number) {
    super({
      serviceName: 'internship-service',
      baseURL,
      timeoutMs,
      retries,
    });
  }

  getDashboardMetrics(context: UpstreamRequestContext): Promise<DashboardMetrics> {
    return this.get('/api/internships/dashboard/metrics', context);
  }

  getFunnelFlow(context: UpstreamRequestContext): Promise<FunnelFlow> {
    return this.get('/api/internships/dashboard/funnel', context);
  }

  getApplications(
    filters: ApplicationFiltersInput,
    context: UpstreamRequestContext
  ): Promise<InternshipApplication[]> {
    return this.get('/api/internships/applications', context, filters as Record<string, unknown>);
  }

  createApplication(
    input: CreateApplicationInput,
    context: UpstreamRequestContext
  ): Promise<InternshipApplication> {
    return this.post('/api/internships/applications', context, input);
  }

  updateApplication(
    id: string,
    input: UpdateApplicationInput,
    context: UpstreamRequestContext
  ): Promise<InternshipApplication> {
    return this.patch(`/api/internships/applications/${id}`, context, input);
  }

  getPipelineBoard(context: UpstreamRequestContext): Promise<PipelineColumn[]> {
    return this.get('/api/internships/pipeline', context);
  }

  getAnalyticsOverview(context: UpstreamRequestContext): Promise<AnalyticsOverview> {
    return this.get('/api/internships/analytics/overview', context);
  }

  getEmailCenter(context: UpstreamRequestContext): Promise<EmailCenter> {
    return this.get('/api/internships/emails', context);
  }

  connectEmailProvider(
    provider: EmailProvider,
    context: UpstreamRequestContext
  ): Promise<{ redirectUrl: string }> {
    return this.post(`/api/internships/emails/connect/${provider}`, context);
  }

  healthCheck(path: string, requestId: string): Promise<ServiceHealth> {
    return super.healthCheck(path, requestId);
  }
}
