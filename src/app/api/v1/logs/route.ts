import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import { paginated } from "@/lib/api/client";
import type { LogQuery, LogStatus } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query: LogQuery & { page: number; size: number } = {
    keyword: sp.get("keyword") ?? undefined,
    channelId: sp.get("channelId") ?? undefined,
    model: sp.get("model") ?? undefined,
    status: (sp.get("status") as LogStatus | null) ?? undefined,
    page: Number(sp.get("page") ?? 0),
    size: Number(sp.get("size") ?? 20),
  };

  const store = getStore();
  let items = [...store.logs].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    items = items.filter(
      (log) =>
        log.promptSummary.toLowerCase().includes(kw) ||
        log.model.toLowerCase().includes(kw) ||
        log.channelName.toLowerCase().includes(kw),
    );
  }
  if (query.channelId) {
    items = items.filter((log) => log.channelId === query.channelId);
  }
  if (query.model) {
    items = items.filter((log) => log.model === query.model);
  }
  if (query.status) {
    items = items.filter((log) => log.status === query.status);
  }

  return NextResponse.json(paginated(items, query));
}
