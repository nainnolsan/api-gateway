import { GraphQLError } from 'graphql';
import { GatewayContext } from '../context';
import {
  ApplicationFiltersInput,
  CreateApplicationInput,
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
    connectInternshipEmailProvider: async (
      _: unknown,
      { provider }: { provider: 'gmail' | 'outlook' },
      context: GatewayContext
    ) => {
      requireAuth(context);
      return context.internshipAPI.connectEmailProvider(provider, getUpstreamContext(context));
    },
  },
};
