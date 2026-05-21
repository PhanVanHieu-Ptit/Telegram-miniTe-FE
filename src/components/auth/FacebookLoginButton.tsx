import { Button } from "antd";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { FacebookFilled } from "@ant-design/icons";
import { cn } from "@/lib/utils";

/**
 * Facebook Login Button component
 * Follows Facebook's branding guidelines
 */
export const FacebookLoginButton = ({ className }: { className?: string }) => {
    const { loginWithFacebook } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        setLoading(true);
        loginWithFacebook();
    };

    return (
        <Button
            onClick={handleLogin}
            loading={loading}
            icon={<FacebookFilled style={{ color: "#1877F2", fontSize: "20px" }} />}
            className={cn("flex items-center justify-center gap-3 h-12 rounded-xl transition-all duration-300 font-medium", className)}
            block
            size="large"
        >
            Continue with Facebook
        </Button>
    );
};
