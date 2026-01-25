import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Timeout configuration (in milliseconds)
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const LONG_OPERATION_TIMEOUT = 60000; // 60 seconds for long operations

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Initial retry delay

// Store selected gateway ID in sessionStorage for persistence
function getSelectedGatewayId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("selectedGatewayId");
}

function setSelectedGatewayId(gatewayId: string | null): void {
  if (typeof window === "undefined") return;
  if (gatewayId) {
    sessionStorage.setItem("selectedGatewayId", gatewayId);
  } else {
    sessionStorage.removeItem("selectedGatewayId");
  }
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable (network errors, 5xx errors, timeout)
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network error or timeout
    return true;
  }
  const status = error.response.status;
  // Retry on 5xx errors (server errors) and 429 (rate limit)
  return status >= 500 || status === 429;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token and gateway ID
    this.client.interceptors.request.use(
      async (config) => {
        if (typeof window !== "undefined") {
          const session = await getSession();
          if (session?.accessToken) {
            config.headers.Authorization = `Bearer ${session.accessToken}`;
          }
          
          // Add gateway ID to query params if not already present and endpoint supports it
          const selectedGatewayId = getSelectedGatewayId();
          if (selectedGatewayId && config.url && !config.params?.gatewayId) {
            // Only add gatewayId for endpoints that need it (not for gateway list itself)
            if (!config.url.includes("/gateways") || config.url.includes("/gateways/")) {
              config.params = { ...config.params, gatewayId: selectedGatewayId };
            }
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        // Extract error message from response
        let errorMessage = error.message || "An error occurred";
        
        if (error.response?.data) {
          const data = error.response.data as any;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          } else if (data.errorMessage) {
            errorMessage = data.errorMessage;
          } else if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.join(", ");
          }
        }
        
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).status = error.response?.status;
        (enhancedError as any).response = error.response;
        return Promise.reject(enhancedError);
      }
    );
  }

  /**
   * Execute a request with automatic retry for transient failures
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof AxiosError && isRetryableError(error) && attempt < retries) {
          // Calculate exponential backoff delay
          const backoffDelay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`API request failed, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${retries})`, error.message);
          await delay(backoffDelay);
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.get<T>(url, config);
      return response.data;
    });
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Don't retry POST requests by default as they may not be idempotent
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // PUT is idempotent, so it's safe to retry
    return this.executeWithRetry(async () => {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // DELETE is idempotent, so it's safe to retry
    return this.executeWithRetry(async () => {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    });
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Don't retry PATCH requests by default as they may not be idempotent
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
  
  /**
   * Get with extended timeout for long-running operations
   */
  async getLongOperation<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.get<T>(url, {
        ...config,
        timeout: LONG_OPERATION_TIMEOUT,
      });
      return response.data;
    });
  }
}

export const apiClient = new ApiClient();
