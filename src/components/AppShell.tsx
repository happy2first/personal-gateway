"use client";
import { ApiOutlined, DashboardOutlined, DatabaseOutlined, LeftOutlined, SafetyCertificateOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Modal, Space, Tag } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import styles from "./AppShell.module.css";
const nav=[
 {key:"/dashboard",label:"首页",icon:<DashboardOutlined/>},
 {key:"/services",label:"服务接入",icon:<DatabaseOutlined/>},
 {key:"/endpoints",label:"端点发布",icon:<ApiOutlined/>},
 {key:"/calls",label:"调用记录",icon:<SafetyCertificateOutlined/>},
 {key:"/settings",label:"设置",icon:<SettingOutlined/>}
];
function active(path:string){const root=path.split("/").filter(Boolean)[0]||"dashboard";return "/"+root}
export function BackButton({fallback,confirmLeave=false}:{fallback:string;confirmLeave?:boolean}){const router=useRouter();const [confirmOpen,setConfirmOpen]=useState(false);const go=()=>{const current=window.location.pathname;if(window.history.length<=1){router.push(fallback);return}router.back();window.setTimeout(()=>{if(window.location.pathname===current)router.replace(fallback)},450)};return <><Button type="text" icon={<LeftOutlined/>} aria-label="返回" className={styles.back} onClick={()=>confirmLeave?setConfirmOpen(true):go()}>返回</Button><Modal open={confirmOpen} title="放弃未保存的更改？" okText="放弃并退出" cancelText="继续编辑" okButtonProps={{danger:true}} onCancel={()=>setConfirmOpen(false)} onOk={()=>{setConfirmOpen(false);go()}}>退出后，本次向导中尚未保存的内容将丢失。</Modal></>}
export function AppShell({path,children}:{path:string;children:ReactNode}){
 const selected=active(path);const parts=path.split("/").filter(Boolean);const secondary=parts.length>1;
 const fallback=parts.length>2&&(parts[0]==="services"||parts[0]==="endpoints")?"/"+parts[0]+"/"+parts[1]:selected;
 const mobileTitle=path==="/services/new"?"新增服务":path==="/endpoints/new"?"新增端点":path.startsWith("/services/")?"服务详情":path.startsWith("/endpoints/")?"端点详情":path.startsWith("/calls/")?"调用详情":"个人网关";
 return <Layout className={styles.shell}>
  <Layout.Sider width={228} breakpoint="lg" collapsedWidth={76} className={styles.sider}>
   <div className={styles.brand}><span className={styles.brandMark}><SafetyCertificateOutlined/></span><span className="brandText">个人网关</span></div>
   <Menu mode="inline" selectedKeys={[selected]} items={nav.map(x=>({...x,label:<Link href={x.key}>{x.label}</Link>}))}/>
  </Layout.Sider>
  <div className={styles.body}>
   <header className={styles.desktopTop}><Space>{secondary?<BackButton fallback={fallback} confirmLeave={path.endsWith("/new")}/>:null}<span className={styles.dot}/><span>{secondary?mobileTitle:"网关运行中"}</span></Space><Space><Avatar icon={<UserOutlined/>}/><span>管理员</span></Space></header>
   <header className={styles.mobileTop}>{secondary?<div className={styles.mobileBackGroup}><BackButton fallback={fallback} confirmLeave={path.endsWith("/new")}/><strong>{mobileTitle}</strong></div>:<Space><span className={styles.brandMark}><SafetyCertificateOutlined/></span><strong>个人网关</strong></Space>}{!path.endsWith("/new")&&(path.startsWith("/services/")||path.startsWith("/endpoints/"))?<Tag color="success">运行中</Tag>:null}</header>
   <main className={styles.content}>{children}</main>
  </div>
  <nav className={styles.bottom} aria-label="移动端主导航">{nav.map(x=><Link key={x.key} href={x.key} className={selected===x.key?styles.active:""}>{x.icon}<span>{x.label}</span></Link>)}</nav>
 </Layout>
}
