"use client";
import { Button, Card, Form, Input, Typography } from "antd";
import { useRouter } from "next/navigation";
export default function Login(){const router=useRouter();return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:16}}><Card style={{width:"min(420px,100%)"}}><Typography.Title level={2}>个人网关</Typography.Title><Typography.Paragraph type="secondary">高保真交互原型 · 全部使用 Mock Data</Typography.Paragraph><Form layout="vertical" onFinish={()=>router.push("/dashboard")}><Form.Item label="邮箱"><Input defaultValue="demo@personal.gateway"/></Form.Item><Form.Item label="密码"><Input.Password defaultValue="demo"/></Form.Item><Button type="primary" htmlType="submit" block>登录管理后台</Button></Form></Card></main>}
