"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bot, Send, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import type { ChatMessage, KnowledgeBase } from "@/types";

/** 知识库动态聊天页：/rag/[kbId]/chat
 *  页面本身不存任何内容，按 URL 的 kbId 实时拉取知识库配置；
 *  新增一个知识库即自动拥有可分享的聊天页。
 */
export default function KbChatPage() {
  const params = useParams<{ kbId: string }>();
  const kbId = params.kbId;

  const { data: kb, isLoading, isError } = useQuery({
    queryKey: ["kb-detail", kbId],
    queryFn: () => api.get<KnowledgeBase>(`/knowledge-bases/${kbId}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-3xl flex-col gap-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    );
  }

  if (isError || !kb) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Bot className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">知识库不存在或已被删除</p>
        <Button variant="outline" asChild>
          <Link href="/rag">返回知识库列表</Link>
        </Button>
      </div>
    );
  }

  return <ChatArea kb={kb} />;
}

function ChatArea({ kb }: { kb: KnowledgeBase }) {
  const modeLabel = kb.mode === "qa" ? "通用模式 Q2A" : "客服模式 Q2Q";

  return (
    <div className="mx-auto flex h-[calc(100vh-9.5rem)] max-w-3xl flex-col">
      {/* 头部：头像 + 名称 + 模式徽章 */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-2xl">
          {kb.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{kb.name}</span>
            <Badge variant="secondary">{modeLabel}</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {kb.description || kb.welcome}
          </p>
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/rag/${kb.id}`} aria-label="返回详情">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>

      <Messages kb={kb} />
    </div>
  );
}

function Messages({ kb }: { kb: KnowledgeBase }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [text, setText] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(content: string) {
    if (!content.trim() || pending) return;
    setText("");
    setPending(true);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() },
    ]);
    try {
      const reply = await api.post<ChatMessage>(`/knowledge-bases/${kb.id}/chat`, {
        message: content,
      });
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "发送失败，请稍后重试。",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4">
        {/* 首条消息：知识库欢迎语 */}
        <div className="flex gap-2">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
            {kb.icon}
          </span>
          <div className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-tl-none bg-muted px-3 py-2 text-sm">
            {kb.welcome}
          </div>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            <div className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "user" ? (
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="size-4" />
                </span>
              ) : (
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                  {kb.icon}
                </span>
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
              <div className="ml-9 space-y-1">
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
        ))}
        {pending && <p className="ml-9 text-xs text-muted-foreground">正在检索知识库…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2 pb-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send(text)}
          placeholder={`向「${kb.name}」提问…`}
        />
        <Button size="icon" onClick={() => send(text)} disabled={pending}>
          <Send className="size-4" />
        </Button>
      </div>
    </>
  );
}
