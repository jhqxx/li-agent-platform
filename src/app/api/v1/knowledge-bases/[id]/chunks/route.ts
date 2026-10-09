import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  if (!store.knowledgeBases.some((k) => k.id === id)) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }
  const docIds = new Set(store.documents.filter((d) => d.kbId === id).map((d) => d.id));
  const chunks = store.chunks
    .filter((c) => docIds.has(c.documentId))
    .sort((a, b) => a.documentId.localeCompare(b.documentId) || a.index - b.index);
  return NextResponse.json(chunks);
}
