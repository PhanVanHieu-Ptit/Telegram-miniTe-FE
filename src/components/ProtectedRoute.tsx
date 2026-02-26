import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps): ReactNode => {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};
