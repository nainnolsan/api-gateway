import { RestClient, UpstreamRequestContext, ServiceHealth } from '../utils/upstream';

export interface ScrapedJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  platform: string;
  description?: string;
  postedDate?: string;
  extractedAt: string;
}

interface ServiceWrapper<T> {
  success: boolean;
  data: T;
}

export class ScraperAPI extends RestClient {
  constructor(baseURL: string, timeoutMs: number, retries: number) {
    super({
      serviceName: 'job-scraper-service',
      baseURL,
      timeoutMs,
      retries,
    });
  }

  async getScrapedJobs(
    keyword: string | undefined,
    location: string | undefined,
    context: UpstreamRequestContext
  ): Promise<ScrapedJob[]> {
    const params: Record<string, unknown> = {};
    if (keyword) params.keyword = keyword;
    if (location) params.location = location;

    const res = await this.get<ServiceWrapper<ScrapedJob[]>>('/api/scrape/jobs', context, params);
    return res.data ?? [];
  }

  healthCheck(path: string, requestId: string): Promise<ServiceHealth> {
    return super.healthCheck(path, requestId);
  }
}
