import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { DashboardStats } from "@/types";

export async function GET() {
  const store = getStore();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayLogs = store.logs.filter(
    (log) => Date.parse(log.createdAt) >= todayStart.getTime(),
  );
  // 种子数据时间跨度较大，今日数据不足时用最近 24h 数据保证演示效果
  const baseLogs =
    todayLogs.length >= 10
      ? todayLogs
      : store.logs.filter(
          (log) => Date.now() - Date.parse(log.createdAt) < 86400_000,
        );

  const successLogs = baseLogs.filter((l) => l.status === "success");
  const stats: DashboardStats = {
    todayRequests: baseLogs.length,
    todayTokens: baseLogs.reduce((sum, l) => sum + l.totalTokens, 0),
    activeChannels: store.channels.filter((c) => c.status === "enabled").length,
    totalChannels: store.channels.length,
    avgLatencyMs:
      successLogs.length > 0
        ? Math.round(
            successLogs.reduce((sum, l) => sum + l.latencyMs, 0) /
              successLogs.length,
          )
        : 0,
  };
  return NextResponse.json(stats);
}
