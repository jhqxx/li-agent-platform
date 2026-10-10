/** 文档处理状态 */
export type DocStatus = "uploading" | "parsing" | "completed" | "failed";

/** 知识库工作模式：通用 Q2A / 客服 Q2Q（本阶段仅存储与展示） */
export type KbMode = "qa" | "chat";

/** 高级配置（模型与检索参数，整包存储回显） */
export interface KbAdvancedConfig {
  vectorDb: string;
  embeddingModel: string;
  summaryModel: string;
  parseModel: string;
  rerankModel: string;
  /** 会话轮数 */
  sessionRounds: number;
  /** 匹配条数 */
  matchCount: number;
  /** 分片值 */
  chunkSize: number;
  /** 匹配率 0~100 */
  matchRate: number;
  webSearch: boolean;
  /** 空提示 */
  emptyHint: string;
  /** 处理选项 */
  docSummary: boolean;
  sessionCompress: boolean;
  annotateData: boolean;
  autoTag: boolean;
  similarQuestions: boolean;
  executionTrace: boolean;
}

/** 安全配置（访问控制暂未开放） */
export interface KbSecurityConfig {
  sensitiveFilter: boolean;
  /** 开启过滤时的提示语（必填） */
  filterHint: string;
  /** 底部信息，支持 HTML */
  footerHtml: string;
}

/** 语义设置 */
export interface KbSemanticConfig {
  tags: string[];
  synonyms: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  /** emoji 头像 */
  icon: string;
  mode: KbMode;
  /** 欢迎语（聊天页首条消息） */
  welcome: string;
  sortOrder: number;
  published: boolean;
  tags: string[];
  advanced: KbAdvancedConfig;
  security: KbSecurityConfig;
  semantics: KbSemanticConfig;
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
  icon: string;
  mode: KbMode;
  welcome: string;
  sortOrder: number;
  tags: string[];
  advanced: KbAdvancedConfig;
  security: KbSecurityConfig;
  semantics: KbSemanticConfig;
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
