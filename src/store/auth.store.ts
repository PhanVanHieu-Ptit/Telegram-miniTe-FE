/**
 * Authentication Store
 * Zustand store for managing authentication state
 * Business logic is delegated to AuthService for separation of concerns
 */

import { create } from "zustand";
import type { User } from "@/types/chat.types";
import type { LoginDto, RegisterDto, AuthResponse } from "@/api/auth.api";
import { login as apiLogin, register as apiRegister, fetchMe as apiFetchMe } from "@/api/auth.api";
import { authService } from "@/services/auth.service";
import { tokenStorage } from "@/lib/token-storage";
import { transformHttpError } from "@/lib/http-error-handler";
import { ValidationError } from "@/types/error.types";

// ============================================================================
// State Interface
// ============================================================================

/**
 * Transform authentication response to User domain model
 */
const transformAuthResponseToUser = (response: AuthResponse): User => {
    return {
        id: response.user.id,
        displayName: response.user.username,
        online: true,
    };
};

interface AuthState {
    // State
    user: User | null;
    accessToken: string | null;
    workspaceId: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    initialized: boolean;
    authInitialized: boolean;

    // Actions
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterDto) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    initializeAuth: () => Promise<boolean>;
    fetchMe: () => Promise<User | null>;
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Authentication store using Zustand
 * Coordinates with AuthService for business logic
 */
export const useAuthStore = create<AuthState>((set) => ({
    // Initial state
    user: null,
    accessToken: null,
    workspaceId: null,
    loading: false,
    isAuthenticated: false,
    error: null,
    initialized: false,
    authInitialized: false,

    // ========================================================================
    // Login Action
    // ========================================================================
    /**
     * Login with email and password
     * - Calls authApi.login() with credentials
     * - Saves tokens to localStorage
     * - Transforms response to User domain model
     * - Updates store state on success
     * - Throws readable error on failure
     */
    login: async (data: LoginDto): Promise<void> => {
        set({ loading: true, error: null });

        try {
            // Call API directly
            const response: AuthResponse = await apiLogin(data);

            // Save tokens to localStorage
            tokenStorage.setToken(response.token);
            if (response.refreshToken) {
                tokenStorage.setRefreshToken(response.refreshToken);
            }

            // Transform response to User domain model
            const user: User = transformAuthResponseToUser(response);
            const workspaceId = (response as any).workspaceId || null;

            // Save user and workspace to storage
            tokenStorage.setUser(user);
            if (workspaceId) {
                tokenStorage.setWorkspaceId(workspaceId);
            }

            // Update store state with response data
            set({
                user,
                accessToken: response.token,
                workspaceId,
                isAuthenticated: true,
                loading: false,
                error: null,
            });
        } catch (error) {
            // Transform HTTP errors to readable messages
            const transformedError = transformHttpError(error);
            const errorMessage: string =
                transformedError instanceof Error
                    ? transformedError.message
                    : "Login failed";

            // Update store state with error
            set({
                loading: false,
                error: errorMessage,
                user: null,
                accessToken: null,
                isAuthenticated: false,
            });

            // Throw error with readable message
            throw transformedError;
        }
    },


    // ========================================================================
    // Register Action
    // ========================================================================
    /**
     * Register new user
     * - Validates password === confirmPassword
     * - Calls authApi.register() directly (no auto-login)
     * - Throws readable error on validation or API failure
     * - Does NOT set authentication state (user must login separately)
     */
    register: async (data: RegisterDto): Promise<void> => {
        set({ loading: true, error: null });

        try {
            // Validate passwords match
            if (data.password !== data.confirmPassword) {
                throw new ValidationError("Passwords do not match");
            }

            // Call registration API
            await apiRegister(data);

            // On success: clear loading, don't auto-login
            set({
                loading: false,
                error: null,
            });
        } catch (error) {
            // Transform HTTP errors to readable messages
            const transformedError = transformHttpError(error);
            const errorMessage: string =
                transformedError instanceof Error
                    ? transformedError.message
                    : "Registration failed";

            // Update store state with error
            set({
                loading: false,
                error: errorMessage,
            });

            // Throw error with readable message for component to handle
            throw transformedError;
        }
    },

    // ========================================================================
    // Logout Action
    // ========================================================================
    logout: async () => {
        // Delegate logout to service
        await authService.logout();

        // Clear store state
        set({
            user: null,
            accessToken: null,
            workspaceId: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        });
    },

    // ========================================================================
    // Clear Error Action
    // ========================================================================
    clearError: () => {
        set({ error: null });
    },

    // ========================================================================
    // Initialize Auth Action
    // ========================================================================
    initializeAuth: async (): Promise<boolean> => {
        const workspaceId = tokenStorage.getWorkspaceId();

        try {
            // Try to fetch user profile (supports both cookie-based and token-based auth)
            const apiUser = await apiFetchMe();
            const user = {
                id: apiUser.id,
                displayName: apiUser.username,
                online: true,
            };

            // Sync storage with latest data
            tokenStorage.setUser(user);

            set({
                user,
                accessToken: tokenStorage.getToken(),
                workspaceId: workspaceId || null,
                isAuthenticated: true,
                initialized: true,
                authInitialized: true,
                loading: false,
            });
            return true;
        } catch (error) {
            // If fetchMe fails, clear local data and set as not authenticated
            tokenStorage.clearAllTokens();
            set({
                accessToken: null,
                user: null,
                workspaceId: null,
                isAuthenticated: false,
                initialized: true,
                authInitialized: true,
                loading: false,
            });
            return false;
        }
    },

    /**
     * Fetch user profile (used after backend redirect)
     */
    fetchMe: async (): Promise<User | null> => {
        set({ loading: true, error: null });
        try {
            const apiUser = await apiFetchMe();
            const user = {
                id: apiUser.id,
                displayName: apiUser.username,
                online: true,
            };

            // Update storage and store
            tokenStorage.setUser(user);

            set({
                user,
                accessToken: tokenStorage.getToken(),
                isAuthenticated: true,
                loading: false,
                initialized: true,
                authInitialized: true,
            });

            return user;
        } catch (error) {
            const transformedError = transformHttpError(error);
            set({
                loading: false,
                error: transformedError instanceof Error ? transformedError.message : "Session expired",
                isAuthenticated: false,
            });
            tokenStorage.clearAllTokens();
            return null;
        }
    },
}));
