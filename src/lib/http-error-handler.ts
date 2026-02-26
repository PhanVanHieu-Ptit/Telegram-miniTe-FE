/**
 * HTTP Error Handler
 * Transforms HTTP errors into typed, domain-specific errors
 * Separates HTTP concerns from business logic
 */

import { AxiosError } from "axios";
import { AuthError, AuthErrorCode } from "@/lib/auth-error";

/**
 * HTTP error response data structure
 */
export interface HttpErrorData {
    message?: string;
    error?: string;
    detail?: string;
    code?: string;
    status?: number;
}

/**
 * Checks if error is an Axios error with HttpErrorData
 */
export const isHttpError = (
    error: unknown
): error is AxiosError<HttpErrorData> => {
    return error instanceof AxiosError;
};

/**
 * Extract error message from various sources in HTTP response
 */
const extractErrorMessage = (error: AxiosError<HttpErrorData>): string => {
    return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Request failed"
    );
};

/**
 * Determine HTTP status code from error
 */
const getHttpStatus = (error: AxiosError<HttpErrorData>): number => {
    return error.response?.status || 0;
};

/**
 * Map HTTP status codes to authentication errors
 */
const mapHttpStatusToAuthError = (
    status: number,
    message: string
): AuthError => {
    switch (status) {
        case 400:
            return new AuthError(message, AuthErrorCode.VALIDATION_FAILED);
        case 401:
            return new AuthError(message, AuthErrorCode.UNAUTHORIZED);
        case 403:
            return new AuthError(message, AuthErrorCode.FORBIDDEN);
        case 404:
            return new AuthError(message, AuthErrorCode.USER_NOT_FOUND);
        case 409:
            return new AuthError(message, AuthErrorCode.USER_ALREADY_EXISTS);
        case 429:
            return new AuthError(
                "Too many requests. Please try again later.",
                AuthErrorCode.UNKNOWN_ERROR
            );
        case 500:
        case 502:
        case 503:
            return new AuthError(
                "Server error. Please try again later.",
                AuthErrorCode.UNKNOWN_ERROR
            );
        default:
            return new AuthError(message, AuthErrorCode.UNKNOWN_ERROR);
    }
};

/**
 * Transform HTTP error to typed AuthError
 * @param error - Axios error object
 * @returns AuthError with appropriate code and message
 */
export const transformHttpError = (
    error: unknown
): AuthError => {
    // Handle non-HTTP errors
    if (!isHttpError(error)) {
        if (error instanceof AuthError) {
            return error;
        }

        if (error instanceof Error) {
            return new AuthError(
                error.message,
                AuthErrorCode.NETWORK_ERROR,
                error
            );
        }

        return new AuthError(
            "An unexpected error occurred",
            AuthErrorCode.UNKNOWN_ERROR
        );
    }

    // Handle network errors (no response)
    if (!error.response) {
        return new AuthError(
            error.message || "Network error. Please check your connection.",
            AuthErrorCode.NETWORK_ERROR,
            error
        );
    }

    // Extract and transform HTTP error
    const status = getHttpStatus(error);
    const message = extractErrorMessage(error);

    return mapHttpStatusToAuthError(status, message);
};

/**
 * Check if error indicates unauthorized/unauthenticated state
 */
export const isUnauthorizedError = (error: unknown): error is AuthError => {
    if (!isHttpError(error)) {
        return false;
    }

    return error.response?.status === 401;
};
