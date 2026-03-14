import { randomUUID } from 'crypto';
import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { AuthAPI } from './dataSources/authAPI';
import { InternshipAPI } from './dataSources/internshipAPI';
import { AuthenticatedUser } from './types';

export interface GatewayContext {
  authAPI: AuthAPI;
  internshipAPI: InternshipAPI;
  token?: string;
  authHeader?: string;
  requestId: string;
  user?: AuthenticatedUser;
}

const getAuthenticatedUser = (token?: string): AuthenticatedUser | undefined => {
  if (!token) {
    return undefined;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId?: string; email?: string };

    if (!payload.userId || !payload.email) {
      return undefined;
    }

    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return undefined;
  }
};

export const createContext = async ({
  req,
}: ExpressContextFunctionArgument): Promise<GatewayContext> => {
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const user = getAuthenticatedUser(token);

  return {
    authAPI: new AuthAPI(config.authServiceUrl, config.http.timeoutMs, config.http.retries),
    internshipAPI: new InternshipAPI(
      config.internshipServiceUrl,
      config.http.timeoutMs,
      config.http.retries
    ),
    token,
    authHeader,
    requestId,
    user,
  };
};
