"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Paperclip, Send, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { useAgents, useChannels, useKnowledgeBases } from "@/hooks/use-api";
import type { Agent, AgentInput, ChatMessage, KnowledgeBase } from "@/types";

export default function AgentOrchestratePage() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId;
  const router = useRouter();
  const qc = useQueryClient();

  const { data: agents, isLoading } = useAgents();
  const { data: channels } = useChannels();
  const { data: kbs } = useKnowledgeBases();
  const agent = agents?.find((a) => a.id === agentId);

  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }
  if (!agent) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Agent 不存在或已被删除，<Link href="/agents" className="underline">返回列表</Link>
      </div>
    );
  }

  // agent 数据到达后以 key 重挂载编辑表单，避免 effect 里 setState
  const agentKey = `${agent.id}:${agent.updatedAt}`;
  if (savedKey !== agentKey) {
    setSavedKey(agentKey);
  }
  const formKey = savedKey ?? agentKey;
  const modelOptions = channels?.flatMap((c) => c.models) ?? [];

  async function save(config: AgentInput) {
    if (!config.name.trim()) {
      toast.error("名称不能为空");
      return;
    }
    setSaving(true);
    try {
      await api.put<Agent>(`/agents/${agentId}`, config);
      toast.success("配置已保存");
      qc.invalidateQueries({ queryKey: ["agents"] });
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/agents")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.icon}</span>
          <h1 className="text-xl font-semibold tracking-tight">{agent.name || "未命名 Agent"}</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 左侧：编排配置（保存后以 updatedAt 重挂载，回显最新数据） */}
        <AgentForm key={formKey} agent={agent} kbs={kbs ?? []} modelOptions={modelOptions} saving={saving} onSave={save} />

        {/* 右侧：调试 Playground（配置变化时整卡重挂载并清空会话） */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
          <AgentPlayground key={formKey} agentId={agentId} agent={agent} />
        </div>
      </div>
    </div>
  );
}

function agentToInput(agent: Agent): AgentInput {
  return {
    icon: agent.icon,
    name: agent.name,
    description: agent.description,
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    temperature: agent.temperature,
    topP: agent.topP,
    knowledgeBaseIds: agent.knowledgeBaseIds,
    openingMessage: agent.openingMessage,
    openingQuestions: agent.openingQuestions,
    status: agent.status,
  };
}

function AgentForm({
  agent,
  kbs,
  modelOptions,
  saving,
  onSave,
}: {
  agent: Agent;
  kbs: KnowledgeBase[];
  modelOptions: string[];
  saving: boolean;
  onSave: (input: AgentInput) => void;
}) {
  // 以 key=updatedAt 挂载，初始 state 直接来自 agent，无需 effect 同步
  const [draft, setDraft] = useState<AgentInput>(() => agentToInput(agent));

  return (
    <>
      <div className="space-y-4">
        <Button className="w-full" onClick={() => onSave(draft)} disabled={saving}>
          {saving ? "保存中…" : "保存配置"}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[80px_1fr] items-center gap-3">
              <Label>图标</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={draft.icon}
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                  className="w-20 text-center"
                  maxLength={4}
                />
                <span className="text-xs text-muted-foreground">输入一个 emoji</span>
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-3">
              <Label>名称</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-[80px_1fr] items-start gap-3">
              <Label className="pt-2">描述</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">模型设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[80px_1fr] items-center gap-3">
              <Label>模型</Label>
              <select
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              >
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-3">
              <Label>温度 {draft.temperature}</Label>
              <Slider
                value={[draft.temperature]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([v]) => setDraft({ ...draft, temperature: v })}
              />
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-3">
              <Label>Top P {draft.topP}</Label>
              <Slider
                value={[draft.topP]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => setDraft({ ...draft, topP: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">人设与回复逻辑（Prompt）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={draft.systemPrompt}
              onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
              rows={6}
              placeholder="你是…，请…"
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">知识库</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kbs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                还没有知识库，先到 <Link href="/rag" className="underline">RAG 管理</Link> 创建
              </p>
            ) : (
              kbs.map((kb: KnowledgeBase) => {
                const checked = draft.knowledgeBaseIds.includes(kb.id);
                return (
                  <label
                    key={kb.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{kb.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {kb.docCount} 文档 · {kb.chunkCount} 分段
                      </div>
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(v) =>
                        setDraft({
                          ...draft,
                          knowledgeBaseIds: v
                            ? [...draft.knowledgeBaseIds, kb.id]
                            : draft.knowledgeBaseIds.filter((id) => id !== kb.id),
                        })
                      }
                    />
                  </label>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">开场白</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={draft.openingMessage}
              onChange={(e) => setDraft({ ...draft, openingMessage: e.target.value })}
              rows={2}
            />
            <div className="grid gap-2">
              <Label>推荐问题（每行一个）</Label>
              <Textarea
                value={draft.openingQuestions.join("\n")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    openingQuestions: e.target.value.split("\n").filter(Boolean),
                  })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>发布上线</Label>
              <Switch
                checked={draft.status === "enabled"}
                onCheckedChange={(v) => setDraft({ ...draft, status: v ? "enabled" : "disabled" })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AgentPlayground({ agentId, agent }: { agentId: string; agent: Agent }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const opening = agent.openingMessage;
  const questions = agent.openingQuestions;

  async function send(content: string) {
    if (!content.trim() || pending) return;
    setText("");
    setPending(true);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() },
    ]);
    try {
      const reply = await api.post<ChatMessage>(`/agents/${agentId}/chat`, { message: content });
      setMessages((prev) => [...prev, reply]);
    } catch {
      toast.error("发送失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="size-4 text-primary" /> 调试
          {agent.knowledgeBaseIds.length > 0 && (
            <Badge variant="outline" className="ml-auto font-normal">
              <Paperclip className="mr-1 size-3" />
              {agent.knowledgeBaseIds.length} 个知识库
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            {opening && (
              <div className="flex gap-2">
                <Bot className="mt-1 size-5 shrink-0 text-muted-foreground" />
                <div className="rounded-lg rounded-tl-none bg-muted px-3 py-2 text-sm">
                  {opening}
                </div>
              </div>
            )}
            {questions.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-7">
                {questions.map((q) => (
                  <button
                    key={q}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => send(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "user" ? (
                  <User className="mt-1 size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <Bot className="mt-1 size-5 shrink-0 text-primary" />
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "rounded-tr-none bg-primary text-primary-foreground"
                      : "rounded-tl-none bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
              {msg.citations && msg.citations.length > 0 && (
                <div className="ml-7 space-y-1">
                  {msg.citations.map((c) => (
                    <div
                      key={c.chunkId}
                      className="rounded-md border border-dashed bg-background px-2.5 py-1.5 text-xs text-muted-foreground"
                    >
                      <span className="font-medium text-foreground">{c.documentName}</span>
                      {" · "}
                      {c.content.slice(0, 60)}…
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {pending && <p className="ml-7 text-xs text-muted-foreground">对方正在输入…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send(text)}
          placeholder="输入消息调试 Agent…"
        />
        <Button size="icon" onClick={() => send(text)} disabled={pending}>
          <Send className="size-4" />
        </Button>
      </div>
          </Card>
  );
}
