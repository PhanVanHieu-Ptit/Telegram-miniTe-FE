/**
 * Authentication Store
 * Zustand store for managing authentication state
 * Business logic is delegated to AuthService for separation of concerns
 */

import { create } from "zustand";
import type { User } from "@/types/chat.types";
import type { LoginDto, RegisterDto } from "@/api/auth.api";
import { authService } from "@/services/auth.service";
import { tokenStorage } from "@/lib/token-storage";

// ============================================================================
// State Interface
// ============================================================================

interface AuthState {
    // State
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    // Actions
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterDto) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    initializeAuth: () => void;
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

    // ========================================================================
    // Login Action
    // ========================================================================
    login: async (data: LoginDto) => {
        set({ loading: true, error: null });

        try {
            // Delegate to service
            const result = await authService.login(data);

            // Update store state with result
            set({
                user: result.user,
                accessToken: result.accessToken,
                isAuthenticated: true,
                loading: false,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Login failed";

            set({
                loading: false,
                error: errorMessage,
                user: null,
                accessToken: null,
                isAuthenticated: false,
            });

            throw error;
        }
    },

    // ========================================================================
    // Register Action
    // ========================================================================
    register: async (data: RegisterDto) => {
        set({ loading: true, error: null });

        try {
            // Delegate to service
            const result = await authService.register(data);

            // Update store state with result
            set({
                user: result.user,
                accessToken: result.accessToken,
                isAuthenticated: true,
                loading: false,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Registration failed";

            set({
                loading: false,
                error: errorMessage,
                user: null,
                accessToken: null,
                isAuthenticated: false,
            });

            throw error;
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
    initializeAuth: () => {
        // Check if token exists in storage
        const token = tokenStorage.getToken();

        if (token && authService.hasValidToken()) {
            set({
                accessToken: token,
                isAuthenticated: true,
            });
        } else {
            set({
                accessToken: null,
                isAuthenticated: false,
            });
        }
    },
}));
