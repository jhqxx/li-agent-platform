export interface GatewaySettings {
  service: {
    /** 请求超时（秒） */
    timeoutSeconds: number;
    /** 代理地址，空表示直连 */
    proxyUrl: string;
    /** 最大并发数 */
    maxConcurrent: number;
  };
  general: {
    siteName: string;
    serverAddress: string;
    /** 日志保留天数 */
    logRetentionDays: number;
  };
  ui: {
    theme: "light" | "dark" | "system";
    language: "zh-CN" | "en-US";
    /** 每页条数 */
    pageSize: number;
  };
  retry: {
    /** 自动重试次数 */
    maxRetries: number;
    /** 重试退避间隔（秒） */
    retryIntervalSeconds: number;
    /** 连续失败 N 次后自动禁用渠道 */
    autoDisableThreshold: number;
    /** 是否启用失败自动禁用 */
    autoDisableEnabled: boolean;
  };
}
