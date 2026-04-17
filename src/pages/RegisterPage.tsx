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

    const containerVariants: any = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.1 } }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-12 sm:px-6 lg:px-8 overflow-hidden relative">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md"
            >
                <Card className="w-full glass-card rounded-3xl relative overflow-hidden hardware-top-border border-none" style={{ backdropFilter: 'blur(30px)', background: 'rgba(15, 23, 42, 0.6)' }}>

                    <div className="mb-10 text-center relative z-10 pt-8">
                        <motion.div variants={itemVariants}>
                            <Title level={1} className="headline-premium mb-2! text-white" style={{ fontSize: '2.5rem' }}>
                                {t('join_the_network')}
                            </Title>
                            <div className="flex items-center justify-center gap-2">
                                <Text className="sub-header-premium text-[11px]">{t('establish_identity')}</Text>
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
                        <motion.div variants={itemVariants}>
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

                        <motion.div variants={itemVariants}>
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

                        <motion.div variants={itemVariants}>
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

                        <motion.div variants={itemVariants}>
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

                        <motion.div variants={itemVariants}>
                            <Form.Item className="mb-8!">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    size="large"
                                    className="h-14 premium-btn rounded-xl tracking-wider text-white"
                                >
                                    {t('create_identity')}
                                </Button>
                            </Form.Item>
                        </motion.div>

                        <motion.div variants={itemVariants}>
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
