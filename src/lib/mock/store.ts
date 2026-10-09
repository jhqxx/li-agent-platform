import type {
  Agent,
  ApiKey,
  Channel,
  ChatMessage,
  GatewaySettings,
  KbChunk,
  KbDocument,
  KnowledgeBase,
  LogEntry,
} from "@/types";
import { seed } from "./seed";

/**
 * 内存数据仓库。
 * 单例挂在 globalThis 上，防止 dev 热重载时模块重载导致数据被重置。
 * 后端（Java Spring AI）就绪后，此层与 /api/v1 Route Handlers 一起被替换，
 * 前端只依赖 types/ 中的契约。
 */
export interface MockStore {
  channels: Channel[];
  keys: ApiKey[];
  logs: LogEntry[];
  settings: GatewaySettings;
  knowledgeBases: KnowledgeBase[];
  documents: KbDocument[];
  chunks: KbChunk[];
  agents: Agent[];
  /** Agent 会话内存，agentId -> messages */
  agentChats: Map<string, ChatMessage[]>;
  seq: number;
}

export function nextId(store: MockStore, prefix: string): string {
  store.seq += 1;
  return `${prefix}-${store.seq.toString(36).padStart(4, "0")}`;
}

declare global {
  var __liagentMockStore: MockStore | undefined;
}

export function getStore(): MockStore {
  if (!globalThis.__liagentMockStore) {
    globalThis.__liagentMockStore = createStore();
  }
  return globalThis.__liagentMockStore;
}

function createStore(): MockStore {
  const store: MockStore = {
    channels: [],
    keys: [],
    logs: [],
    settings: defaultSettings(),
    knowledgeBases: [],
    documents: [],
    chunks: [],
    agents: [],
    agentChats: new Map(),
    seq: 0,
  };
  seed(store);
  return store;
}

function defaultSettings(): GatewaySettings {
  return {
    service: { timeoutSeconds: 60, proxyUrl: "", maxConcurrent: 100 },
    general: {
      siteName: "Li Agent Platform",
      serverAddress: "http://localhost:3000",
      logRetentionDays: 30,
    },
    ui: { theme: "system", language: "zh-CN", pageSize: 20 },
    retry: {
      maxRetries: 3,
      retryIntervalSeconds: 2,
      autoDisableThreshold: 5,
      autoDisableEnabled: true,
    },
  };
}

/** 常用模型清单（按渠道类型） */
export const MODELS_BY_TYPE: Record<Channel["type"], string[]> = {
  OpenAI: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  DeepSeek: ["deepseek-chat", "deepseek-reasoner"],
  Claude: ["claude-sonnet-4-5", "claude-haiku-4-5"],
  Gemini: ["gemini-2.5-pro", "gemini-2.5-flash"],
};

export const DEFAULT_BASE_URLS: Record<Channel["type"], string> = {
  OpenAI: "https://api.openai.com/v1",
  DeepSeek: "https://api.deepseek.com/v1",
  Claude: "https://api.anthropic.com/v1",
  Gemini: "https://generativelanguage.googleapis.com/v1beta",
};
