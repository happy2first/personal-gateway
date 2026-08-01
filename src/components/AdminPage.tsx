"use client";
import { ApiOutlined, DeleteOutlined, FilterOutlined, MailOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Collapse, Descriptions, Drawer, Empty, Form, Input, Modal, Radio, Select, Skeleton, Space, Switch, Table, Tabs, Tag, Timeline, message } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardCharts } from "./Charts";
import { EndpointWizard, ServiceWizard } from "./Wizards";
import { mockGatewayService } from "@/services/mock/gateway-service";
import type { Call, Endpoint, Service, Status } from "@/services/contracts/gateway";
import { calls as allCalls, endpoints as allEndpoints, services as allServices } from "@/mocks/data";
import styles from "./Gateway.module.css";

const statusMap:Record<Status,{text:string;color:string}>={running:{text:"运行中",color:"success"},error:{text:"异常",color:"error"},untested:{text:"未测试",color:"default"},disabled:{text:"已停用",color:"default"}};
function StatusTag({value}:{value:Status}){const x=statusMap[value];return <Tag color={x.color}>{x.text}</Tag>}
function Header({title,subtitle,extra}:{title:string;subtitle:string;extra?:React.ReactNode}){return <div className={styles.pageHeader}><div><h1>{title}</h1><div className={styles.subtitle}>{subtitle}</div></div>{extra}</div>}
function Loading(){return <Card><Skeleton active paragraph={{rows:6}}/></Card>}
const sname=(id:string)=>allServices.find(x=>x.id===id)?.name??id;
const ename=(id:string)=>allEndpoints.find(x=>x.id===id)?.name??id;
const cname=(sid:string,cid:string)=>allServices.find(x=>x.id===sid)?.capabilities.find(x=>x.id===cid)?.name??cid;

export function AdminPage({path}:{path:string}){
 const parts=path.split("/").filter(Boolean);const root=parts[0]??"dashboard";const id=parts[1];
 if(root==="dashboard")return <Dashboard/>;
 if(root==="services"&&id==="new")return <><Header title="新增服务" subtitle="选择服务类型，并通过向导完成 Mock 配置"/><ServiceWizard/></>;
 if(root==="services"&&id)return <ServiceDetail id={id}/>;
 if(root==="services")return <ServiceList/>;
 if(root==="endpoints"&&id==="new")return <><Header title="新增端点" subtitle="选择服务与能力，并发布为 MCP 或 OpenAPI"/><EndpointWizard/></>;
 if(root==="endpoints"&&id)return <EndpointDetail id={id}/>;
 if(root==="endpoints")return <EndpointList/>;
 if(root==="calls"&&id)return <CallDetail id={id}/>;
 if(root==="calls")return <CallList/>;
 if(root==="settings")return <Settings/>;
 return <Card><Empty description="页面不存在"/></Card>;
}

function Dashboard(){
 return <><Header title="个人网关" subtitle="将个人数字服务统一发布为标准、安全、可授权的 AI 能力端点" extra={<StatusTag value="running"/>}/>
  <div className={styles.metrics}>{[["已接入服务","5"],["已发布端点","3"],["今日 AI 调用","148"],["今日失败","4"]].map(([x,v])=><div className={styles.metric} key={x}><span className={styles.muted}>{x}</span><strong>{v}</strong></div>)}</div>
  <DashboardCharts/><RecentCalls limit={5}/>
 </>;
}

function ServiceList(){
 const [data,setData]=useState<Service[]|null>(null);useEffect(()=>{void mockGatewayService.services().then(setData)},[]);
 return <><Header title="全部服务" subtitle="接入并管理个人数字服务，能力在服务详情中统一维护" extra={<Button type="primary" icon={<PlusOutlined/>} href="/services/new">新增服务</Button>}/>
  {!data?<Loading/>:data.length?<><div className={styles.cards}>{data.map(s=><Link key={s.id} href={"/services/"+s.id}><Card hoverable className={styles.entity}><div className={styles.entityTop}><div><h3>{s.name}</h3><div className={styles.muted}>{s.description}</div></div><StatusTag value={s.status}/></div><div className={styles.entityMeta}><Tag>{s.type}</Tag><Tag>{s.category}</Tag><span>{s.capabilities.length} 项能力</span><span>{s.transport}</span></div></Card></Link>)}</div></>:<Card className={styles.empty}><Empty description="暂无服务" image={Empty.PRESENTED_IMAGE_SIMPLE}/><Button type="primary" href="/services/new">新增服务</Button></Card>}
 </>;
}

function ServiceDetail({id}:{id:string}){
 const [item,setItem]=useState<Service>();useEffect(()=>{void mockGatewayService.service(id).then(setItem)},[id]);if(!item)return <Loading/>;
 const capability=<Space direction="vertical" style={{width:"100%"}}>{item.capabilities.map(c=><Card size="small" key={c.id}><div className={styles.capRow}><span><strong>{c.name}</strong><br/><small className={styles.muted}>{c.id} · {c.description}</small></span><Tag>{c.risk==="read"?"只读":c.risk==="delete"?"高危":"写入"}</Tag></div></Card>)}</Space>;
 const overview=<div className={styles.detailGrid}><Card title="基本信息"><Descriptions column={{xs:1,sm:2}} items={[{key:"code",label:"服务标识",children:item.code},{key:"type",label:"类型",children:item.type},{key:"category",label:"分类",children:item.category},{key:"status",label:"状态",children:<StatusTag value={item.status}/>},{key:"transport",label:"连接方式",children:item.transport},{key:"updated",label:"更新时间",children:item.updatedAt}]}/></Card><Card title="运行控制"><Space direction="vertical" style={{width:"100%"}}><Switch defaultChecked checkedChildren="已启用" unCheckedChildren="已停用"/><Button block href={"/calls?service="+item.id}>查看调用记录</Button><Button danger block onClick={()=>Modal.confirm({title:"确认停用该服务？",content:"停用后关联端点将无法调用此服务。",okText:"确认停用",okButtonProps:{danger:true}})}>停用服务</Button></Space></Card></div>;
 return <><Header title={item.name} subtitle={item.description} extra={<Space><StatusTag value={item.status}/><Button>编辑</Button></Space>}/><Card><Tabs tabBarGutter={24} items={[
  {key:"overview",label:"概览",children:overview},{key:"capabilities",label:"原始能力",children:capability},
  {key:"connection",label:"连接与认证",children:<><Alert type="info" showIcon message="这里只管理上游连接与认证" description="界面仅展示认证方式与状态，不显示任何 Secret；对外认证在端点发布中配置。"/><Descriptions style={{marginTop:16}} column={1} bordered items={[{key:"transport",label:"上游连接方式",children:item.transport},{key:"auth",label:"上游认证",children:"已配置（已脱敏）"},{key:"tls",label:"TLS",children:"已启用"}]}/></>},
  {key:"test",label:"测试",children:<Space direction="vertical" style={{width:"100%"}}><Alert type="success" showIcon message="最近一次 Mock 测试成功"/><Timeline items={[{color:"green",children:"18:32 连接测试成功"},{color:"blue",children:"18:31 发现并保存原始能力 Schema 快照"},{color:"gray",children:"昨天 21:08 上游认证校验成功"}]}/><Button type="primary" icon={<ReloadOutlined/>} onClick={()=>message.success("连接及原始能力测试成功")}>重新测试</Button></Space>},
  {key:"linked",label:"关联端点",children:<div className={styles.cards}>{allEndpoints.filter(e=>e.serviceIds.includes(item.id)).map(e=><Link key={e.id} href={"/endpoints/"+e.id}><Card hoverable><div className={styles.entityTop}><strong>{e.name}</strong><StatusTag value={e.status}/></div><div className={styles.entityMeta}><Tag>{e.protocol}</Tag><span>{item.capabilities.length} 项能力</span></div></Card></Link>)}</div>},
  {key:"calls",label:"调用记录",children:<RecentCalls serviceId={item.id} limit={5}/>}
 ]}/></Card></>;
}

function EndpointList(){
 const [data,setData]=useState<Endpoint[]|null>(null);useEffect(()=>{void mockGatewayService.endpoints().then(setData)},[]);
 return <><Header title="端点发布" subtitle="把一个或多个服务的能力，对外发布为标准端点" extra={<Button type="primary" icon={<PlusOutlined/>} href="/endpoints/new">新增端点</Button>}/>{!data?<Loading/>:<div className={styles.cards}>{data.map(e=><Link href={"/endpoints/"+e.id} key={e.id}><Card hoverable className={styles.entity}><div className={styles.entityTop}><div><h3>{e.name}</h3><div className={styles.muted}>{e.description}</div></div><StatusTag value={e.status}/></div><div className={styles.entityMeta}><Tag color="blue">{e.protocol}</Tag><span>{e.serviceIds.length} 个服务</span><span>{e.callers.length} 个调用方</span><span>{e.calls} 次 · {e.successRate}%</span></div></Card></Link>)}</div>}</>;
}

function EndpointDetail({id}:{id:string}){
 const [item,setItem]=useState<Endpoint>();useEffect(()=>{void mockGatewayService.endpoint(id).then(setItem)},[id]);if(!item)return <Loading/>;
 const overview=<div className={styles.detailGrid}><Card title="端点信息"><Descriptions column={1} bordered items={[{key:"protocol",label:"协议",children:item.protocol},{key:"status",label:"状态",children:<StatusTag value={item.status}/>},{key:"url",label:"Endpoint URL",children:<Input readOnly value={item.url} addonAfter={<Button type="link" onClick={()=>message.success("已复制")}>复制</Button>}/>} ,{key:"rate",label:"成功率",children:item.successRate+"%"},{key:"calls",label:"今日调用",children:item.calls+" 次"}]}/></Card><Card title="运行控制"><Space direction="vertical" style={{width:"100%"}}><Switch defaultChecked checkedChildren="运行中" unCheckedChildren="已停用"/><Button href={"/calls?endpoint="+item.id} block>查看调用记录</Button><Button danger block onClick={()=>Modal.confirm({title:"确认停用端点？",content:"所有调用方将立即无法调用。",okText:"停用",okButtonProps:{danger:true}})}>停用端点</Button></Space></Card></div>;
 const conversionTab=<Space direction="vertical" style={{width:"100%"}}>{item.serviceIds.map(id=>{const s=allServices.find(x=>x.id===id)!;return <Collapse key={id} items={[{key:id,label:<Space><strong>{s.name}</strong><Tag color="blue">{s.type+" → "+item.protocol}</Tag></Space>,children:<Descriptions column={1} bordered items={s.capabilities.slice(0,3).map(c=>({key:c.id,label:c.name,children:<Space direction="vertical"><span>原始能力：<code>{c.id}</code></span><span>对外能力：<code>{item.protocol==="MCP"?c.id.replace(/-/g,"_"):"/"+c.id.replace(/-/g,"/")}</code></span><span>对外 Schema：已生成</span><StatusTag value="running"/></Space>}))}/> }]} />})}</Space>;
 const permissionTab=<PermissionSummary serviceIds={item.serviceIds}/>;
 const callerTab=<div className={styles.cards}>{item.callers.map(c=><Card key={c.id}><div className={styles.entityTop}><strong>{c.name}</strong><StatusTag value={c.status}/></div><p className={styles.muted}>{c.vendor} · {c.auth}</p><Space><Button>独立授权</Button><Button>查看日志</Button></Space></Card>)}</div>;
 return <><Header title={item.name} subtitle={item.description} extra={<Space><StatusTag value={item.status}/><Button>编辑</Button></Space>}/><Card><Tabs items={[{key:"overview",label:"概览",children:overview},{key:"conversion",label:"能力与转换",children:conversionTab},{key:"permission",label:"权限",children:permissionTab},{key:"auth",label:"认证",children:<Alert type="info" showIcon message={item.protocol==="MCP"?"下游 OAuth 2.1 已配置；Token 不在界面展示":"下游 API Key 已配置；仅显示前缀 pg_live_••••"}/>},{key:"callers",label:"调用方",children:callerTab},{key:"test",label:"测试",children:<><Alert type="success" showIcon message="端点协议、转换、权限和调用方 Mock 测试通过"/><Button style={{marginTop:16}}>重新测试</Button></>},{key:"calls",label:"调用记录",children:<RecentCalls endpointId={item.id} limit={5}/>} ]}/></Card></>;
}

function PermissionSummary({serviceIds}:{serviceIds:string[]}){return <Space direction="vertical" style={{width:"100%"}}>{serviceIds.map(id=>{const s=allServices.find(x=>x.id===id)!;return <Collapse key={id} items={[{key:id,label:<strong>{s.name}</strong>,children:s.capabilities.map(c=><div className={styles.envRow} key={c.id}><span>{c.name}</span><Tag color={c.permission==="allow"?"success":c.permission==="deny"?"error":"warning"}>{c.permission==="allow"?"允许":c.permission==="deny"?"禁止":"每次确认"}</Tag></div>)}]}/>})}</Space>}

function RecentCalls({limit=5,serviceId,endpointId}:{limit?:number;serviceId?:string;endpointId?:string}){
 const data=allCalls.filter(x=>(!serviceId||x.serviceId===serviceId)&&(!endpointId||x.endpointId===endpointId)).slice(0,limit);
 return <Card title="最近调用" extra={<Button type="link" href="/calls">查看全部</Button>}><CallViews data={data}/></Card>
}
function CallViews({data}:{data:Call[]}){
 const columns=[{title:"时间",dataIndex:"time",render:(v:string)=>v.slice(11)},{title:"Vendor / Client",key:"client",render:(_:unknown,r:Call)=>r.vendor+" / "+r.client},{title:"Endpoint",key:"endpoint",render:(_:unknown,r:Call)=><>{ename(r.endpointId)}<br/><small>{r.endpointProtocol}</small></>},{title:"Service",key:"service",render:(_:unknown,r:Call)=><>{sname(r.serviceId)}<br/><small>{r.serviceType}</small></>},{title:"Capability",key:"cap",render:(_:unknown,r:Call)=><>{r.externalCapability}<br/><small>{cname(r.serviceId,r.capabilityId)}</small></>},{title:"Conversion",dataIndex:"conversionType"},{title:"Result",dataIndex:"result",render:(v:string)=><Tag color={v==="success"?"success":"error"}>{v==="success"?"成功":"失败"}</Tag>},{title:"Duration",dataIndex:"duration",render:(v:number)=>v+" ms"},{title:"RequestID",dataIndex:"id",render:(v:string)=><Link href={"/calls/"+v}>{v}</Link>}];
 return <>{data.length?<><div className={styles.desktopTable}><Table rowKey="id" size="small" pagination={false} dataSource={data} columns={columns}/></div><div className={styles.mobileCards}>{data.map(x=><Link href={"/calls/"+x.id} key={x.id}><Card size="small"><div className={styles.entityTop}><strong>{cname(x.serviceId,x.capabilityId)}</strong><Tag color={x.result==="success"?"success":"error"}>{x.result==="success"?"成功":"失败"}</Tag></div><div className={styles.entityMeta}><span>{x.time.slice(11)}</span><span>{x.client}</span><span>{sname(x.serviceId)}</span><span>{x.duration} ms</span></div></Card></Link>)}</div></>:<Empty description="暂无调用记录"/>}</>
}

function CallList(){
 const [data,setData]=useState<Call[]|null>(null);const [drawer,setDrawer]=useState(false);const [filters,setFilters]=useState({vendor:"",endpoint:"",service:"",result:"",keyword:""});
 useEffect(()=>{const q=new URLSearchParams(window.location.search);queueMicrotask(()=>setFilters(f=>({...f,endpoint:q.get("endpoint")??"",service:q.get("service")??"",result:q.get("result")??""})));void mockGatewayService.calls().then(setData)},[]);
 const shown=useMemo(()=>data?.filter(x=>(!filters.vendor||x.vendor===filters.vendor)&&(!filters.endpoint||x.endpointId===filters.endpoint)&&(!filters.service||x.serviceId===filters.service)&&(!filters.result||x.result===filters.result)&&(!filters.keyword||(x.id+x.client+x.message).toLowerCase().includes(filters.keyword.toLowerCase())))??[],[data,filters]);
 const form=<Form layout="vertical"><Form.Item label="时间"><Select defaultValue="today" options={[{label:"今天",value:"today"},{label:"最近 7 天",value:"7d"},{label:"最近 30 天",value:"30d"}]}/></Form.Item><Form.Item label="Vendor"><Select allowClear value={filters.vendor||undefined} onChange={v=>setFilters(f=>({...f,vendor:v??""}))} options={["OpenAI","Anthropic","Google"].map(x=>({label:x,value:x}))}/></Form.Item><Form.Item label="Endpoint"><Select allowClear value={filters.endpoint||undefined} onChange={v=>setFilters(f=>({...f,endpoint:v??""}))} options={allEndpoints.map(x=>({label:x.name,value:x.id}))}/></Form.Item><Form.Item label="Service"><Select allowClear value={filters.service||undefined} onChange={v=>setFilters(f=>({...f,service:v??""}))} options={allServices.map(x=>({label:x.name,value:x.id}))}/></Form.Item><Form.Item label="成功失败"><Select allowClear value={filters.result||undefined} onChange={v=>setFilters(f=>({...f,result:v??""}))} options={[{label:"成功",value:"success"},{label:"失败",value:"failed"}]}/></Form.Item><Form.Item label="关键词"><Input.Search value={filters.keyword} onChange={e=>setFilters(f=>({...f,keyword:e.target.value}))}/></Form.Item></Form>;
 return <><Header title="调用记录" subtitle="统一记录 Client → Endpoint → Service → Capability → Result" extra={<Button icon={<FilterOutlined/>} onClick={()=>setDrawer(true)}>筛选</Button>}/><Card><div className={styles.desktopTable}>{form}</div>{!data?<Skeleton active/>:<CallViews data={shown}/>}</Card><Drawer open={drawer} title="筛选调用记录" placement="bottom" height="90%" onClose={()=>setDrawer(false)}><>{form}<Button type="primary" block onClick={()=>setDrawer(false)}>应用筛选</Button></></Drawer></>;
}
function CallDetail({id}:{id:string}){const x=allCalls.find(x=>x.id===id);if(!x)return <Card><Empty description="调用记录不存在"/></Card>;const chain=[["调用方",x.client],["端点",ename(x.endpointId)],["对外能力",x.externalCapability],["来源服务",sname(x.serviceId)],["原始能力",cname(x.serviceId,x.capabilityId)],["上游结果",x.result==="success"?"成功":"失败"]];return <><Header title="调用详情" subtitle={x.id} extra={<Tag color={x.result==="success"?"success":"error"}>{x.result==="success"?"成功":"失败"}</Tag>}/><div className={styles.detailGrid}><Card title="完整调用链" className={styles.full}><div className={styles.flow}>{chain.map(([a,v])=><span key={a} className={styles.flowNode}>{a}<br/><strong>{v}</strong></span>)}</div></Card><Card title="请求信息"><Descriptions column={1} items={[{key:"time",label:"时间",children:x.time},{key:"vendor",label:"Vendor",children:x.vendor},{key:"endpointProtocol",label:"Endpoint Protocol",children:x.endpointProtocol},{key:"serviceType",label:"Service Type",children:x.serviceType},{key:"conversion",label:"Conversion Type",children:x.conversionType},{key:"duration",label:"Duration",children:x.duration+" ms"},{key:"id",label:"Request ID",children:x.id}]}/></Card><Card title="上游结果"><Alert type={x.result==="success"?"success":"error"} showIcon message={x.message} description={"上游错误摘要："+x.upstreamError}/></Card></div></>}

function Settings(){
 const confirmClear=()=>Modal.confirm({title:"确认清空调用记录？",content:"此操作不可撤销。当前为 Mock，不会删除真实数据。",okText:"清空",okButtonProps:{danger:true}});
 return <><Header title="设置" subtitle="运行控制、数据、系统状态、身份认证与通知"/><div className={styles.settingsStack}>
  <Card title="运行控制"><Space wrap><Tag color="success">运行中</Tag><Button onClick={()=>Modal.confirm({title:"确认暂停网关？",content:"暂停后所有 AI 调用将被阻断。",okText:"确认暂停"})}>暂停</Button><Button type="primary" disabled>恢复</Button></Space></Card>
  <Card title="数据"><Form layout="inline"><Form.Item label="调用记录保留"><Radio.Group defaultValue={90} options={[30,90,180].map(x=>({label:x+" 天",value:x}))}/></Form.Item><Button danger icon={<DeleteOutlined/>} onClick={confirmClear}>清空记录</Button></Form></Card>
  <Card title="系统状态"><Descriptions column={{xs:1,sm:2}} bordered items={[["Supabase","正常"],["Upstash","正常"],["Resend","正常"],["Vercel","正常"],["版本号","v0.2.0-prototype"],["部署时间","2026-08-01 20:10"]].map(([a,b])=>({key:a,label:a,children:<Space>{b==="正常"?<StatusTag value="running"/>:b}</Space>}))}/><Collapse style={{marginTop:16}} items={[{key:"env",label:"环境变量（仅显示变量名与状态）",children:<>{["NEXT_PUBLIC_APP_ENV","SUPABASE_URL","UPSTASH_URL","RESEND_FROM"].map(x=><div className={styles.envRow} key={x}><code>{x}</code><Tag color="success">已配置</Tag></div>)}</>}]} /></Card>
  <Card title="身份认证（预留）"><Descriptions column={1} items={[{key:"provider",label:"服务",children:"Supabase Auth"},{key:"password",label:"密码登录",children:<Tag color="success">可用</Tag>},{key:"passkey",label:"Passkey",children:<Tag>即将支持</Tag>}]}/><Alert type="info" showIcon message="Passkey 仅作原型预留，本版本不实现。"/></Card>
  <Card title="通知"><Form layout="vertical" style={{maxWidth:560}}><Form.Item label="通知接收邮箱" extra="用于凭证到期、服务异常等告警，不是管理员账号。"><Input prefix={<MailOutlined/>} defaultValue="notify@example.com"/></Form.Item><Button type="primary" icon={<ApiOutlined/>} onClick={()=>message.success("Mock 测试通知发送成功")}>发送测试通知</Button></Form></Card>
 </div></>;
}
