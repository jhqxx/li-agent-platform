import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import type { KnowledgeBase, KnowledgeBaseInput } from "@/types";

export async function GET() {
  const store = getStore();
  const sorted = [...store.knowledgeBases].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as KnowledgeBaseInput;
  if (!input.name?.trim()) {
    return NextResponse.json({ message: "知识库名称不能为空" }, { status: 400 });
  }
  const store = getStore();
  const now = new Date().toISOString();
  const kb: KnowledgeBase = {
    id: nextId(store, "kb"),
    name: input.name.trim(),
    description: input.description ?? "",
    docCount: 0,
    chunkCount: 0,
    totalChars: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.knowledgeBases.push(kb);
  return NextResponse.json(kb, { status: 201 });
}
