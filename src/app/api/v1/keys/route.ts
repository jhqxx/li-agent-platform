import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import type { ApiKeyCreated, ApiKeyInput } from "@/types";

const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateKey(): string {
  let rand = "";
  for (let i = 0; i < 40; i++) {
    rand += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)];
  }
  return `sk-liagentplantform-${rand}`;
}

function maskApiKey(key: string): string {
  return `sk-liagentplantform-****${key.slice(-4)}`;
}

export async function GET() {
  const store = getStore();
  const sorted = [...store.keys].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as ApiKeyInput;
  if (!input.name?.trim()) {
    return NextResponse.json({ message: "密钥名称不能为空" }, { status: 400 });
  }
  const store = getStore();
  const fullKey = generateKey();
  const now = new Date().toISOString();
  const created: ApiKeyCreated = {
    id: nextId(store, "key"),
    name: input.name.trim(),
    key: fullKey,
    keyMasked: maskApiKey(fullKey),
    quotaLimit: input.quotaLimit ?? null,
    quotaUsed: 0,
    expiresAt: input.expiresAt ?? null,
    status: "enabled",
    createdAt: now,
    lastUsedAt: null,
  };
  store.keys.push(created);
  return NextResponse.json(created, { status: 201 });
}
