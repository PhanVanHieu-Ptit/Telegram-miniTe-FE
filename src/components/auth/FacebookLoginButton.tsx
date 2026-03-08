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
            icon={<FacebookFilled style={{ color: "#1877F2", fontSize: "18px" }} />}
            className="flex items-center justify-center gap-2 border-gray-300! hover:border-gray-400! hover:bg-gray-50!"
            block
            size="large"
        >
            Continue with Facebook
        </Button>
    );
};
