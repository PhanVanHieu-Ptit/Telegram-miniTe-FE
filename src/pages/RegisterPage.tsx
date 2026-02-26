import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
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
            navigate("/login");
        } catch (error) {
            message.error(
                error instanceof Error ? error.message : "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg">
                <div className="mb-8 text-center">
                    <Title level={2} className="mb-2!">
                        Create Account
                    </Title>
                    <Text type="secondary">Sign up to get started</Text>
                </div>

                <Form
                    form={form}
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    autoComplete="off"
                >
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[
                            {
                                required: true,
                                message: "Please enter your full name",
                            },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-400" />}
                            placeholder="Full Name"
                            autoComplete="off"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            {
                                required: true,
                                message: "Please enter your email",
                            },
                            {
                                type: "email",
                                message: "Please enter a valid email address",
                            },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined className="text-gray-400" />}
                            placeholder="Email address"
                            autoComplete="email"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            {
                                required: true,
                                message: "Please enter your password",
                            },
                            {
                                min: 6,
                                message: "Password must be at least 6 characters",
                            },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Password"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm Password"
                        dependencies={["password"]}
                        rules={[
                            {
                                required: true,
                                message: "Please confirm your password",
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error("Passwords do not match")
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400" />}
                            placeholder="Confirm Password"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    <Form.Item className="mb-4!">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Create Account
                        </Button>
                    </Form.Item>

                    <div className="text-center">
                        <Text type="secondary">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                Sign in
                            </Link>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
