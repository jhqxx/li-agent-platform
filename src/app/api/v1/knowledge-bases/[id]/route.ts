import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const kb = getStore().knowledgeBases.find((k) => k.id === id);
  if (!kb) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }
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
