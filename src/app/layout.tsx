import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { theme } from "@/theme/theme";
import "./globals.css";

export const metadata: Metadata = { title: "个人网关", description: "Personal Gateway 管理后台原型" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><AntdRegistry><ConfigProvider theme={theme}>{children}</ConfigProvider></AntdRegistry></body></html>;
}
