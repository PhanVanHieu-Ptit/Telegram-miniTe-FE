import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/auth.store";
import type { RegisterDto } from "@/api/auth.api";

const { Title, Text } = Typography;

interface RegisterFormValues extends RegisterDto { }

export default function RegisterPage() {
    const { t } = useTranslation();
    const [form] = Form.useForm<RegisterFormValues>();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);

    const onFinish = async (values: RegisterFormValues) => {
        setLoading(true);
        try {
            await register(values);
            message.success(t('registration_successful'));
            form.resetFields();
            setTimeout(() => navigate("/sign-in"), 1000);
        } catch (error) {
            message.error(error instanceof Error ? error.message : t('registration_failed'));
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
                    <div className="mb-10 text-center relative z-10 pt-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            <Title level={1} className="headline-premium mb-2! text-white" style={{ fontSize: '2.5rem' }}>
                                {t('join_the_network')}
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
                        name="register"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        autoComplete="off"
                        className="relative z-10"
                    >
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <Form.Item
                                name="username"
                                rules={[{ required: true, message: t('designation_required') }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="mr-2 text-muted" />}
                                    placeholder={t('neural_handle_placeholder')}
                                    autoComplete="off"
                                    className="premium-input py-3 px-4"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: t('identification_required') },
                                    { type: "email", message: t('invalid_frequency_format') },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="mr-2 text-muted" />}
                                    placeholder={t('neural_id_placeholder')}
                                    autoComplete="email"
                                    className="premium-input py-3 px-4"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: t('security_key_required') },
                                    { min: 6, message: t('insecure_key_length') },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="mr-2 text-muted" />}
                                    placeholder={t('encryption_key_placeholder')}
                                    autoComplete="new-password"
                                    className="premium-input py-3 px-4"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <Form.Item
                                name="confirmPassword"
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: t('validation_required') },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("password") === value) return Promise.resolve();
                                            return Promise.reject(new Error(t('key_mismatch_detected')));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="mr-2 text-muted" />}
                                    placeholder={t('validate_encryption_key_placeholder')}
                                    autoComplete="new-password"
                                    className="premium-input py-3 px-4"
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
                                    className="h-14 mesh-btn rounded-2xl tracking-widest text-white shadow-xl"
                                >
                                    {t('create_identity')}
                                </Button>
                            </Form.Item>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                            <div className="text-center mt-6">
                                <Text className="text-white/40 text-sm">
                                    {t('already_synced_to_grid')}{" "}
                                    <Link
                                        to="/sign-in"
                                        className="font-bold text-primary hover:text-white transition-all duration-300 underline-offset-4 hover:underline"
                                    >
                                        {t('initiate_link')}
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
