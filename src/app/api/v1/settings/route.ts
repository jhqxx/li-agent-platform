import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { GatewaySettings } from "@/types";

export async function GET() {
  return NextResponse.json(getStore().settings);
}

export async function PUT(request: NextRequest) {
  const input = (await request.json()) as Partial<GatewaySettings>;
  const store = getStore();
  // 分组合并保存，允许只提交某一个 Tab 的内容
  if (input.service) store.settings.service = { ...store.settings.service, ...input.service };
  if (input.general) store.settings.general = { ...store.settings.general, ...input.general };
  if (input.ui) store.settings.ui = { ...store.settings.ui, ...input.ui };
  if (input.retry) store.settings.retry = { ...store.settings.retry, ...input.retry };
  return NextResponse.json(store.settings);
}
