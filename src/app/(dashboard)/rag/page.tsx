"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Plus, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateKnowledgeBase,
  useDeleteKnowledgeBase,
  useKnowledgeBases,
} from "@/hooks/use-api";

export default function RagPage() {
  const { data: kbs, isLoading } = useKnowledgeBases();
  const [creating, setCreating] = useState(false);
  const deleteKb = useDeleteKnowledgeBase();

  function onDelete(id: string, name: string) {
    deleteKb.mutate(id, { onSuccess: () => toast.success(`已删除「${name}」`) });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">知识库</h1>
          <p className="text-sm text-muted-foreground">上传文档并构建可供 Agent 挂载的知识库</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> 创建知识库
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (kbs?.length ?? 0) === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kbs?.map((kb) => (
            <Card key={kb.id} className="group relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-primary" />
                  <Link href={`/rag/${kb.id}`} className="hover:underline">
                    {kb.name}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {kb.description || "暂无描述"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="size-3.5" /> {kb.docCount} 文档
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="size-3.5" /> {kb.chunkCount} 分段
                </span>
                <span>{(kb.totalChars / 1000).toFixed(1)}k 字</span>
              </CardContent>
              <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`确定删除知识库「${kb.name}」？其中的文档与分段将一并删除。`)) {
                          onDelete(kb.id, kb.name);
                        }
                      }}
                    >
                      <Trash2 /> 删除知识库
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateKbDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <BookOpen className="size-10 text-muted-foreground/40" />
      <p className="mt-4 text-sm text-muted-foreground">还没有知识库，创建第一个开始构建你的知识资产</p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus className="size-4" /> 创建知识库
      </Button>
    </div>
  );
}

function CreateKbDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateKnowledgeBase();

  function submit() {
    if (!name.trim()) {
      toast.error("请填写知识库名称");
      return;
    }
    create.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          toast.success("知识库已创建");
          setName("");
          setDescription("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>创建知识库</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如 产品手册库" />
          </div>
          <div className="grid gap-2">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="这个知识库用来做什么"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
