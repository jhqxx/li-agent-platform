import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import { tokenize } from "@/lib/mock/tokenize";
import type { KbSearchResult, SearchRequest } from "@/types";

type Params = { params: Promise<{ id: string }> };

/**
 * 检索测试（Mock 模拟评分）。
 * 生产实现：文本 Embedding → 向量库 ANN 召回 →（可选）Rerank；
 * Mock 版用「关键词覆盖率 + 命中密度」模拟相似度分数，用于前端联调检索交互。
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const kb = store.knowledgeBases.find((k) => k.id === id);
  if (!kb) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }
  const { query, topK = 5 } = (await request.json()) as SearchRequest;
  if (!query?.trim()) {
    return NextResponse.json({ message: "查询内容不能为空" }, { status: 400 });
  }

  const docIds = new Set(
    store.documents
      .filter((d) => d.kbId === id && d.enabled)
      .map((d) => d.id),
  );
  const terms = tokenize(query);

  const scored = store.chunks
    .filter((c) => docIds.has(c.documentId) && c.enabled)
    .map((chunk) => {
      const content = chunk.content.toLowerCase();
      const covered = terms.filter((t) => content.includes(t));
      const coverage = terms.length > 0 ? covered.length / terms.length : 0;
      const density =
        covered.reduce((sum, t) => sum + content.split(t).length - 1, 0) /
        Math.max(chunk.content.length / 100, 1);
      const score = Math.min(0.99, coverage * 0.7 + Math.min(density * 0.1, 0.3));
      return { chunk, score };
    })
    .filter((s) => s.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const result: KbSearchResult = {
    query,
    hits: scored.map(({ chunk, score }) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      content: chunk.content,
      score: Number(score.toFixed(4)),
    })),
    latencyMs: 20 + Math.floor(Math.random() * 120),
  };
  return NextResponse.json(result);
}
