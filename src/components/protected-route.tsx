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

    // Show loading guard while auth is initializing or loading
    if (!authInitialized) {
        return <div>Loading...</div>;
    }

    // Redirect to sign-in only after initialization
    if (!isAuthenticated) {
        return <Navigate to="/sign-in" replace />;
    }

    return <>{children}</>;
}
