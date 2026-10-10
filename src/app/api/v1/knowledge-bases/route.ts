import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import { defaultKbExtras } from "@/lib/mock/kb-defaults";
import type { KnowledgeBase, KnowledgeBaseInput } from "@/types";

export async function GET() {
  const store = getStore();
  const sorted = [...store.knowledgeBases].sort(
    (a, b) => a.sortOrder - b.sortOrder || Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as Partial<KnowledgeBaseInput>;
  if (!input.name?.trim()) {
    return NextResponse.json({ message: "知识库名称不能为空" }, { status: 400 });
  }
  if (!input.welcome?.trim()) {
    return NextResponse.json({ message: "欢迎语不能为空" }, { status: 400 });
  }
  const store = getStore();
  const now = new Date().toISOString();
  const extras = defaultKbExtras(
    input.icon || "📚",
    input.mode ?? "qa",
    input.welcome.trim(),
    input.tags ?? [],
  );
  const kb: KnowledgeBase = {
    id: nextId(store, "kb"),
    name: input.name.trim(),
    description: input.description ?? "",
    icon: input.icon || "📚",
    mode: input.mode ?? "qa",
    welcome: input.welcome.trim(),
    sortOrder: input.sortOrder ?? store.knowledgeBases.length + 1,
    published: true,
    tags: input.tags ?? [],
    advanced: input.advanced ?? extras.advanced,
    security: input.security ?? extras.security,
    semantics: input.semantics ?? extras.semantics,
    docCount: 0,
    chunkCount: 0,
    totalChars: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.knowledgeBases.push(kb);
  return NextResponse.json(kb, { status: 201 });
}
