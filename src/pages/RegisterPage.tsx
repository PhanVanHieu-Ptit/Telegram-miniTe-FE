import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import type { RegisterDto } from "@/api/auth.api";

const { Title, Text } = Typography;

interface RegisterFormValues extends RegisterDto { }

export default function RegisterPage() {
    const [form] = Form.useForm<RegisterFormValues>();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);

    const onFinish = async (values: RegisterFormValues) => {
        setLoading(true);
        try {
            await register(values);
            message.success("Registration successful! Redirecting to login...");
            form.resetFields();
            setTimeout(() => navigate("/sign-in"), 1000);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Registration failed.");
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
                <Card className="w-full glass-card rounded-3xl relative overflow-hidden" style={{ border: 'none' }}>
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    <div className="mb-10 text-center relative z-10 pt-6">
                        <motion.div variants={itemVariants}>
                            <Title level={1} className="mb-2! font-bold tracking-tight text-glow" style={{ color: "white", fontSize: '2.5rem' }}>
                                Join the Network
                            </Title>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/30"></div>
                                <Text className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Establish Identity</Text>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/30"></div>
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
                                rules={[{ required: true, message: "Please enter your full name" }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-primary/60 mr-2" />}
                                    placeholder="Username"
                                    autoComplete="off"
                                    className="bg-white/5 border-white/10 hover:border-primary/50 focus:border-primary! text-white rounded-xl py-3 px-4 transition-all duration-300 placeholder:text-white/20"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div variants={itemVariants}>
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

                        <motion.div variants={itemVariants}>
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
                                    autoComplete="new-password"
                                    className="bg-white/5 border-white/10 hover:border-primary/50 focus:border-primary! text-white rounded-xl py-3 px-4 transition-all duration-300 placeholder:text-white/20"
                                />
                            </Form.Item>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Form.Item
                                name="confirmPassword"
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: "Please confirm your password" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("password") === value) return Promise.resolve();
                                            return Promise.reject(new Error("Passwords do not match"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-primary/60 mr-2" />}
                                    placeholder="Confirm Password"
                                    autoComplete="new-password"
                                    className="bg-white/5 border-white/10 hover:border-primary/50 focus:border-primary! text-white rounded-xl py-3 px-4 transition-all duration-300 placeholder:text-white/20"
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
                                    className="h-14 primary-gradient border-none rounded-xl font-bold tracking-widest text-white shadow-[0_10px_20px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.01] hover:shadow-[0_15px_30px_rgba(168,85,247,0.4)]"
                                >
                                    CREATE IDENTITY
                                </Button>
                            </Form.Item>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <div className="text-center mt-6">
                                <Text className="text-white/40 text-sm">
                                    Already have an account?{" "}
                                    <Link
                                        to="/sign-in"
                                        className="font-bold text-primary hover:text-white transition-all duration-300 underline-offset-4 hover:underline"
                                    >
                                        Sign in
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
