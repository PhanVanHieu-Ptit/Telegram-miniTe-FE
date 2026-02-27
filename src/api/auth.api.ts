/**
 * Authentication API Layer
 * Thin HTTP layer for auth endpoints
 * Error handling is delegated to the service layer for proper transformation
 */

import apiClient from "./axios";

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Login request data
 */
export interface LoginDto {
    email: string;
    password: string;
}

/**
 * Registration request data
 */
export interface RegisterDto {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

// ============================================================================
// Response Data Transfer Objects
// ============================================================================

/**
 * User data from backend
 */
export interface AuthUserDto {
    id: string;
    name: string;
    email: string;
}

/**
 * Authentication response from server
 */
export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user: AuthUserDto;
}

/**
 * Refresh token response from server
 */
export interface RefreshTokenResponse {
    token: string;
    refreshToken?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Make a POST request to the login endpoint
 * Delegates error handling to the service layer
 * @param payload - Login credentials
 * @returns Promise of AuthResponse
 * @throws Raw HTTP errors are caught and transformed by the service
 */
export const login = async (payload: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/login", payload);
    return response.data;
};

/**
 * Make a POST request to the registration endpoint
 * Delegates error handling to the service layer
 * @param payload - Registration data
 * @returns Promise of AuthResponse
 * @throws Raw HTTP errors are caught and transformed by the service
 */
export const register = async (
    payload: RegisterDto
): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
        "/register",
        payload
    );
    return response.data;
};

/**
 * Refresh access token using refresh token
 * @param refreshToken - The refresh token
 * @returns Promise of RefreshTokenResponse
 * @throws Raw HTTP errors are caught and transformed by the service
 */
export const refreshToken = async (
    refreshToken: string
): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>(
        "/refresh",
        { refreshToken }
    );
    return response.data;
};
