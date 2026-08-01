import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { theme } from "@/theme/theme";
import "antd/dist/reset.css";
import "./globals.css";
export const metadata:Metadata={title:"个人网关",description:"安全发布个人数字服务的 AI 能力端点"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){
 return <html lang="zh-CN"><body><AntdRegistry><ConfigProvider theme={theme}>{children}</ConfigProvider></AntdRegistry></body></html>;
}
