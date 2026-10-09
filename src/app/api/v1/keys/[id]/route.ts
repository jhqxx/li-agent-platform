import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { ApiKeyInput } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const key = store.keys.find((k) => k.id === id);
  if (!key) {
    return NextResponse.json({ message: "密钥不存在" }, { status: 404 });
  }
  const input = (await request.json()) as Partial<ApiKeyInput> & { status?: "enabled" | "disabled" };
  if (input.name !== undefined) key.name = input.name.trim();
  if (input.quotaLimit !== undefined) key.quotaLimit = input.quotaLimit;
  if (input.expiresAt !== undefined) key.expiresAt = input.expiresAt;
  if (input.status !== undefined) key.status = input.status;
  return NextResponse.json(key);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const index = store.keys.findIndex((k) => k.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "密钥不存在" }, { status: 404 });
  }
  store.keys.splice(index, 1);
  return NextResponse.json({ ok: true });
}
