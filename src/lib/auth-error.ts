/**
 * Authentication-specific error types
 * Extends the base AppError class with auth-specific codes and utilities
 */

import { AppError } from "@/types/error.types";

/**
 * Authentication error codes
 */
export const AuthErrorCode = {
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    TOKEN_INVALID: "TOKEN_INVALID",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    USER_NOT_FOUND: "USER_NOT_FOUND",
    USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
    VALIDATION_FAILED: "VALIDATION_FAILED",
    SESSION_EXPIRED: "SESSION_EXPIRED",
    NETWORK_ERROR: "NETWORK_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode];

/**
 * Authentication-specific error class
 */
export class AuthError extends AppError {
    constructor(
        message: string,
        code: AuthErrorCode = AuthErrorCode.UNKNOWN_ERROR,
        details?: unknown
    ) {
        super(message, code, details);
        this.name = "AuthError";
    }

    /**
     * Check if the error is a session/token expiration error
     */
    isSessionExpired(): boolean {
        return (
            this.code === AuthErrorCode.TOKEN_EXPIRED ||
            this.code === AuthErrorCode.SESSION_EXPIRED ||
            this.code === AuthErrorCode.UNAUTHORIZED
        );
    }

    /**
     * Check if the error is clientside validation related
     */
    isValidationError(): boolean {
        return this.code === AuthErrorCode.VALIDATION_FAILED;
    }

    /**
     * Check if the error is network related
     */
    isNetworkError(): boolean {
        return this.code === AuthErrorCode.NETWORK_ERROR;
    }
}

/**
 * Predefined authentication errors for common scenarios
 */
export const AuthErrors = {
    invalidCredentials: new AuthError(
        "Email or password is incorrect",
        AuthErrorCode.INVALID_CREDENTIALS
    ),
    sessionExpired: new AuthError(
        "Your session has expired. Please login again.",
        AuthErrorCode.SESSION_EXPIRED
    ),
    unauthorized: new AuthError(
        "Unauthorized access. Please login.",
        AuthErrorCode.UNAUTHORIZED
    ),
    userNotFound: new AuthError(
        "User not found",
        AuthErrorCode.USER_NOT_FOUND
    ),
    userAlreadyExists: new AuthError(
        "User with this email already exists",
        AuthErrorCode.USER_ALREADY_EXISTS
    ),
    networkError: new AuthError(
        "Network error. Please check your connection.",
        AuthErrorCode.NETWORK_ERROR
    ),
};
