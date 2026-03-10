import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { AuthAPI } from './dataSources/authAPI';
import { Context } from './types';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export const createContext = async ({
  req,
}: ExpressContextFunctionArgument): Promise<Context> => {
  // Initialize data sources
  const authAPI = new AuthAPI(AUTH_SERVICE_URL);

  // Extract token from Authorization header
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  return {
    authAPI,
    token,
  };
};
