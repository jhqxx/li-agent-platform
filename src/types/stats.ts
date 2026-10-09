export interface DashboardStats {
  /** 今日请求数 */
  todayRequests: number;
  /** 今日 token 消耗 */
  todayTokens: number;
  /** 活跃渠道数 */
  activeChannels: number;
  totalChannels: number;
  /** 平均延迟 ms */
  avgLatencyMs: number;
}

export interface TrendPoint {
  date: string;
  requests: number;
  tokens: number;
  latencyMs: number;
}

export interface ModelUsage {
  model: string;
  requests: number;
  tokens: number;
}

export interface ChannelUsage {
  channelId: string;
  channelName: string;
  channelType: string;
  requests: number;
  tokens: number;
  errorCount: number;
}

export interface UsageOverview {
  /** 近 N 天按日趋势 */
  trend: TrendPoint[];
  /** 模型调用排行 */
  topModels: ModelUsage[];
  /** 按渠道汇总 */
  byChannel: ChannelUsage[];
}
