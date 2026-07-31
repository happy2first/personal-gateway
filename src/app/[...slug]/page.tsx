import { AppShell } from "@/components/AppShell";
import { AdminPage } from "@/components/AdminPage";
export default async function CatchAllPage({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const path="/"+slug.join("/");return <AppShell path={path}><AdminPage path={path}/></AppShell>}
