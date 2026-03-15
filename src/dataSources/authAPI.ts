import { RestClient, ServiceHealth, UpstreamRequestContext } from '../utils/upstream';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    id?: string;
    name?: string;
    email?: string;
    createdAt?: string;
    user?: {
      id: string;
      name: string;
      email: string;
      createdAt?: string;
    };
  };
}

export class AuthAPI extends RestClient {
  constructor(baseURL: string, timeoutMs: number, retries: number) {
    super({
      serviceName: 'auth-service',
      baseURL,
      timeoutMs,
      retries,
    });
  }

  async register(input: RegisterInput, requestId: string): Promise<AuthResponse> {
    return this.post('/api/auth/register', { requestId }, input);
  }

  async login(input: LoginInput, requestId: string): Promise<AuthResponse> {
    return this.post('/api/auth/login', { requestId }, input);
  }

  async refreshToken(input: RefreshTokenInput, requestId: string): Promise<AuthResponse> {
    return this.post('/api/auth/refresh', { requestId }, input);
  }

  async logout(refreshToken: string, requestId: string): Promise<{ success: boolean; message: string }> {
    return this.post('/api/auth/logout', { requestId }, { refreshToken });
  }

  async getProfile(token: string, requestId: string): Promise<ProfileResponse> {
    const context: UpstreamRequestContext = {
      requestId,
      authHeader: `Bearer ${token}`,
    };

    return this.get('/api/auth/profile', context);
  }

  healthCheck(path: string, requestId: string): Promise<ServiceHealth> {
    return super.healthCheck(path, requestId);
  }
}
