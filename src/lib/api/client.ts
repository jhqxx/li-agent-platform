import type { PageQuery, PageResult } from "@/types";

/**
 * 统一 fetch 封装。
 * 默认请求同源 /api/v1（Next.js Route Handlers + Mock 实现）；
 * 配置 NEXT_PUBLIC_API_BASE_URL 后自动切换到 Java 后端，前端代码零改动。
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function toQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function paginated<T>(items: T[], query: PageQuery): PageResult<T> {
  const page = query.page ?? 0;
  const size = query.size ?? 20;
  return {
    items: items.slice(page * size, (page + 1) * size),
    total: items.length,
    page,
    size,
  };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
