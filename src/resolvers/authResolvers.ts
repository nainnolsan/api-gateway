import { GraphQLError } from 'graphql';
import { config } from '../config';
import { GatewayContext } from '../context';

export const authResolvers = {
  Query: {
    // Get current user profile
    me: async (_: unknown, __: unknown, context: GatewayContext) => {
      const { authAPI, token } = context;

      if (!token) {
        throw new GraphQLError('No estás autenticado', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      try {
        const result = await authAPI.getProfile(token, context.requestId);
        return result;
      } catch (error) {
        throw error;
      }
    },

    // Health check
    health: () => {
      return 'API Gateway is running! 🚀';
    },
    gatewayHealth: async (_: unknown, __: unknown, context: GatewayContext) => {
      const services = await Promise.all([
        context.authAPI.healthCheck(config.health.authPath, context.requestId),
        context.internshipAPI.healthCheck(config.health.internshipPath, context.requestId),
      ]);

      return {
        status: services.some((service) => service.status === 'down') ? 'degraded' : 'ok',
        timestamp: new Date().toISOString(),
        services,
      };
    },
  },

  Mutation: {
    // Register new user
    register: async (
      _: unknown,
      { name, email, password }: { name: string; email: string; password: string },
      context: GatewayContext
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.register({ name, email, password }, context.requestId);
        return {
          success: result.success,
          message: result.message,
          accessToken: result.data?.accessToken,
          refreshToken: result.data?.refreshToken,
          user: result.data?.user,
        };
      } catch (error) {
        throw error;
      }
    },

    // Login user
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      context: GatewayContext
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.login({ email, password }, context.requestId);
        return {
          success: result.success,
          message: result.message,
          accessToken: result.data?.accessToken,
          refreshToken: result.data?.refreshToken,
          user: result.data?.user,
        };
      } catch (error) {
        throw error;
      }
    },

    // Refresh token
    refreshToken: async (
      _: unknown,
      { refreshToken }: { refreshToken: string },
      context: GatewayContext
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.refreshToken({ refreshToken }, context.requestId);
        return {
          success: result.success,
          message: result.message,
          accessToken: result.data?.accessToken,
          refreshToken: result.data?.refreshToken,
          user: result.data?.user,
        };
      } catch (error) {
        throw error;
      }
    },

    // Logout user
    logout: async (
      _: unknown,
      { refreshToken }: { refreshToken: string },
      context: GatewayContext
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.logout(refreshToken, context.requestId);
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        throw error;
      }
    },
  },
};
