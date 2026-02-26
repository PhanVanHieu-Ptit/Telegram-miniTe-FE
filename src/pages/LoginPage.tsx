import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

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

    const onFinish = async (values: LoginFormValues) => {
        setLoading(true);
        try {
            await login(values);
            message.success("Login successful!");
            navigate("/chat");
        } catch (error) {
            message.error(
                error instanceof Error ? error.message : "Login failed. Please check your credentials."
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
                        Welcome Back
                    </Title>
                    <Text type="secondary">Sign in to your account</Text>
                </div>

                <Form
                    form={form}
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    autoComplete="off"
                >
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
                            autoComplete="current-password"
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
                            Sign In
                        </Button>
                    </Form.Item>

                    <div className="text-center">
                        <Text type="secondary">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                Create one
                            </Link>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
