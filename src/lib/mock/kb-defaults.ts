import type {
  KbAdvancedConfig,
  KbMode,
  KbSecurityConfig,
  KbSemanticConfig,
} from "@/types";

/** 高级配置下拉的 Mock 常量选项（契约：未来由后端下发） */
export const KB_OPTIONS = {
  vectorDbs: ["milvus", "elasticsearch", "pgvector", "qdrant"],
  embeddingModels: ["OpenAI:Qwen3-Embedding-8B", "BGE-M3", "text-embedding-3-large"],
  summaryModels: ["qwen3.7-flash-c", "deepseek-chat", "gpt-4o-mini"],
  parseModels: ["视觉 / qwen3.7-flash-c", "文本 / naive-splitter"],
  rerankModels: ["gitee-reranker-1770302351361", "bge-reranker-v2-m3", "（不启用）"],
} as const;

/** 知识库新增字段默认值（创建/种子共用） */
export function defaultKbExtras(
  icon: string,
  mode: KbMode,
  welcome: string,
  tags: string[] = [],
): {
  sortOrder: number;
  published: boolean;
  tags: string[];
  advanced: KbAdvancedConfig;
  security: KbSecurityConfig;
  semantics: KbSemanticConfig;
} {
  return {
    sortOrder: 1,
    published: true,
    tags,
    advanced: {
      vectorDb: KB_OPTIONS.vectorDbs[0],
      embeddingModel: KB_OPTIONS.embeddingModels[0],
      summaryModel: KB_OPTIONS.summaryModels[0],
      parseModel: KB_OPTIONS.parseModels[0],
      rerankModel: KB_OPTIONS.rerankModels[0],
      sessionRounds: 3,
      matchCount: 2,
      chunkSize: 1000,
      matchRate: 60,
      webSearch: false,
      emptyHint: "知识库未匹配相关问题，请重新提问",
      docSummary: false,
      sessionCompress: false,
      annotateData: false,
      autoTag: true,
      similarQuestions: true,
      executionTrace: false,
    },
    security: {
      sensitiveFilter: false,
      filterHint: "您输入内容包含敏感词，请重新输入",
      footerHtml: "",
    },
    semantics: {
      tags,
      synonyms: "",
    },
  };
}
