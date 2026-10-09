import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import type { Channel, ChannelInput } from "@/types";

export async function GET() {
  const store = getStore();
  const sorted = [...store.channels].sort((a, b) => b.priority - a.priority);
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as ChannelInput;
  if (!input.name?.trim()) {
    return NextResponse.json({ message: "渠道名称不能为空" }, { status: 400 });
  }
  const store = getStore();
  const now = new Date().toISOString();
  const channel: Channel = {
    id: nextId(store, "ch"),
    name: input.name.trim(),
    type: input.type,
    baseUrl: input.baseUrl,
    apiKeyMasked: maskKey(input.apiKey ?? ""),
    models: input.models,
    priority: input.priority,
    status: input.status,
    lastTestAt: null,
    lastTestLatencyMs: null,
    lastTestOk: null,
    createdAt: now,
    updatedAt: now,
  };
  store.channels.push(channel);
  return NextResponse.json(channel, { status: 201 });
}

function maskKey(key: string): string {
  if (!key) return "";
  const head = key.slice(0, 6);
  const tail = key.slice(-4);
  return `${head}****${tail}`;
}
