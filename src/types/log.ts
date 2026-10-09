/** 请求日志状态 */
export type LogStatus = "success" | "error";

export interface LogEntry {
  id: string;
  createdAt: string;
  channelId: string;
  channelName: string;
  keyId: string;
  keyName: string;
  model: string;
  /** 该次请求消耗的 token 总数 */
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  status: LogStatus;
  /** 失败时的错误信息 */
  errorMessage: string | null;
  /** 请求首行摘要，用于关键词搜索展示 */
  promptSummary: string;
}

export interface LogQuery {
  keyword?: string;
  channelId?: string;
  model?: string;
  status?: LogStatus;
}
