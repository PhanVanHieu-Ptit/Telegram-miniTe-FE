import { useAuthStore } from "@/store/auth.store";
import { useCallback } from "react";
import type { LoginDto, RegisterDto } from "@/api/auth.api";

/**
 * Custom hook for authentication logic
 * Provides a clean interface for components to interact with auth state
 */
export const useAuth = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const {
        user,
        loading,
        isAuthenticated,
        error,
        login,
        register,
        logout,
        clearError,
        fetchMe,
    } = useAuthStore();

    const handleLogin = useCallback(
        async (data: LoginDto) => {
            await login(data);
        },
        [login]
    );

    const handleGoogleLogin = useCallback(() => {
        // Redirect browser directly to backend Google auth endpoint
        window.location.href = `${apiBaseUrl}/auth/google`;
    }, [apiBaseUrl]);

    const handleRegister = useCallback(
        async (data: RegisterDto) => {
            await register(data);
        },
        [register]
    );

    const handleLogout = useCallback(() => {
        logout();
    }, [logout]);

    return {
        user,
        loading,
        isAuthenticated,
        error,
        login: handleLogin,
        loginWithGoogle: handleGoogleLogin,
        register: handleRegister,
        logout: handleLogout,
        clearError,
        fetchMe,
    };
};
