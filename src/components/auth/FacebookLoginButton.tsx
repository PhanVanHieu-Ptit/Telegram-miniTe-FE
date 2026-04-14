import { Button } from "antd";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { FacebookFilled } from "@ant-design/icons";

/**
 * Facebook Login Button component
 * Follows Facebook's branding guidelines
 */
export const FacebookLoginButton = () => {
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
            className="flex items-center justify-center gap-3 bg-white/5! border-white/10! hover:border-primary/50! hover:bg-white/10! text-white! h-12 rounded-xl transition-all duration-300 font-medium"
            block
            size="large"
        >
            Continue with Facebook
        </Button>
    );
};
