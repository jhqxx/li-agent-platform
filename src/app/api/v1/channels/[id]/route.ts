import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { ChannelInput } from "@/types";

type Params = { params: Promise<{ id: string }> };

function maskKey(key: string): string {
  if (!key) return "";
  const head = key.slice(0, 6);
  const tail = key.slice(-4);
  return `${head}****${tail}`;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const channel = store.channels.find((c) => c.id === id);
  if (!channel) {
    return NextResponse.json({ message: "渠道不存在" }, { status: 404 });
  }
  const input = (await request.json()) as ChannelInput;
  channel.name = input.name.trim();
  channel.type = input.type;
  channel.baseUrl = input.baseUrl;
  if (input.apiKey) {
    channel.apiKeyMasked = maskKey(input.apiKey);
  }
  channel.models = input.models;
  channel.priority = input.priority;
  channel.status = input.status;
  channel.updatedAt = new Date().toISOString();
  return NextResponse.json(channel);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const index = store.channels.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "渠道不存在" }, { status: 404 });
  }
  store.channels.splice(index, 1);
  return NextResponse.json({ ok: true });
}
