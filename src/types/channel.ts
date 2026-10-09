/** LLM 渠道类型 */
export type ChannelType = "OpenAI" | "DeepSeek" | "Claude" | "Gemini";

/** 渠道启用状态 */
export type EnabledStatus = "enabled" | "disabled";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  baseUrl: string;
  /** 脱敏后的 apiKey，形如 sk-****abcd */
  apiKeyMasked: string;
  models: string[];
  priority: number;
  status: EnabledStatus;
  /** 最近一次测试结果 */
  lastTestAt: string | null;
  lastTestLatencyMs: number | null;
  lastTestOk: boolean | null;
  createdAt: string;
  updatedAt: string;
}

/** 渠道创建/编辑请求（apiKey 仅在请求中出现，响应永远脱敏） */
export interface ChannelInput {
  name: string;
  type: ChannelType;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  priority: number;
  status: EnabledStatus;
}

/** 渠道连通性测试结果 */
export interface ChannelTestResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  testedAt: string;
}
