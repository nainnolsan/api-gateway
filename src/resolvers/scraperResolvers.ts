import { GatewayContext } from '../context';

export const scraperResolvers = {
  Query: {
    scrapedJobs: async (
      _: unknown,
      { keyword, location }: { keyword?: string; location?: string },
      context: GatewayContext
    ) => {
      // We do not strictly require auth for fetching jobs, but we pass the context anyway.
      const upstreamContext = {
        authHeader: context.authHeader,
        identity: context.user,
        requestId: context.requestId,
      };
      
      return context.scraperAPI.getScrapedJobs(keyword, location, upstreamContext);
    },
  },
};
