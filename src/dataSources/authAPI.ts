import axios, { AxiosInstance, AxiosError } from 'axios';
import { GraphQLError } from 'graphql';

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
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
}

export class AuthAPI {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Handle errors from REST API
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; success?: boolean }>;
      const message = axiosError.response?.data?.message || axiosError.message || 'Error en el servicio de autenticación';
      const statusCode = axiosError.response?.status || 500;
      
      throw new GraphQLError(message, {
        extensions: {
          code: this.getErrorCode(statusCode),
          statusCode,
        },
      });
    }
    
    throw new GraphQLError('Error inesperado en el servicio de autenticación', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }

  private getErrorCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHENTICATED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }

  // Register new user
  async register(input: RegisterInput): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/api/auth/register', input);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Login user
  async login(input: LoginInput): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/api/auth/login', input);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Refresh token
  async refreshToken(input: RefreshTokenInput): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/api/auth/refresh', input);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Logout user
  async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post<{ success: boolean; message: string }>(
        '/api/auth/logout',
        { refreshToken }
      );
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get user profile
  async getProfile(token: string): Promise<ProfileResponse> {
    try {
      const response = await this.client.get<ProfileResponse>('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}
