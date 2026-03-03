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
    getUser(): any | null;
    setUser(user: any): void;
    removeUser(): void;
    getWorkspaceId(): string | null;
    setWorkspaceId(id: string): void;
    removeWorkspaceId(): void;
    clearAllTokens(): void;
    hasToken(): boolean;
}

const USER_KEY = "auth_user";
const WORKSPACE_KEY = "auth_workspace_id";

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
        localStorage.removeItem(TOKEN_KEY)
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

    getUser(): any | null {
        try {
            const user = localStorage.getItem(USER_KEY);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error("Failed to parse user from storage", error);
            return null;
        }
    }

    setUser(user: any): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    removeUser(): void {
        localStorage.removeItem(USER_KEY);
    }

    getWorkspaceId(): string | null {
        return localStorage.getItem(WORKSPACE_KEY);
    }

    setWorkspaceId(id: string): void {
        localStorage.setItem(WORKSPACE_KEY, id);
    }

    removeWorkspaceId(): void {
        localStorage.removeItem(WORKSPACE_KEY);
    }

    clearAllTokens(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(WORKSPACE_KEY);
    }

    hasToken(): boolean {
        return this.getToken() !== null;
    }
}

/**
 * Singleton instance of token storage
 */
export const tokenStorage = new TokenStorage();
