"use client";
import { Bar, Column } from "@ant-design/charts";
import { useRouter } from "next/navigation";
import styles from "./Gateway.module.css";

const trend=[
 {hour:"08",result:"成功",value:5},{hour:"08",result:"失败",value:1},{hour:"10",result:"成功",value:12},{hour:"10",result:"失败",value:0},
 {hour:"12",result:"成功",value:18},{hour:"12",result:"失败",value:1},{hour:"14",result:"成功",value:28},{hour:"14",result:"失败",value:2},
 {hour:"16",result:"成功",value:35},{hour:"16",result:"失败",value:1},{hour:"18",result:"成功",value:42},{hour:"18",result:"失败",value:2}
];
const serviceData=[{name:"QQ邮箱",value:52,id:"qq-mail"},{name:"百度网盘",value:38,id:"baidu"},{name:"印象笔记",value:31,id:"evernote"},{name:"公共金融行情",value:18,id:"finance-mcp"},{name:"办公日历",value:9,id:"office-api"}];
const endpointData=[{name:"个人数据只读 MCP",calls:92,rate:98.7,id:"personal-readonly"},{name:"家庭助手 MCP",calls:38,rate:96.4,id:"family"},{name:"私人 GPT OpenAPI",calls:18,rate:94.4,id:"private-gpt"}];

export function DashboardCharts(){
 const router=useRouter();
 return <div className={styles.chartGrid}>
  <section className={styles.chartCard}><h3>今日调用趋势</h3><p>按小时统计 AI 客户端调用，不含配置与测试操作</p><Column data={trend} xField="hour" yField="value" colorField="result" stack legend={{color:{position:"top"}}} height={260} onReady={chart=>chart.on("element:click",(e:{data?:{data?:{result?:string}}})=>router.push("/calls?date=today&result="+(e.data?.data?.result==="失败"?"failed":"success")))}/></section>
  <section className={styles.chartCard}><h3>服务调用分布</h3><p>今日调用 Top 5</p><Bar data={serviceData} xField="value" yField="name" height={260} label={{text:"value"}} onReady={chart=>chart.on("element:click",(e:{data?:{data?:{id?:string}}})=>router.push("/calls?service="+e.data?.data?.id))}/></section>
  <section className={styles.chartCard}><h3>端点调用分布</h3><p>调用次数与成功率</p><Bar data={endpointData} xField="calls" yField="name" height={230} label={{text:(d:{calls:number;rate:number})=>d.calls+" 次 · "+d.rate+"%"}} onReady={chart=>chart.on("element:click",(e:{data?:{data?:{id?:string}}})=>router.push("/calls?endpoint="+e.data?.data?.id))}/></section>
 </div>
}
