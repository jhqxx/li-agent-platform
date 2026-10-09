import { api } from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Agent,
  AgentInput,
  ApiKey,
  ApiKeyCreated,
  ApiKeyInput,
  Channel,
  ChannelInput,
  ChannelTestResult,
  DashboardStats,
  GatewaySettings,
  KbChunk,
  KbDocument,
  KbSearchResult,
  KnowledgeBase,
  LogEntry,
  LogQuery,
  PageQuery,
  PageResult,
  SearchRequest,
  UsageOverview,
} from "@/types";

// ---------- channels ----------
export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: () => api.get<Channel[]>("/channels"),
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ChannelInput) => api.post<Channel>("/channels", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels"] }),
  });
}

export function useUpdateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ChannelInput }) =>
      api.put<Channel>(`/channels/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels"] }),
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/channels/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels"] }),
  });
}

export function useTestChannel() {
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ChannelTestResult>(`/channels/${id}/test`),
  });
}

// ---------- keys ----------
export function useKeys() {
  return useQuery({
    queryKey: ["keys"],
    queryFn: () => api.get<ApiKey[]>("/keys"),
  });
}

export function useCreateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ApiKeyInput) => api.post<ApiKeyCreated>("/keys", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });
}

export function useUpdateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ApiKeyInput> & { status?: "enabled" | "disabled" };
    }) => api.put<ApiKey>(`/keys/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });
}

export function useDeleteKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });
}

// ---------- logs / stats / usage / settings ----------
export function useLogs(query: LogQuery & PageQuery) {
  return useQuery({
    queryKey: ["logs", query],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (query.keyword) sp.set("keyword", query.keyword);
      if (query.channelId) sp.set("channelId", query.channelId);
      if (query.model) sp.set("model", query.model);
      if (query.status) sp.set("status", query.status);
      sp.set("page", String(query.page ?? 0));
      sp.set("size", String(query.size ?? 20));
      return api.get<PageResult<LogEntry>>(`/logs?${sp.toString()}`);
    },
    placeholderData: (prev) => prev,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["stats", "dashboard"],
    queryFn: () => api.get<DashboardStats>("/stats/dashboard"),
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: () => api.get<UsageOverview>("/usage"),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<GatewaySettings>("/settings"),
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<GatewaySettings>) =>
      api.put<GatewaySettings>("/settings", input),
    onSuccess: (data) => qc.setQueryData(["settings"], data),
  });
}

// ---------- knowledge bases ----------
export function useKnowledgeBases() {
  return useQuery({
    queryKey: ["kbs"],
    queryFn: () => api.get<KnowledgeBase[]>("/knowledge-bases"),
  });
}

export function useCreateKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description: string }) =>
      api.post<KnowledgeBase>("/knowledge-bases", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kbs"] }),
  });
}

export function useDeleteKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ ok: boolean }>(`/knowledge-bases/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kbs"] }),
  });
}

export function useKbDocuments(kbId: string) {
  return useQuery({
    queryKey: ["kb-docs", kbId],
    queryFn: async () => {
      // 文档列表从知识库详情派生：Mock 中按 kbId 过滤全部文档
      return api.get<KbDocument[]>(
        `/knowledge-bases/${kbId}/documents`,
      );
    },
    enabled: Boolean(kbId),
  });
}

export function useUploadDocument(kbId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"}/knowledge-bases/${kbId}/documents`,
        { method: "POST", body: form },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `上传失败：${res.status}`);
      }
      return (await res.json()) as KbDocument;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb-docs", kbId] });
      qc.invalidateQueries({ queryKey: ["kbs"] });
    },
  });
}

export function useSearchKb(kbId: string) {
  return useMutation({
    mutationFn: (input: SearchRequest) =>
      api.post<KbSearchResult>(`/knowledge-bases/${kbId}/search`, input),
  });
}

export function useKbChunks(kbId: string) {
  return useQuery({
    queryKey: ["kb-chunks", kbId],
    queryFn: () => api.get<KbChunk[]>(`/knowledge-bases/${kbId}/chunks`),
    enabled: Boolean(kbId),
  });
}

// ---------- agents ----------
export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => api.get<Agent[]>("/agents"),
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AgentInput) => api.post<Agent>("/agents", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/agents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}
