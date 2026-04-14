import { useEffect, useState } from "react";
import { Form, Input, Button, Card, Typography, message, Flex } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { FacebookLoginButton } from "@/components/auth/FacebookLoginButton";

const { Title, Text } = Typography;

interface LoginFormValues {
    email: string;
    password: string;
}

export default function LoginPage() {
    const [form] = Form.useForm<LoginFormValues>();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const authInitialized = useAuthStore((state) => state.authInitialized);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        if (authInitialized && isAuthenticated) {
            navigate("/chat", { replace: true });
        }
    }, [authInitialized, isAuthenticated, navigate]);

    const onFinish = async (values: LoginFormValues) => {
        setLoading(true);
        try {
            await login(values);
            message.success("Login successful!");
        } catch (error) {
            message.error(
                error instanceof Error ? error.message : "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12 sm:px-6 lg:px-8 overflow-hidden relative">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md"
            >
                <Card className="w-full glass-card rounded-3xl relative overflow-hidden" style={{ border: 'none' }}>
                    
                    {/* Futuristic top glow line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    <div className="mb-10 text-center relative z-10 pt-6">
                        <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            <Title level={1} className="mb-2! font-bold tracking-tight text-glow" style={{ color: "white", fontSize: '2.5rem' }}>
                                Welcome Back
                            </Title>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/30"></div>
                                <Text className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Initiate Link</Text>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/30"></div>
                            </div>
                        </motion.div>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        autoComplete="off"
                        className="relative z-10"
                    >
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: "Please enter your email" },
                                    { type: "email", message: "Please enter a valid email address" },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="text-primary/60 mr-2" />}
                                    placeholder="Email address"
                                    autoComplete="email"
                                    className="bg-white/5 border-white/10 hover:border-primary/50 focus:border-primary! text-white rounded-xl py-3 px-4 transition-all duration-300 placeholder:text-white/20"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: "Please enter your password" },
                                    { min: 6, message: "Password must be at least 6 characters" },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-primary/60 mr-2" />}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    className="bg-white/5 border-white/10 hover:border-primary/50 focus:border-primary! text-white rounded-xl py-3 px-4 transition-all duration-300 placeholder:text-white/20"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <Form.Item className="mb-8!">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    size="large"
                                    className="h-14 primary-gradient border-none rounded-xl font-bold tracking-widest text-white shadow-[0_10px_20px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.01] hover:shadow-[0_15px_30px_rgba(168,85,247,0.4)]"
                                >
                                    ACCESS LINK
                                </Button>
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                            <div className="mb-8 space-y-6">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="h-px bg-white/10 flex-1"></div>
                                    <span className="text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">Secure Access</span>
                                    <div className="h-px bg-white/10 flex-1"></div>
                                </div>
                                <Flex vertical justify="center" align="center" gap={16}>
                                    <GoogleLoginButton />
                                    <FacebookLoginButton />
                                </Flex>
                            </div>

                            <div className="text-center mt-10">
                                <Text className="text-white/40 text-sm">
                                    New to the system?{" "}
                                    <Link
                                        to="/auth/register"
                                        className="font-bold text-primary hover:text-white transition-all duration-300 underline-offset-4 hover:underline"
                                    >
                                        Establish Connection
                                    </Link>
                                </Text>
                            </div>
                        </motion.div>
                    </Form>
                </Card>
            </motion.div>
        </div>
    );
}
