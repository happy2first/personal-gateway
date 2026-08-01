"use client";

import { Bar, Column, Line } from "@ant-design/charts";
import { DatePicker, Segmented } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Gateway.module.css";

type Period = "近48小时" | "近7天" | "自定义";

const sevenDayTrend = [
  { time: "周一", result: "成功", value: 86 }, { time: "周一", result: "失败", value: 4 },
  { time: "周二", result: "成功", value: 103 }, { time: "周二", result: "失败", value: 3 },
  { time: "周三", result: "成功", value: 92 }, { time: "周三", result: "失败", value: 6 },
  { time: "周四", result: "成功", value: 126 }, { time: "周四", result: "失败", value: 5 },
  { time: "周五", result: "成功", value: 148 }, { time: "周五", result: "失败", value: 4 },
];
const fortyEightHourPoints: Array<[string,number,number]> = [
  ["前天 20时", 11, 1], ["昨天 02时", 17, 0], ["昨天 08时", 24, 2], ["昨天 14时", 31, 1],
  ["昨天 20时", 28, 2], ["今天 02时", 15, 0], ["今天 08时", 36, 3], ["今天 14时", 42, 1],
];
const fortyEightHourTrend = fortyEightHourPoints.flatMap(([time,success,failed])=>[{time,result:"成功",value:success},{time,result:"失败",value:failed}]);
const serviceData = [
  ["QQ邮箱", 49, 3, "qq-mail"], ["百度网盘", 36, 2, "baidu"], ["印象笔记", 30, 1, "evernote"],
  ["公共金融行情", 18, 0, "finance-mcp"], ["办公日历", 7, 2, "office-api"],
].flatMap(([name, success, failed, id]) => [
  { name, result: "成功", value: success, id }, { name, result: "失败", value: failed, id },
]);
const endpointData = [
  ["个人数据只读 MCP", 89, 3, "personal-readonly"], ["家庭助手 MCP", 36, 2, "family"],
  ["私人 GPT OpenAPI", 17, 1, "private-gpt"],
].flatMap(([name, success, failed, id]) => [
  { name, result: "成功", value: success, id }, { name, result: "失败", value: failed, id },
]);
const riskTrend = [
  { time: "周一", value: 3 }, { time: "周二", value: 5 }, { time: "周三", value: 2 },
  { time: "周四", value: 8 }, { time: "周五", value: 6 },
];
const riskDistribution = [
  { name: "发送邮件", value: 9 }, { name: "下载附件", value: 7 }, { name: "上传文件", value: 4 },
  { name: "删除邮件", value: 2 }, { name: "删除文件", value: 2 },
];

function PeriodFilter({ value, onChange }: { value: Period; onChange: (value: Period) => void }) {
  return <div className={styles.chartFilter}>
    <Segmented size="small" value={value} options={["近48小时", "近7天", "自定义"]} onChange={onChange}/>
    {value === "自定义" ? <DatePicker.RangePicker size="small" allowClear/> : null}
  </div>;
}

function ChartCard({ title, note, children }: { title: string; note: string; children: (period:Period)=>React.ReactNode }) {
  const [period, setPeriod] = useState<Period>("近7天");
  return <section className={styles.chartCard}>
    <div className={styles.chartHeader}><div><h3>{title}</h3><p>{note}</p></div><PeriodFilter value={period} onChange={setPeriod}/></div>
    {children(period)}
  </section>;
}

export function DashboardCharts() {
  const router = useRouter();
  return <div className={styles.chartGrid}>
    <ChartCard title="端点调用趋势" note="按时间统计端点成功与失败调用">{period =>
      <Column key={period} data={period==="近48小时"?fortyEightHourTrend:sevenDayTrend} xField="time" yField="value" colorField="result" stack height={250} legend={{ color: { position: "top" } }}/>
    }
    </ChartCard>
    <ChartCard title="服务调用分布" note="调用量 Top 5，区分成功与失败">{period =>
      <Bar key={period} data={serviceData.map(item=>({...item,value:period==="近48小时"?Math.max(0,Math.round(Number(item.value)*.34)):item.value}))} xField="name" yField="value" colorField="result" stack height={250} legend={{ color: { position: "top" } }} onReady={chart => chart.on("element:click", (event: { data?: { data?: { id?: string } } }) => router.push("/calls?service=" + event.data?.data?.id))}/>
    }
    </ChartCard>
    <ChartCard title="端点调用分布" note="调用量 Top 5，区分成功与失败">{period =>
      <Bar key={period} data={endpointData.map(item=>({...item,value:period==="近48小时"?Math.max(0,Math.round(Number(item.value)*.34)):item.value}))} xField="name" yField="value" colorField="result" stack height={230} legend={{ color: { position: "top" } }} onReady={chart => chart.on("element:click", (event: { data?: { data?: { id?: string } } }) => router.push("/calls?endpoint=" + event.data?.data?.id))}/>
    }
    </ChartCard>
    <ChartCard title="高危能力调用趋势" note="统计高危能力的调用与确认行为">{period =>
      <Line key={period} data={period==="近48小时"?fortyEightHourTrend.filter(item=>item.result==="失败"):riskTrend} xField="time" yField="value" height={230} point={{ shapeField: "circle", sizeField: 4 }} style={{ lineWidth: 3 }}/>
    }
    </ChartCard>
    <ChartCard title="高危能力调用分布" note="高危能力调用量 Top 5">{period =>
      <Bar key={period} data={riskDistribution.map(item=>({...item,value:period==="近48小时"?Math.max(0,Math.round(item.value*.34)):item.value}))} xField="name" yField="value" height={230} label={{ text: "value" }}/>
    }
    </ChartCard>
  </div>;
}
