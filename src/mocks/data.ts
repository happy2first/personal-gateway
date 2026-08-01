import type { Call, Endpoint, Service } from "@/services/contracts/gateway";

const mailCaps = [
  {id:"mail-search",name:"搜索邮件",description:"按条件搜索邮件",risk:"read",permission:"allow"},
  {id:"mail-read",name:"读取邮件",description:"读取邮件正文",risk:"read",permission:"allow"},
  {id:"attachment-download",name:"下载附件",description:"下载邮件附件",risk:"write",permission:"confirm"},
  {id:"mail-send",name:"发送邮件",description:"发送新邮件或回复",risk:"write",permission:"confirm"},
  {id:"mail-delete",name:"删除邮件",description:"删除指定邮件",risk:"delete",permission:"deny"}
] as const;
const fileCaps = [
  {id:"file-search",name:"搜索文件",description:"搜索网盘文件",risk:"read",permission:"allow"},
  {id:"file-read",name:"读取文件",description:"读取文件内容",risk:"read",permission:"allow"},
  {id:"file-upload",name:"上传文件",description:"上传文件至网盘",risk:"write",permission:"confirm"},
  {id:"file-delete",name:"删除文件",description:"删除网盘文件",risk:"delete",permission:"deny"}
] as const;
const noteCaps = [
  {id:"note-search",name:"搜索笔记",description:"搜索笔记标题与正文",risk:"read",permission:"allow"},
  {id:"note-create",name:"新建笔记",description:"创建新笔记",risk:"write",permission:"confirm"},
  {id:"note-delete",name:"删除笔记",description:"删除笔记",risk:"delete",permission:"deny"}
] as const;

export const services:Service[]=[
 {id:"qq-mail",name:"QQ邮箱",code:"qq_mail",description:"个人 QQ 邮箱收发服务",category:"邮箱",type:"邮箱",status:"running",transport:"IMAP + SMTP",updatedAt:"今天 18:32",capabilities:[...mailCaps]},
 {id:"baidu",name:"百度网盘",code:"baidu_drive",description:"文件检索、读取与管理",category:"网盘",type:"API",status:"running",transport:"OpenAPI / OAuth2",updatedAt:"今天 17:10",capabilities:[...fileCaps]},
 {id:"evernote",name:"印象笔记",code:"evernote",description:"个人笔记查询与写入",category:"笔记",type:"API",status:"running",transport:"API / Token",updatedAt:"昨天 21:08",capabilities:[...noteCaps]},
 {id:"finance-mcp",name:"公共金融行情",code:"finance_market",description:"公共市场行情查询",category:"金融",type:"MCP",status:"running",transport:"Streamable HTTP",updatedAt:"昨天 15:22",capabilities:[{id:"quote-search",name:"查询行情",description:"按代码查询公开行情",risk:"read",permission:"allow"}]},
 {id:"office-api",name:"办公日历",code:"office_calendar",description:"日程查询与创建",category:"办公",type:"API",status:"untested",transport:"OpenAPI",updatedAt:"7月30日",capabilities:[{id:"event-read",name:"查询日程",description:"读取日程",risk:"read",permission:"allow"},{id:"event-create",name:"创建日程",description:"创建新日程",risk:"write",permission:"confirm"}]}
];

export const endpoints:Endpoint[]=[
 {id:"personal-readonly",name:"个人数据只读 MCP",description:"面向 ChatGPT 的个人数据只读能力",protocol:"MCP",status:"running",url:"https://gate.example.com/mcp/personal-readonly",successRate:98.7,calls:92,serviceIds:["qq-mail","baidu","evernote"],callers:[{id:"chatgpt",vendor:"OpenAI",name:"ChatGPT",auth:"OAuth2.1",status:"running"},{id:"claude",vendor:"Anthropic",name:"Claude",auth:"OAuth2.1",status:"running"}]},
 {id:"family",name:"家庭助手 MCP",description:"家庭文件与日程能力",protocol:"MCP",status:"running",url:"https://gate.example.com/mcp/family",successRate:96.4,calls:38,serviceIds:["baidu","office-api"],callers:[{id:"gemini",vendor:"Google",name:"Gemini",auth:"Bearer",status:"running"}]},
 {id:"private-gpt",name:"私人 GPT OpenAPI",description:"为私人 GPT 提供标准 API",protocol:"OpenAPI",status:"running",url:"https://gate.example.com/api/private-gpt",successRate:94.4,calls:18,serviceIds:["finance-mcp","evernote"],callers:[{id:"private-gpt-client",vendor:"OpenAI",name:"私人 GPT",auth:"APIKey",status:"running"}]}
];

const raw=[
 ["req-a91f","19:42:16","ChatGPT","personal-readonly","qq-mail","mail-search","success",324,"返回 8 封邮件"],
 ["req-b27c","19:37:02","Claude","personal-readonly","baidu","file-search","success",486,"返回 12 个文件"],
 ["req-c83d","19:21:44","Gemini","family","office-api","event-read","failed",1220,"上游连接超时"],
 ["req-d55e","18:58:30","私人 GPT","private-gpt","finance-mcp","quote-search","success",198,"返回行情数据"],
 ["req-e09a","18:46:11","ChatGPT","personal-readonly","evernote","note-search","success",412,"返回 5 条笔记"],
 ["req-f14b","17:32:08","Claude","personal-readonly","qq-mail","attachment-download","failed",36,"用户未确认操作"]
] as const;
export const calls:Call[]=raw.map(x=>{const service=services.find(s=>s.id===x[4])!;const endpoint=endpoints.find(e=>e.id===x[3])!;const endpointProtocol=endpoint.protocol;return {id:x[0],time:"2026-08-01 "+x[1],client:x[2],endpointId:x[3],endpointProtocol,serviceId:x[4],serviceType:service.type,capabilityId:x[5],externalCapability:endpointProtocol==="MCP"?x[5].replace(/-/g,"_"):"/"+x[5].replace(/-/g,"/"),conversionType:service.type+" → "+endpointProtocol,result:x[6],duration:x[7],message:x[8],upstreamError:x[6]==="failed"?x[8]:"—"}});
