/**
 * Authentication Service
 * Core business logic for authentication
 * Coordinates between API layer and storage, decoupled from UI/store
 */

import type { User } from "@/types/chat.types";
import type { LoginDto, RegisterDto, AuthResponse } from "@/api/auth.api";
import { login as apiLogin, register as apiRegister } from "@/api/auth.api";
import { tokenStorage } from "@/lib/token-storage";
import { transformHttpError } from "@/lib/http-error-handler";

/**
 * Transformation of API response to User domain model
 */
const transformAuthResponseToUser = (response: AuthResponse): User => {
    return {
        id: response.user.id,
        displayName: response.user.name,
        online: true,
    };
};

/**
 * Result type for authentication operations
 */
export interface AuthResult {
    user: User;
    accessToken: string;
    refreshToken?: string;
}

/**
 * Authentication Service
 * Handles authentication business logic in isolation
 */
export class AuthService {
    /**
     * Refresh access token using refresh token
     * Called automatically by axios interceptor on 401
     * @throws {AuthError} If refresh fails
     */
    async refreshToken(): Promise<AuthResult> {
        try {
            const refreshTokenValue = this.getRefreshToken();
            if (!refreshTokenValue) {
                throw new Error("No refresh token available");
            }

            const { refreshToken: apiRefresh } = await import("@/api/auth.api");
            const response = await apiRefresh(refreshTokenValue);

            tokenStorage.setToken(response.token);

            if (response.refreshToken) {
                tokenStorage.setRefreshToken(response.refreshToken);
            }

            return {
                user: { id: "", displayName: "", online: true },
                accessToken: response.token,
                refreshToken: response.refreshToken,
            };
        } catch (error) {
            throw transformHttpError(error);
        }
    }

    /**
     * Login with email and password
     * @throws {AuthError} If login fails
     */
    async login(credentials: LoginDto): Promise<AuthResult> {
        try {
            const response = await apiLogin(credentials);

            const user = transformAuthResponseToUser(response);
            tokenStorage.setToken(response.token);

            if (response.refreshToken) {
                tokenStorage.setRefreshToken(response.refreshToken);
            }

            return {
                user,
                accessToken: response.token,
                refreshToken: response.refreshToken,
            };
        } catch (error) {
            throw transformHttpError(error);
        }
    }

    /**
     * Register new user
     * @throws {AuthError} If registration fails
     */
    async register(data: RegisterDto): Promise<AuthResult> {
        try {
            const response = await apiRegister(data);

            const user = transformAuthResponseToUser(response);
            tokenStorage.setToken(response.token);

            if (response.refreshToken) {
                tokenStorage.setRefreshToken(response.refreshToken);
            }

            return {
                user,
                accessToken: response.token,
                refreshToken: response.refreshToken,
            };
        } catch (error) {
            throw transformHttpError(error);
        }
    }

    /**
     * Logout: clear all tokens and auth data
     */
    logout(): void {
        tokenStorage.clearAllTokens();
    }

    /**
     * Check if user has valid token
     */
    hasValidToken(): boolean {
        return tokenStorage.hasToken();
    }

    /**
     * Get stored access token
     */
    getAccessToken(): string | null {
        return tokenStorage.getToken();
    }

    /**
     * Get stored refresh token
     */
    getRefreshToken(): string | null {
        return tokenStorage.getRefreshToken();
    }
}

/**
 * Singleton instance of authentication service
 */
export const authService = new AuthService();
