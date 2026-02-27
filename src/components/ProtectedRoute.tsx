
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";


interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
    // Zustand selectors to avoid stale state
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const authInitialized = useAuthStore((state) => state.authInitialized);
    const loading = useAuthStore((state) => state.loading);
    const initializeAuth = useAuthStore((state) => state.initializeAuth);

    useEffect(() => {
        if (!authInitialized) {
            initializeAuth();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authInitialized]);

    // Show loading guard while auth is initializing or loading
    if (!authInitialized || loading) {
        return <div>Loading...</div>;
    }

    // Redirect only after initialization
    if (authInitialized && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
