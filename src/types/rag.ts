/** 文档处理状态 */
export type DocStatus = "uploading" | "parsing" | "completed" | "failed";

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  docCount: number;
  chunkCount: number;
  /** 文档总字数 */
  totalChars: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseInput {
  name: string;
  description: string;
}

export interface KbDocument {
  id: string;
  kbId: string;
  fileName: string;
  fileSize: number;
  fileType: "txt" | "md" | "pdf";
  status: DocStatus;
  chunkCount: number;
  chars: number;
  enabled: boolean;
  createdAt: string;
  error: string | null;
}

/** 文档切分后的分段 */
export interface KbChunk {
  id: string;
  documentId: string;
  documentName: string;
  index: number;
  content: string;
  chars: number;
  enabled: boolean;
}

/** 检索测试命中项 */
export interface SearchHit {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  /** 0~1 模拟相似度分数 */
  score: number;
}

export interface SearchRequest {
  query: string;
  topK?: number;
}

export interface KbSearchResult {
  query: string;
  hits: SearchHit[];
  /** 检索耗时 */
  latencyMs: number;
}
