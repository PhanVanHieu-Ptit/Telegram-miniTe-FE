import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { message, Spin } from "antd";
import { googleLoginCallback } from "@/api/auth.api";
import { tokenStorage } from "@/lib/token-storage";

/**
 * Google Callback Page
 * Handles the redirect from Google/Backend after authentication
 * This component captures the authorization code or token from query parameters
 */
export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const fetchMe = useAuthStore((state) => state.fetchMe);
    const hasProcessed = useRef(false);

    useEffect(() => {
        // Prevent double processing in StrictMode
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const handleCallback = async () => {
            const code = searchParams.get("code");
            const token = searchParams.get("token");

            try {
                if (token) {
                    // Scenario A: Backend already exchanged code and sent token in URL
                    tokenStorage.setToken(token);
                    await fetchMe();
                    navigate("/chat", { replace: true });
                } else if (code) {
                    // Scenario B: Backend sent authorization code, frontend needs to exchange it
                    const response = await googleLoginCallback({ code });
                    
                    // Save tokens
                    tokenStorage.setToken(response.token);
                    if (response.refreshToken) {
                        tokenStorage.setRefreshToken(response.refreshToken);
                    }
                    
                    // Update user state
                    await fetchMe();
                    
                    message.success("Logged in with Google successfully!");
                    navigate("/chat", { replace: true });
                } else {
                    // No code or token found
                    console.error("No authentication data found in URL");
                    navigate("/sign-in", { replace: true });
                }
            } catch (error) {
                console.error("Google authentication failed:", error);
                message.error("Authentication failed. Please try again.");
                navigate("/sign-in", { replace: true });
            }
        };

        handleCallback();
    }, [searchParams, navigate, fetchMe]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
            <Spin size="large" />
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">Completing login...</h2>
                <p className="text-gray-500">Please wait while we finalize your session.</p>
            </div>
        </div>
    );
}
