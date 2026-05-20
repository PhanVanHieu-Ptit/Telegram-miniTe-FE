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
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

/**
 * Google Login callback data
 */
export interface GoogleLoginCallbackDto {
    code: string;
}

// ============================================================================
// Response Data Transfer Objects
// ============================================================================

/**
 * User data from backend
 */
export interface AuthUserDto {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    /** JWT returned by /auth/me so cookie-only auth users get a usable token */
    token?: string;
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
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
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
    // Only send username, email, password to backend
    const { username, email, password } = payload;
    const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        { username, email, password }
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

/**
 * Fetch current user profile
 * @returns Promise of the current user's data
 */
export const fetchMe = async (): Promise<AuthUserDto> => {
    const response = await apiClient.get<AuthUserDto>("/auth/me");
    return response.data;
};

/**
 * Handle Google OAuth2 callback
 * @deprecated The backend handles the callback and redirects back to frontend
 * @param payload - Authorization code from Google
 * @returns Promise of AuthResponse
 */
export const googleLoginCallback = async (
    payload: GoogleLoginCallbackDto
): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
        "/auth/google/callback",
        payload
    );
    return response.data;
};

/**
 * Logout from the server
 */
export const logout = async (): Promise<void> => {
    await apiClient.post("/auth/logout");
};
