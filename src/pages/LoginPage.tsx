import { useEffect, useState } from "react";
import { Form, Input, Button, Card, Typography, message, Flex } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/auth.store";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { FacebookLoginButton } from "@/components/auth/FacebookLoginButton";

const { Title, Text } = Typography;

interface LoginFormValues {
    email: string;
    password: string;
}

export default function LoginPage() {
    const { t } = useTranslation();
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
            message.success(t('login_successful'));
        } catch (error) {
            message.error(
                error instanceof Error ? error.message : t('login_failed')
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
                <Card className="w-full glass-card neon-border rounded-3xl relative overflow-hidden border-none" style={{ backdropFilter: 'blur(30px)', background: 'rgba(15, 23, 42, 0.6)' }}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
                    <div className="mb-10 text-center relative z-10 pt-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            <Title level={1} className="headline-premium mb-2! text-white" style={{ fontSize: '2.75rem' }}>
                                {t('welcome_back')}
                            </Title>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
                                <Text className="sub-header-premium">{t('access_neural_link')}</Text>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
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
                        className="relative z-10 px-4"
                    >
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: t('designation_required') },
                                    { type: "email", message: t('invalid_frequency_format') },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="mr-2 text-primary/70" />}
                                    placeholder={t('neural_id_placeholder')}
                                    autoComplete="email"
                                    className="premium-input py-4 px-4"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: t('security_key_required') },
                                    { min: 6, message: t('insecure_key_length') },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="mr-2 text-primary/70" />}
                                    placeholder={t('encryption_key_placeholder')}
                                    autoComplete="current-password"
                                    className="premium-input py-4 px-4"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <Form.Item className="mb-10!">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    size="large"
                                    className="h-14 mesh-btn rounded-2xl tracking-widest text-white shadow-xl"
                                >
                                    {t('access_link')}
                                </Button>
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                            <div className="mb-8 space-y-6">
                                <div className="flex items-center justify-center gap-4">
                                    <div className="h-px flex-1 bg-white/5"></div>
                                    <span className="sub-header-premium text-[10px] whitespace-nowrap opacity-60">{t('secure_protocols')}</span>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>
                                <Flex vertical justify="center" align="center" gap={16}>
                                    <GoogleLoginButton className="w-full h-12 rounded-xl font-semibold bg-white/5! border-white/10! hover:bg-white/10! transition-colors" />
                                    <FacebookLoginButton className="w-full h-12 rounded-xl font-semibold bg-white/5! border-white/10! hover:bg-white/10! transition-colors" />
                                </Flex>
                            </div>

                            <div className="text-center mt-12 pb-6">
                                <Text className="text-white/40 text-sm">
                                    {t('unconnected_to_grid')}{" "}
                                    <Link
                                        to="/auth/register"
                                        className="font-bold text-primary hover:text-accent transition-all duration-300 underline-offset-8 hover:underline"
                                    >
                                        {t('establish_connection')}
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
