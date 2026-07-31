"use client";
import { Button, Result } from "antd";
export default function ErrorPage({reset}:{reset:()=>void}){return <Result status="error" title="页面加载失败" subTitle="请检查网络后重试。" extra={<Button type="primary" onClick={reset}>重新加载</Button>}/>}
