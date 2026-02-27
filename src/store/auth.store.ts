/**
 * Authentication Store
 * Zustand store for managing authentication state
 * Business logic is delegated to AuthService for separation of concerns
 */

import { create } from "zustand";
import type { User } from "@/types/chat.types";
import type { LoginDto, RegisterDto, AuthResponse } from "@/api/auth.api";
import { login as apiLogin, register as apiRegister } from "@/api/auth.api";
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
        displayName: response.user.name,
        online: true,
    };
};

interface AuthState {
    // State
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    initialized: boolean;
    authInitialized: boolean;

    // Actions
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterDto) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    initializeAuth: () => boolean;
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

            // Update store state with response data
            set({
                user,
                accessToken: response.token,
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
    logout: () => {
        // Delegate logout to service
        authService.logout();

        // Clear store state
        set({
            user: null,
            accessToken: null,
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
    initializeAuth: (): boolean => {
        // Read token from localStorage
        const token = tokenStorage.getToken();
        let isAuthenticated = false;
        if (token) {
            isAuthenticated = true;
        }
        set({
            accessToken: token || null,
            isAuthenticated,
            initialized: true,
            authInitialized: true,
        });
        return isAuthenticated;
    },
}));
