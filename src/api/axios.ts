import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios";
import { tokenStorage } from "@/lib/token-storage";
import { handleUnauthorizedError } from "@/lib/token-refresh";

// ============================================================================
// Initialization
// ============================================================================

const apiBaseUrl: string | undefined = import.meta.env.VITE_API_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    "X-App-Version": "1.0.0",
    "X-Client-Type": "web",
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
  // Uncomment if backend requires cookies for auth
  // withCredentials: true,
});

// ============================================================================
// Interceptors
// ============================================================================

/**
 * Request interceptor: Inject authorization token from token storage
 * Separates concerns: token management is handled by tokenStorage module
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = tokenStorage.getToken();
    if (token) {
      // Attach Authorization header safely
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

/**
 * Response interceptor: Handle 401 Unauthorized with automatic token refresh
 * Attempts to refresh the access token and retry the failed request
 * Prevents infinite loops by tracking retry state
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: unknown): Promise<never> => {
    // Handle 401 Unauthorized with token refresh
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config
    ) {
      const url = error.config.url || "";
      // Do not handle 401 for login/register endpoints
      if (url.includes("/login") || url.includes("/register")) {
        // Return error as-is for caller to handle
        return Promise.reject(error);
      }
      try {
        await handleUnauthorizedError(
          error as AxiosError,
          apiClient
        );
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    // Return error as-is for caller to handle
    return Promise.reject(error);
  }
);

export default apiClient;
