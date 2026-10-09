import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { ChannelUsage, ModelUsage, TrendPoint, UsageOverview } from "@/types";

export async function GET() {
  const store = getStore();
  const days = 7;

  // 按日聚合趋势
  const trend: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayLogs = store.logs.filter((log) => {
      const t = Date.parse(log.createdAt);
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });
    // 数据稀疏时按比例放大，保证趋势图有演示意义
    const scale = dayLogs.length > 0 && dayLogs.length < 20 ? Math.ceil(20 / dayLogs.length) : 1;
    trend.push({
      date: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
      requests: dayLogs.length * scale,
      tokens: dayLogs.reduce((sum, l) => sum + l.totalTokens, 0) * scale,
      latencyMs:
        dayLogs.length > 0
          ? Math.round(
              dayLogs.reduce((sum, l) => sum + l.latencyMs, 0) / dayLogs.length,
            )
          : 0,
    });
  }

  // 模型排行
  const byModel = new Map<string, ModelUsage>();
  for (const log of store.logs) {
    const entry = byModel.get(log.model) ?? { model: log.model, requests: 0, tokens: 0 };
    entry.requests += 1;
    entry.tokens += log.totalTokens;
    byModel.set(log.model, entry);
  }
  const topModels = [...byModel.values()]
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 5);

  // 按渠道汇总
  const byChannel = new Map<string, ChannelUsage>();
  for (const log of store.logs) {
    const entry =
      byChannel.get(log.channelId) ??
      {
        channelId: log.channelId,
        channelName: log.channelName,
        channelType: "",
        requests: 0,
        tokens: 0,
        errorCount: 0,
      };
    entry.requests += 1;
    entry.tokens += log.totalTokens;
    if (log.status === "error") entry.errorCount += 1;
    byChannel.set(log.channelId, entry);
  }
  for (const entry of byChannel.values()) {
    entry.channelType =
      store.channels.find((c) => c.id === entry.channelId)?.type ?? "-";
  }

  const overview: UsageOverview = {
    trend,
    topModels,
    byChannel: [...byChannel.values()].sort((a, b) => b.requests - a.requests),
  };
  return NextResponse.json(overview);
}
