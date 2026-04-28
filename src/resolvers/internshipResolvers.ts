import { GraphQLError } from 'graphql';
import { GatewayContext } from '../context';
import {
  ActionResponse,
  ApplicationFiltersInput,
  ApplicationJourney,
  CreateApplicationInput,
  PipelineEvent,
  UpdateApplicationInput,
} from '../dataSources/internshipAPI';

const requireAuth = (context: GatewayContext): void => {
  if (!context.authHeader) {
    throw new GraphQLError('No estás autenticado', {
      extensions: {
        code: 'UNAUTHENTICATED',
        requestId: context.requestId,
      },
    });
  }

  if (!context.user?.userId) {
    throw new GraphQLError('No se pudo resolver la identidad del usuario desde el token', {
      extensions: {
        code: 'UNAUTHENTICATED',
        requestId: context.requestId,
      },
    });
  }
};

const getUpstreamContext = (context: GatewayContext) => ({
  authHeader: context.authHeader,
  identity: context.user,
  requestId: context.requestId,
});

export const internshipResolvers = {
  Query: {
    internshipDashboardMetrics: async (_: unknown, __: unknown, context: GatewayContext) => {
      requireAuth(context);
      return context.internshipAPI.getDashboardMetrics(getUpstreamContext(context));
    },
    internshipFunnelFlow: async (_: unknown, __: unknown, context: GatewayContext) => {
      requireAuth(context);
      return context.internshipAPI.getFunnelFlow(getUpstreamContext(context));
    },
    internshipApplications: async (
      _: unknown,
      { filters }: { filters?: ApplicationFiltersInput },
      context: GatewayContext
    ) => {
      requireAuth(context);
      return context.internshipAPI.getApplications(filters || {}, getUpstreamContext(context));
    },
    internshipApplicationJourney: async (
      _: unknown,
      { id }: { id: string },
      context: GatewayContext
    ): Promise<ApplicationJourney> => {
      requireAuth(context);
      return context.internshipAPI.getApplicationJourney(id, getUpstreamContext(context));
    },
    internshipPipeline: async (_: unknown, __: unknown, context: GatewayContext) => {
      requireAuth(context);
      return context.internshipAPI.getPipelineBoard(getUpstreamContext(context));
    },
    internshipAnalyticsOverview: async (_: unknown, __: unknown, context: GatewayContext) => {
      requireAuth(context);
      return context.internshipAPI.getAnalyticsOverview(getUpstreamContext(context));
    },
    internshipEmailCenter: async (_: unknown, __: unknown, context: GatewayContext) => {
      requireAuth(context);
      return context.internshipAPI.getEmailCenter(getUpstreamContext(context));
    },
    internshipStageLayout: async (_: unknown, __: unknown, context: GatewayContext) => {
      requireAuth(context);
      return context.internshipAPI.getStageLayout(getUpstreamContext(context));
    },
    swipeHistory: async (_: unknown, __: unknown, context: GatewayContext) => {
      requireAuth(context);
      return context.internshipAPI.getSwipeHistory(getUpstreamContext(context));
    },
  },
  Mutation: {
    createInternshipApplication: async (
      _: unknown,
      { input }: { input: CreateApplicationInput },
      context: GatewayContext
    ) => {
      requireAuth(context);
      return context.internshipAPI.createApplication(input, getUpstreamContext(context));
    },
    updateInternshipApplication: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateApplicationInput },
      context: GatewayContext
    ) => {
      requireAuth(context);
      return context.internshipAPI.updateApplication(id, input, getUpstreamContext(context));
    },
    deleteInternshipApplication: async (
      _: unknown,
      { id }: { id: string },
      context: GatewayContext
    ): Promise<ActionResponse> => {
      requireAuth(context);
      return context.internshipAPI.deleteApplication(id, getUpstreamContext(context));
    },
    addInternshipStageEvent: async (
      _: unknown,
      { id, input }: { id: string; input: { toStage: string; eventDate?: string; notes?: string } },
      context: GatewayContext
    ): Promise<PipelineEvent> => {
      requireAuth(context);
      return context.internshipAPI.addStageEvent(id, input, getUpstreamContext(context));
    },
    updateInternshipStageEvent: async (
      _: unknown,
      { id, eventId, input }: { id: string; eventId: string; input: { toStage?: string; eventDate?: string; notes?: string } },
      context: GatewayContext
    ): Promise<PipelineEvent> => {
      requireAuth(context);
      return context.internshipAPI.updateStageEvent(id, eventId, input, getUpstreamContext(context));
    },
    deleteInternshipStageEvent: async (
      _: unknown,
      { id, eventId }: { id: string; eventId: string },
      context: GatewayContext
    ): Promise<ActionResponse> => {
      requireAuth(context);
      return context.internshipAPI.deleteStageEvent(id, eventId, getUpstreamContext(context));
    },
    connectInternshipEmailProvider: async (
      _: unknown,
      { provider }: { provider: 'gmail' | 'outlook' },
      context: GatewayContext
    ) => {
      requireAuth(context);
      return context.internshipAPI.connectEmailProvider(provider, getUpstreamContext(context));
    },
    saveInternshipStageLayout: async (
      _: unknown,
      { layout }: { layout: Array<{ id: string; label: string; enabled: boolean; isCustom: boolean }> },
      context: GatewayContext,
    ): Promise<ActionResponse> => {
      requireAuth(context);
      return context.internshipAPI.saveStageLayout(layout, getUpstreamContext(context));
    },

    swipeJob: async (
      _: unknown,
      args: { jobId: string; status: string; companyName?: string; roleTitle?: string; location?: string; url?: string },
      context: GatewayContext
    ): Promise<ActionResponse> => {
      requireAuth(context);
      return context.internshipAPI.swipeJob(
        args.jobId,
        args.status,
        args.companyName,
        args.roleTitle,
        args.location,
        args.url,
        getUpstreamContext(context)
      );
    },
  },
};
