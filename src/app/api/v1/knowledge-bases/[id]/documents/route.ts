import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import type { KbDocument, KbChunk } from "@/types";

type Params = { params: Promise<{ id: string }> };

/** 简易文本切分：按段落聚合到 ~300 字的分段 */
function splitChunks(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let buffer = "";
  for (const p of paragraphs) {
    if (buffer.length + p.length > 300 && buffer) {
      chunks.push(buffer);
      buffer = p;
    } else {
      buffer = buffer ? `${buffer}\n${p}` : p;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.length > 0 ? chunks : [text.slice(0, 300)];
}

/**
 * 上传文档（Mock）。
 * 生产实现走对象存储 + 异步解析任务；Mock 版直接同步解析：
 * 文本内容按段落切分入库，状态直接 completed。
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const kb = store.knowledgeBases.find((k) => k.id === id);
  if (!kb) {
    return NextResponse.json({ message: "知识库不存在" }, { status: 404 });
  }

  let fileName = "未命名.txt";
  let text = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file instanceof File) {
      fileName = file.name;
      text = await file.text();
    }
  } else {
    const body = (await request.json()) as { fileName?: string; text?: string };
    fileName = body.fileName ?? fileName;
    text = body.text ?? "";
  }

  if (!text.trim()) {
    return NextResponse.json(
      { message: "文件内容为空或格式不支持（支持 txt/md 文本）" },
      { status: 400 },
    );
  }

  const pieces = splitChunks(text);
  const now = new Date().toISOString();
  const doc: KbDocument = {
    id: nextId(store, "doc"),
    kbId: kb.id,
    fileName,
    fileSize: text.length,
    fileType: fileName.endsWith(".md") ? "md" : "txt",
    status: "completed",
    chunkCount: pieces.length,
    chars: text.length,
    enabled: true,
    createdAt: now,
    error: null,
  };
  store.documents.push(doc);
  pieces.forEach((content, index) => {
    const chunk: KbChunk = {
      id: nextId(store, "chk"),
      documentId: doc.id,
      documentName: doc.fileName,
      index,
      content,
      chars: content.length,
      enabled: true,
    };
    store.chunks.push(chunk);
  });

  kb.docCount += 1;
  kb.chunkCount += doc.chunkCount;
  kb.totalChars += doc.chars;
  kb.updatedAt = now;

  return NextResponse.json(doc, { status: 201 });
}
