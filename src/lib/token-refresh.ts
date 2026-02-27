/**
 * Token Refresh Utility
 * Handles automatic token refresh when expired
 * Prevents infinite refresh loops and retries failed requests
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./token-storage";
import { refreshToken as apiRefreshToken } from "@/api/auth.api";

/**
 * Flag to track if a refresh is already in progress
 * Prevents multiple simultaneous refresh requests
 */
let isRefreshing = false;

/**
 * Queue of failed requests waiting for token refresh to complete
 */
let failedQueue: Array<{
    resolve: (token: unknown) => void;
    reject: (error: unknown) => void;
}> = [];

/**
 * Process queued requests after token refresh completes
 * @param token - The new access token
 */
const processQueue = (token: string): void => {
    failedQueue.forEach((prom) => prom.resolve(token));
    failedQueue = [];
};

/**
 * Handle queue on refresh failure
 * @param error - The error that occurred
 */
const processQueueOnError = (error: unknown): void => {
    failedQueue.forEach((prom) => prom.reject(error));
    failedQueue = [];
};

/**
 * Refresh the access token using the refresh token
 * @returns Promise resolving to new access token
 * @throws Error if refresh fails
 */
export const performTokenRefresh = async (): Promise<string> => {
    const refreshTokenValue = tokenStorage.getRefreshToken();

    if (!refreshTokenValue) {
        throw new Error("No refresh token available");
    }

    const response = await apiRefreshToken(refreshTokenValue);

    const newAccessToken = response.token;
    tokenStorage.setToken(newAccessToken);

    if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
    }

    return newAccessToken;
};

/**
 * Handle 401 Unauthorized error with automatic token refresh
 * Prevents infinite loops and retries the failed request
 * @param error - The axios error
 * @param apiClient - The axios instance to use for retry
 * @returns Promise with either the original error or retried response
 */
export const handleUnauthorizedError = async (
    error: AxiosError,
    apiClient: ReturnType<typeof axios.create>
): Promise<unknown> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
    };

    // Prevent infinite retry loops - only retry once
    if (originalRequest._retry) {
        isRefreshing = false;
        failedQueue = [];
        throw error;
    }

    if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        }).then((token: unknown) => {
            // Retry with new token
            originalRequest.headers.Authorization = `Bearer ${token as string}`;
            return apiClient(originalRequest);
        });
    }

    // Start refresh process
    isRefreshing = true;
    originalRequest._retry = true;

    try {
        const newToken = await performTokenRefresh();

        // Update authorization header for the failed request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Process queued requests
        processQueue(newToken);

        // Retry the original request
        return apiClient(originalRequest);
    } catch (refreshError) {
        processQueueOnError(refreshError);

        // Clear tokens and redirect to login on refresh failure
        tokenStorage.clearAllTokens();
        window.location.href = "/login";

        throw refreshError;
    } finally {
        isRefreshing = false;
    }
};

/**
 * Reset the refresh state
 * Useful for testing or manual reset scenarios
 */
export const resetRefreshState = (): void => {
    isRefreshing = false;
    failedQueue = [];
};
