import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { ChannelTestResult } from "@/types";

type Params = { params: Promise<{ id: string }> };

/**
 * 渠道连通性测试（Mock）。
 * 真实实现将由网关后端向渠道 baseUrl 发送一次最小化 chat 请求；
 * Mock 版按渠道类型返回固定成功/失败与随机延迟。
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const channel = store.channels.find((c) => c.id === id);
  if (!channel) {
    return NextResponse.json({ message: "渠道不存在" }, { status: 404 });
  }

  const latencyMs = 150 + Math.floor(Math.random() * 800);
  const ok = channel.type !== "Gemini"; // 模拟：Gemini 中转渠道测试失败
  const result: ChannelTestResult = {
    ok,
    latencyMs,
    message: ok
      ? `连接成功，模型 ${channel.models[0] ?? "N/A"} 可用`
      : "401 Unauthorized: 请检查 API Key 与 Base URL",
    testedAt: new Date().toISOString(),
  };
  channel.lastTestAt = result.testedAt;
  channel.lastTestLatencyMs = result.latencyMs;
  channel.lastTestOk = result.ok;
  channel.updatedAt = result.testedAt;
  return NextResponse.json(result);
}
