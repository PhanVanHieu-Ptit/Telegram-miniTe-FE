import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { notification } from "antd";

type ApiErrorData = {
  message?: string;
  error?: string;
  detail?: string;
};

type ApiError = AxiosError<ApiErrorData>;

const apiBaseUrl: string | undefined = import.meta.env.VITE_API_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: ApiError): Promise<ApiError> => Promise.reject(error)
);

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    const dataMessage = error.response?.data?.message;
    const dataError = error.response?.data?.error;
    const dataDetail = error.response?.data?.detail;
    return dataMessage || dataError || dataDetail || error.message || "Request failed";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
};

const handleApiError = (error: unknown): ApiError | unknown => {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    notification.error({
      message: "Request Error",
      description: getErrorMessage(error),
      placement: "topRight",
    });

    return error;
  }

  notification.error({
    message: "Request Error",
    description: getErrorMessage(error),
    placement: "topRight",
  });

  return error;
};

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: ApiError): Promise<ApiError> => Promise.reject(handleApiError(error) as ApiError)
);

export default apiClient;
