import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import { tokenize } from "@/lib/mock/tokenize";
import type { ChatMessage, KbMode, SearchHit } from "@/types";

type Params = { params: Promise<{ id: string }> };

/**
 * 知识库聊天（Mock 回复）。
 * 生产实现：检索该库分段注入上下文后由 LLM 生成回答并流式返回。
 * Mock 版：召回知识库分段作为 citations，生成可分辨的模板回复。
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const kb = store.knowledgeBases.find((k) => k.id === id);
  if (!kb) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }
  const { message } = (await request.json()) as { message: string };
  if (!message?.trim()) {
    return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
  }

  // 复用检索逻辑召回知识库分段
  const docIds = new Set(
    store.documents.filter((d) => d.kbId === id && d.enabled).map((d) => d.id),
  );
  const terms = tokenize(message);
  const citations: SearchHit[] = store.chunks
    .filter((c) => docIds.has(c.documentId) && c.enabled)
    .map((chunk) => {
      const content = chunk.content.toLowerCase();
      const covered = terms.filter((t) => content.includes(t));
      const coverage = terms.length > 0 ? covered.length / terms.length : 0;
      return { chunk, score: coverage };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ chunk, score }) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      content: chunk.content,
      score: Number(score.toFixed(4)),
    }));

  const modeLabel: Record<KbMode, string> = { qa: "通用模式 Q2A", chat: "客服模式 Q2Q" };
  const citeNote =
    citations.length > 0
      ? `\n\n（已引用 ${citations.length} 条知识库内容：${citations.map((c) => c.documentName).join("、")}）`
      : "";

  const reply: ChatMessage = {
    id: nextId(store, "msg"),
    role: "assistant",
    content: `[Mock 回复 · ${modeLabel[kb.mode]}] 关于「${message.trim()}」：当前为演示模式，正式版将基于本知识库检索到的内容生成回答。${citeNote}`,
    createdAt: new Date().toISOString(),
    citations: citations.length > 0 ? citations : undefined,
  };
  return NextResponse.json(reply);
}
