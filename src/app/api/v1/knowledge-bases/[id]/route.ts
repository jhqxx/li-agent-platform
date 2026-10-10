import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { KnowledgeBaseInput } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const kb = getStore().knowledgeBases.find((k) => k.id === id);
  if (!kb) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }
  return NextResponse.json(kb);
}

/** 编辑知识库（向导预填后的全量保存；模式创建后不可更改） */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const kb = store.knowledgeBases.find((k) => k.id === id);
  if (!kb) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }
  const input = (await request.json()) as Partial<KnowledgeBaseInput>;
  if (input.name !== undefined) kb.name = input.name.trim();
  if (input.description !== undefined) kb.description = input.description;
  if (input.icon !== undefined) kb.icon = input.icon || kb.icon;
  if (input.welcome !== undefined) kb.welcome = input.welcome.trim();
  if (input.sortOrder !== undefined) kb.sortOrder = input.sortOrder;
  if (input.tags !== undefined) kb.tags = input.tags;
  if (input.advanced !== undefined) kb.advanced = input.advanced;
  if (input.security !== undefined) kb.security = input.security;
  if (input.semantics !== undefined) kb.semantics = input.semantics;
  // mode 创建后不可更改，忽略传入值
  kb.updatedAt = new Date().toISOString();
  return NextResponse.json(kb);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const index = store.knowledgeBases.findIndex((k) => k.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }
  const docIds = store.documents.filter((d) => d.kbId === id).map((d) => d.id);
  store.documents = store.documents.filter((d) => d.kbId !== id);
  store.chunks = store.chunks.filter((c) => !docIds.includes(c.documentId));
  store.knowledgeBases.splice(index, 1);
  return NextResponse.json({ ok: true });
}
