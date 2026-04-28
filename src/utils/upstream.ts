import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import { GraphQLError } from 'graphql';

export interface UpstreamIdentity {
  userId?: string;
  email?: string;
}

export interface UpstreamRequestContext {
  authHeader?: string;
  identity?: UpstreamIdentity;
  requestId: string;
}

export interface ServiceHealth {
  service: string;
  status: 'up' | 'down';
  url: string;
  responseTimeMs: number;
  statusCode?: number;
  message?: string;
}

interface RestClientOptions {
  serviceName: string;
  baseURL: string;
  timeoutMs: number;
  retries: number;
}

interface RequestOptions {
  method: Method;
  path: string;
  requestId: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  authHeader?: string;
  identity?: UpstreamIdentity;
  retryable?: boolean;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export class RestClient {
  private readonly client: AxiosInstance;
  private readonly serviceName: string;
  private readonly retries: number;
  private readonly baseURL: string;

  constructor(options: RestClientOptions) {
    this.serviceName = options.serviceName;
    this.retries = options.retries;
    this.baseURL = options.baseURL;
    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  protected async get<T>(
    path: string,
    context: UpstreamRequestContext,
    params?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>({
      method: 'GET',
      path,
      params,
      requestId: context.requestId,
      authHeader: context.authHeader,
      identity: context.identity,
      retryable: true,
    });
  }

  protected async post<T>(
    path: string,
    context: UpstreamRequestContext,
    data?: unknown,
    retryable = false
  ): Promise<T> {
    return this.request<T>({
      method: 'POST',
      path,
      data,
      requestId: context.requestId,
      authHeader: context.authHeader,
      identity: context.identity,
      retryable,
    });
  }

  protected async put<T>(
    path: string,
    context: UpstreamRequestContext,
    data?: unknown,
    retryable = false
  ): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      path,
      data,
      requestId: context.requestId,
      authHeader: context.authHeader,
      identity: context.identity,
      retryable,
    });
  }

  protected async patch<T>(
    path: string,
    context: UpstreamRequestContext,
    data?: unknown
  ): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      path,
      data,
      requestId: context.requestId,
      authHeader: context.authHeader,
      identity: context.identity,
      retryable: false,
    });
  }

  protected async delete<T>(
    path: string,
    context: UpstreamRequestContext,
    data?: unknown
  ): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      path,
      data,
      requestId: context.requestId,
      authHeader: context.authHeader,
      identity: context.identity,
      retryable: false,
    });
  }

  async healthCheck(path: string, requestId: string): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await this.client.get(path, {
        headers: {
          'x-request-id': requestId,
        },
      });

      return {
        service: this.serviceName,
        status: 'up',
        url: this.baseURL,
        responseTimeMs: Date.now() - startTime,
        statusCode: response.status,
        message: this.extractMessage(response.data),
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;

      return {
        service: this.serviceName,
        status: 'down',
        url: this.baseURL,
        responseTimeMs: Date.now() - startTime,
        statusCode: axiosError.response?.status,
        message: axiosError.response?.data?.message || axiosError.message,
      };
    }
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.retries) {
      try {
        const startedAt = Date.now();
        const response = await this.client.request<T>(this.toAxiosConfig(options));
        this.log('info', options.requestId, `${options.method} ${options.path}`, {
          attempt,
          statusCode: response.status,
          durationMs: Date.now() - startedAt,
        });
        return response.data;
      } catch (error) {
        lastError = error;
        const axiosError = error as AxiosError<{ message?: string }>;
        const shouldRetry = this.shouldRetry(axiosError, options, attempt);

        this.log(shouldRetry ? 'warn' : 'error', options.requestId, `${options.method} ${options.path}`, {
          attempt,
          statusCode: axiosError.response?.status,
          message: axiosError.response?.data?.message || axiosError.message,
          retrying: shouldRetry,
        });

        if (!shouldRetry) {
          throw this.toGraphQLError(axiosError, options);
        }

        await this.wait(250 * (attempt + 1));
      }

      attempt += 1;
    }

    throw this.toGraphQLError(lastError as AxiosError<{ message?: string }>, options);
  }

  private toAxiosConfig(options: RequestOptions): AxiosRequestConfig {
    return {
      method: options.method,
      url: options.path,
      params: options.params,
      data: options.data,
      headers: {
        ...options.headers,
        ...this.buildForwardHeaders(options),
      },
    };
  }

  private buildForwardHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'x-request-id': options.requestId,
    };

    if (options.authHeader) {
      headers.authorization = options.authHeader;
    }

    if (options.identity?.userId) {
      headers['x-user-id'] = options.identity.userId;
    }

    if (options.identity?.email) {
      headers['x-user-email'] = options.identity.email;
    }

    return headers;
  }

  private shouldRetry(
    error: AxiosError,
    options: RequestOptions,
    attempt: number
  ): boolean {
    if (!options.retryable || attempt >= this.retries) {
      return false;
    }

    if (!error.response) {
      return true;
    }

    return RETRYABLE_STATUS_CODES.has(error.response.status);
  }

  private toGraphQLError(
    error: AxiosError<{ message?: string }>,
    options: RequestOptions
  ): GraphQLError {
    const statusCode = error.response?.status || 502;
    const isTimeout = error.code === 'ECONNABORTED';
    const message = error.response?.data?.message || error.message || `Error en ${this.serviceName}`;

    return new GraphQLError(message, {
      extensions: {
        code: this.toGraphQLCode(statusCode, isTimeout),
        statusCode,
        service: this.serviceName,
        upstreamPath: options.path,
        requestId: options.requestId,
        retryable: this.shouldRetry(error, options, 0),
      },
    });
  }

  private toGraphQLCode(statusCode: number, isTimeout: boolean): string {
    if (isTimeout) {
      return 'UPSTREAM_TIMEOUT';
    }

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
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      case 429:
        return 'RATE_LIMITED';
      default:
        return statusCode >= 500 ? 'UPSTREAM_SERVICE_ERROR' : 'INTERNAL_SERVER_ERROR';
    }
  }

  private extractMessage(payload: unknown): string | undefined {
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const message = (payload as { message?: unknown }).message;
      return typeof message === 'string' ? message : undefined;
    }

    return undefined;
  }

  private log(
    level: 'info' | 'warn' | 'error',
    requestId: string,
    operation: string,
    meta: Record<string, unknown>
  ): void {
    console[level](`[gateway][${this.serviceName}][${requestId}] ${operation}`, meta);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
