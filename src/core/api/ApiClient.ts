import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/ErrorCodes';
import { logger } from '../logging';
import { withRetry } from '../retry';
import { getAuth } from 'firebase/auth';

interface RequestConfig extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  retry?: boolean;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

const DEFAULT_TIMEOUT = 30000;

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private async getAuthToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  private async buildHeaders(config: RequestConfig): Promise<HeadersInit> {
    const headers = { ...this.defaultHeaders };

    if (!config.skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (config.headers) {
      const customHeaders = config.headers as Record<string, string>;
      Object.assign(headers, customHeaders);
    }

    return headers;
  }

  private async executeRequest<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const timeout = config.timeout || DEFAULT_TIMEOUT;

    const headers = await this.buildHeaders(config);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await this.parseErrorBody(response);
        throw this.createHttpError(response.status, errorBody, response.statusText);
      }

      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AppError(
          'Network request failed. Please check your connection.',
          ErrorCodes.NETWORK_OFFLINE,
          { originalError: error.message }
        );
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AppError(
          'Request timed out. Please try again.',
          ErrorCodes.NETWORK_TIMEOUT,
          { timeout }
        );
      }

      throw new AppError(
        'An unexpected error occurred',
        ErrorCodes.UNKNOWN,
        { originalError: String(error) }
      );
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    if (contentType.includes('text/')) {
      return response.text() as unknown as Promise<T>;
    }
    return response.blob() as unknown as Promise<T>;
  }

  private async parseErrorBody(response: Response): Promise<unknown> {
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch {
      return null;
    }
  }

  private createHttpError(status: number, body: unknown, statusText: string): AppError {
    let code: string;
    let message: string;

    switch (status) {
      case 400:
        code = ErrorCodes.VALIDATION_INVALID_INPUT;
        message = typeof body === 'object' && body !== null && 'message' in body
          ? (body as any).message
          : 'Invalid request';
        break;
      case 401:
        code = ErrorCodes.AUTH_UNAUTHORIZED;
        message = 'Authentication required';
        break;
      case 403:
        code = ErrorCodes.AUTH_FORBIDDEN;
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        code = ErrorCodes.VALIDATION_NOT_FOUND;
        message = 'The requested resource was not found';
        break;
      case 409:
        code = ErrorCodes.VALIDATION_DUPLICATE;
        message = 'This resource already exists';
        break;
      case 422:
        code = ErrorCodes.VALIDATION_INVALID_INPUT;
        message = typeof body === 'object' && body !== null && 'message' in body
          ? (body as any).message
          : 'Validation failed';
        break;
      case 429:
        code = ErrorCodes.NETWORK_RATE_LIMIT;
        message = 'Too many requests. Please try again later.';
        break;
      case 500: case 502: case 503: case 504:
        code = ErrorCodes.NETWORK_SERVER_ERROR;
        message = 'Server error. Please try again later.';
        break;
      default:
        code = ErrorCodes.UNKNOWN;
        message = statusText || 'An unexpected error occurred';
    }

    return new AppError(message, code, { status, body });
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const operation = () => this.executeRequest<T>(endpoint, config);

    if (config.retry !== false) {
      return withRetry(operation, `API: ${config.method || 'GET'} ${endpoint}`);
    }

    return operation();
  }

  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

const baseURL = import.meta.env.VITE_API_URL || '';
export const apiClient = new ApiClient(baseURL);

export { ApiClient };
export type { RequestConfig, ApiResponse };
