import { Button, Result } from "antd";
export default function NotFound(){return <Result status="404" title="页面不存在" extra={<Button type="primary" href="/dashboard">返回首页</Button>}/>}
