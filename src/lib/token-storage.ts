/**
 * Token Storage Module
 * Centralized management of authentication tokens
 * Handles secure storage, retrieval, and cleanup
 */

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

/**
 * Token storage interface for dependency injection
 */
export interface ITokenStorage {
    getToken(): string | null;
    setToken(token: string): void;
    removeToken(): void;
    getRefreshToken(): string | null;
    setRefreshToken(token: string): void;
    removeRefreshToken(): void;
    clearAllTokens(): void;
    hasToken(): boolean;
}

/**
 * LocalStorage-based token storage implementation
 */
class TokenStorage implements ITokenStorage {
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    }

    removeToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    setRefreshToken(token: string): void {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }

    removeRefreshToken(): void {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    clearAllTokens(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    hasToken(): boolean {
        return this.getToken() !== null;
    }
}

/**
 * Singleton instance of token storage
 */
export const tokenStorage = new TokenStorage();
