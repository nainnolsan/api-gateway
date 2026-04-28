import { randomUUID } from 'crypto';
import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { AuthAPI } from './dataSources/authAPI';
import { InternshipAPI } from './dataSources/internshipAPI';
import { ScraperAPI } from './dataSources/scraperAPI';
import { AuthenticatedUser } from './types';

export interface GatewayContext {
  authAPI: AuthAPI;
  internshipAPI: InternshipAPI;
  scraperAPI: ScraperAPI;
  token?: string;
  authHeader?: string;
  requestId: string;
  user?: AuthenticatedUser;
}

const getAuthenticatedUser = async (
  token: string | undefined,
  authAPI: AuthAPI,
  requestId: string,
): Promise<AuthenticatedUser | undefined> => {
  if (!token) {
    return undefined;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId?: string; email?: string };

    if (payload.userId && payload.email) {
      return {
        userId: payload.userId,
        email: payload.email,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JWT verification error';
    console.warn(`[gateway][auth][${requestId}] Local JWT verification failed, falling back to auth-service profile lookup`, {
      message,
    });
  }

  try {
    const profile = await authAPI.getProfile(token, requestId);
    const profileUser = profile.data?.user;
    const profileId = profileUser?.id || profile.data?.id;
    const profileEmail = profileUser?.email || profile.data?.email;

    if (profileId && profileEmail) {
      console.info(`[gateway][auth][${requestId}] User identity resolved from auth-service profile`);
      return {
        userId: profileId,
        email: profileEmail,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown profile lookup error';
    console.warn(`[gateway][auth][${requestId}] Auth-service profile lookup failed`, {
      message,
    });
  }

  return undefined;
};

export const createContext = async ({
  req,
}: ExpressContextFunctionArgument): Promise<GatewayContext> => {
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const authAPI = new AuthAPI(config.authServiceUrl, config.http.timeoutMs, config.http.retries);
  const user = await getAuthenticatedUser(token, authAPI, requestId);

  if (authHeader && !user) {
    console.warn(`[gateway][auth][${requestId}] Authorization header received but user identity could not be resolved`);
  }

  return {
    authAPI,
    internshipAPI: new InternshipAPI(
      config.internshipServiceUrl,
      config.http.timeoutMs,
      config.http.retries
    ),
    scraperAPI: new ScraperAPI(
      config.jobScraperServiceUrl,
      config.http.timeoutMs,
      config.http.retries
    ),
    token,
    authHeader,
    requestId,
    user,
  };
};
