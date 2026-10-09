import type { EnabledStatus } from "./channel";

export interface ApiKey {
  id: string;
  name: string;
  /** 脱敏展示，形如 sk-liagentplantform-****abcd */
  keyMasked: string;
  /** 配额上限（token 数），null 表示不限 */
  quotaLimit: number | null;
  /** 已消耗 token 数 */
  quotaUsed: number;
  expiresAt: string | null;
  status: EnabledStatus;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyInput {
  name: string;
  /** 不传或 null 表示不限配额 */
  quotaLimit?: number | null;
  expiresAt?: string | null;
}

/** 创建成功后的一次性完整 key 展示 */
export interface ApiKeyCreated extends ApiKey {
  /** 仅创建响应中返回一次 */
  key: string;
}
