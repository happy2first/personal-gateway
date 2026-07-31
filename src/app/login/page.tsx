"use client";

import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "linear-gradient(135deg, #eef5ff, #f5f7fa)" }}>
    <Card style={{ width: "min(420px, 100%)", borderRadius: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}><SafetyCertificateOutlined style={{ fontSize: 42, color: "var(--pg-primary)" }} /><Typography.Title level={2} style={{ margin: "12px 0 4px" }}>个人网关</Typography.Title><Typography.Text type="secondary">安全连接个人工具与 AI 客户端</Typography.Text></div>
      <Alert type="info" showIcon message="原型演示账号：demo@personal.gateway / 任意密码" style={{ marginBottom: 20 }} />
      <Form layout="vertical" onFinish={() => router.push("/dashboard")} initialValues={{ email: "demo@personal.gateway" }}>
        <Form.Item name="email" label="管理员邮箱" rules={[{ required: true }]}><Input prefix={<UserOutlined />} size="large" /></Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password prefix={<LockOutlined />} size="large" placeholder="输入任意密码" /></Form.Item>
        <Button type="primary" htmlType="submit" size="large" block>登录管理后台</Button>
      </Form>
    </Card>
  </main>;
}
