import { GraphQLError } from 'graphql';
import { Context } from '../types';

export const authResolvers = {
  Query: {
    // Get current user profile
    me: async (_: unknown, __: unknown, context: Context) => {
      const { authAPI, token } = context;

      if (!token) {
        throw new GraphQLError('No estás autenticado', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        });
      }

      try {
        const result = await authAPI.getProfile(token);
        return result;
      } catch (error) {
        throw error;
      }
    },

    // Health check
    health: () => {
      return 'API Gateway is running! 🚀';
    },
  },

  Mutation: {
    // Register new user
    register: async (
      _: unknown,
      { name, email, password }: { name: string; email: string; password: string },
      context: Context
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.register({ name, email, password });
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
      context: Context
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.login({ email, password });
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
      context: Context
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.refreshToken({ refreshToken });
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
      context: Context
    ) => {
      const { authAPI } = context;

      try {
        const result = await authAPI.logout(refreshToken);
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
