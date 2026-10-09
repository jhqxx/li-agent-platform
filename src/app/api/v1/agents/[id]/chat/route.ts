import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import { tokenize } from "@/lib/mock/tokenize";
import type { ChatMessage, SearchHit } from "@/types";

type Params = { params: Promise<{ id: string }> };

/**
 * Agent 调试对话（Mock 回复）。
 * 生产实现：网关转发到 Agent 配置的模型，检索知识库注入上下文后流式返回。
 * Mock 版：召回知识库分段作为 citations，并生成一段可分辨的模板回复。
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const agent = store.agents.find((a) => a.id === id);
  if (!agent) {
    return NextResponse.json({ message: "Agent 不存在" }, { status: 404 });
  }
  const { message } = (await request.json()) as { message: string };
  if (!message?.trim()) {
    return NextResponse.json({ message: "消息不能为空" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const userMsg: ChatMessage = {
    id: nextId(store, "msg"),
    role: "user",
    content: message.trim(),
    createdAt: now,
  };

  // 从挂载的知识库中做一次与 /search 相同逻辑的模拟召回
  const citations: SearchHit[] = [];
  for (const kbId of agent.knowledgeBaseIds) {
    const kb = store.knowledgeBases.find((k) => k.id === kbId);
    if (!kb) continue;
    const docIds = new Set(
      store.documents.filter((d) => d.kbId === kbId && d.enabled).map((d) => d.id),
    );
    const terms = tokenize(message);
    store.chunks
      .filter((c) => docIds.has(c.documentId) && c.enabled)
      .map((chunk) => {
        const content = chunk.content.toLowerCase();
        const covered = terms.filter((t) => content.includes(t));
        const score = terms.length ? covered.length / terms.length : 0;
        return { chunk, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .forEach(({ chunk, score }) => {
        citations.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          documentName: chunk.documentName,
          content: chunk.content,
          score: Number(score.toFixed(4)),
        });
      });
  }

  const citeNote =
    citations.length > 0
      ? `\n\n（已引用 ${citations.length} 条知识库内容：${citations.map((c) => c.documentName).join("、")}）`
      : "";
  const reply: ChatMessage = {
    id: nextId(store, "msg"),
    role: "assistant",
    content: `[Mock 回复 · ${agent.model}] 已收到您的消息：「${message.trim()}」。当前为演示模式，正式版将由 ${agent.model} 基于人设 Prompt${agent.knowledgeBaseIds.length > 0 ? "与挂载的知识库" : ""}生成回答。${citeNote}`,
    createdAt: new Date().toISOString(),
    citations: citations.length > 0 ? citations : undefined,
  };

  const history = store.agentChats.get(id) ?? [];
  history.push(userMsg, reply);
  store.agentChats.set(id, history);

  return NextResponse.json(reply);
}
