"use client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFCM } from "@/hooks/useFCM";
export function PermissionRequest() {
  const { isSupported, permission, requestPermission } = useFCM();
  if (!isSupported || permission !== "default") return null;
  return <div className="m-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm"><div className="flex items-center gap-3"><Bell className="h-5 w-5 text-blue-600" /><span><b>Enable notifications</b><br /><span className="text-slate-600">Receive important school updates on this device.</span></span></div><Button size="sm" onClick={() => void requestPermission()}>Enable</Button></div>;
}
