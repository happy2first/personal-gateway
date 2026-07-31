"use client";
import { ApiOutlined, DashboardOutlined, DatabaseOutlined, SafetyCertificateOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Space, Tag } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./AppShell.module.css";
const nav=[
 {key:"/dashboard",label:"首页",icon:<DashboardOutlined/>},
 {key:"/services",label:"服务接入",icon:<DatabaseOutlined/>},
 {key:"/endpoints",label:"端点发布",icon:<ApiOutlined/>},
 {key:"/calls",label:"调用记录",icon:<SafetyCertificateOutlined/>},
 {key:"/settings",label:"设置",icon:<SettingOutlined/>}
];
function active(path:string){const root=path.split("/").filter(Boolean)[0]||"dashboard";return "/"+root}
export function BackButton({fallback}:{fallback:string}){const router=useRouter();return <Button className={styles.back} onClick={()=>{if(window.history.length>1)router.back();else router.push(fallback)}}>返回</Button>}
export function AppShell({path,children}:{path:string;children:ReactNode}){
 const selected=active(path);const secondary=path.split("/").filter(Boolean).length>1;
 const mobileTitle=path==="/services/new"?"新增服务":path==="/endpoints/new"?"新增端点":path.startsWith("/services/")?"服务详情":path.startsWith("/endpoints/")?"端点详情":path.startsWith("/calls/")?"调用详情":"个人网关";
 return <Layout className={styles.shell}>
  <Layout.Sider width={228} breakpoint="lg" collapsedWidth={76} className={styles.sider}>
   <div className={styles.brand}><span className={styles.brandMark}><SafetyCertificateOutlined/></span><span className="brandText">个人网关</span></div>
   <Menu mode="inline" selectedKeys={[selected]} items={nav.map(x=>({...x,label:<Link href={x.key}>{x.label}</Link>}))}/>
  </Layout.Sider>
  <div className={styles.body}>
   <header className={styles.desktopTop}><Space>{secondary?<BackButton fallback={selected}/>:null}<span className={styles.dot}/><span>{secondary?mobileTitle:"网关运行中"}</span></Space><Space><Avatar icon={<UserOutlined/>}/><span>管理员</span></Space></header>
   <header className={styles.mobileTop}>{secondary?<Space><BackButton fallback={selected}/><strong>{mobileTitle}</strong></Space>:<Space><span className={styles.brandMark}><SafetyCertificateOutlined/></span><strong>个人网关</strong></Space>}<Tag color="success">运行中</Tag></header>
   <main className={styles.content}>{children}</main>
  </div>
  <nav className={styles.bottom} aria-label="移动端主导航">{nav.map(x=><Link key={x.key} href={x.key} className={selected===x.key?styles.active:""}>{x.icon}<span>{x.label}</span></Link>)}</nav>
 </Layout>
}
