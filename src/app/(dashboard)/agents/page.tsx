"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAgents, useCreateAgent } from "@/hooks/use-api";
import { api } from "@/lib/api/client";
import type { AgentInput } from "@/types";

const DEFAULT_INPUT: AgentInput = {
  icon: "🤖",
  name: "",
  description: "",
  model: "deepseek-chat",
  systemPrompt: "",
  temperature: 0.7,
  topP: 0.9,
  knowledgeBaseIds: [],
  openingMessage: "你好，有什么可以帮你？",
  openingQuestions: [],
  status: "enabled",
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent</h1>
          <p className="text-sm text-muted-foreground">
            配置人设 Prompt、选择模型、挂载知识库，构建你的智能体
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> 创建 Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents?.map((agent) => (
            <Card key={agent.id} className="group relative transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <span className="text-2xl">{agent.icon}</span>
                  <Link href={`/agents/${agent.id}`} className="hover:underline">
                    {agent.name}
                  </Link>
                  <Badge variant={agent.status === "enabled" ? "default" : "secondary"} className="ml-auto">
                    {agent.status === "enabled" ? "已发布" : "草稿"}
                  </Badge>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {agent.description || "暂无描述"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1.5 py-0.5">{agent.model}</code>
                {agent.knowledgeBaseIds.length > 0 && (
                  <Badge variant="outline" className="font-normal">
                    {agent.knowledgeBaseIds.length} 个知识库
                  </Badge>
                )}
                <AgentDeleteButton id={agent.id} name={agent.name} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAgentDialog open={creating} onOpenChange={setCreating} onCreate={(id) => router.push(`/agents/${id}`)} />
    </div>
  );
}

function AgentDeleteButton({ id, name }: { id: string; name: string }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => api.delete<{ ok: boolean }>(`/agents/${id}`),
    onSuccess: () => {
      toast.success(`已删除「${name}」`);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      className="ml-auto size-7 opacity-0 transition-opacity group-hover:opacity-100"
      disabled={del.isPending}
      onClick={() => {
        if (confirm(`确定删除 Agent「${name}」？`)) del.mutate();
      }}
    >
      <Trash2 className="size-3.5 text-destructive" />
    </Button>
  );
}

function CreateAgentDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateAgent();

  function submit() {
    if (!name.trim()) {
      toast.error("请填写 Agent 名称");
      return;
    }
    create.mutate(
      { ...DEFAULT_INPUT, name: name.trim(), description: description.trim() },
      {
        onSuccess: (agent) => {
          toast.success("Agent 已创建，继续完成编排配置");
          onOpenChange(false);
          onCreate(agent.id);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Bot className="mr-2 inline size-5" />
            创建 Agent
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如 客服小助手" />
          </div>
          <div className="grid gap-2">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="这个 Agent 用来做什么"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            创建并编排
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
