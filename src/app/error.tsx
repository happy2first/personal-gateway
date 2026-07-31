"use client";
import { ErrorState } from "@/components/Shared";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div style={{ padding: 24 }}><ErrorState onRetry={reset} /></div>; }
