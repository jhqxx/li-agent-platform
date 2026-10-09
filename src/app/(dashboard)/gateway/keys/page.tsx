"use client";

import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateKey, useDeleteKey, useKeys, useUpdateKey } from "@/hooks/use-api";
import type { ApiKeyCreated } from "@/types";

export default function KeysPage() {
  const { data: keys, isLoading } = useKeys();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);
  const deleteKey = useDeleteKey();
  const updateKey = useUpdateKey();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">密钥</h1>
          <p className="text-sm text-muted-foreground">
            平台 API Key，供下游应用调用 LLM 网关
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> 创建密钥
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>密钥</TableHead>
              <TableHead className="w-48">配额使用</TableHead>
              <TableHead>过期时间</TableHead>
              <TableHead>最近使用</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-16 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : (
              keys?.map((key) => {
                const percent =
                  key.quotaLimit !== null
                    ? Math.min(100, (key.quotaUsed / key.quotaLimit) * 100)
                    : 0;
                return (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {key.keyMasked}
                      </code>
                    </TableCell>
                    <TableCell>
                      {key.quotaLimit === null ? (
                        <span className="text-xs text-muted-foreground">不限</span>
                      ) : (
                        <div className="space-y-1">
                          <Progress value={percent} />
                          <span className="text-xs text-muted-foreground">
                            {formatTokens(key.quotaUsed)} / {formatTokens(key.quotaLimit)}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "永不"}
                    </TableCell>
                    <TableCell>
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "未使用"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={key.status === "enabled"}
                        disabled={updateKey.isPending}
                        onCheckedChange={(checked) =>
                          updateKey.mutate({
                            id: key.id,
                            input: { status: checked ? "enabled" : "disabled" },
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`确定删除密钥「${key.name}」？删除后使用该密钥的应用将无法调用。`)) {
                            deleteKey.mutate(key.id, {
                              onSuccess: () => toast.success("密钥已删除"),
                            });
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateKeyDialog
        key={String(creating)}
        open={creating}
        onOpenChange={setCreating}
        onCreated={setCreated}
      />

      <Dialog open={created !== null} onOpenChange={(open) => !open && setCreated(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>密钥创建成功</DialogTitle>
            <DialogDescription>
              完整密钥仅此一次展示，请立即复制保存。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code className="flex-1 break-all text-xs">{created?.key}</code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(created?.key ?? "");
                toast.success("已复制到剪贴板");
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreated(null)}>我已保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (key: ApiKeyCreated) => void;
}) {
  const [name, setName] = useState("");
  const [quotaMode, setQuotaMode] = useState<"limit" | "unlimited">("limit");
  const [quotaLimit, setQuotaLimit] = useState("1000000");
  const [expiresIn, setExpiresIn] = useState<"never" | "30" | "90" | "365">("never");
  const create = useCreateKey();

  function submit() {
    if (!name.trim()) {
      toast.error("请填写密钥名称");
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        quotaLimit:
          quotaMode === "unlimited" ? null : Number(quotaLimit) || null,
        expiresAt:
          expiresIn === "never"
            ? null
            : new Date(Date.now() + Number(expiresIn) * 86400_000).toISOString(),
      },
      {
        onSuccess: (key) => {
          onCreated(key);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>创建密钥</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如 Web 应用默认"
            />
          </div>
          <div className="grid gap-2">
            <Label>配额限制（Tokens）</Label>
            <div className="flex gap-2">
              <Select value={quotaMode} onValueChange={(v) => setQuotaMode(v as "limit" | "unlimited")}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limit">限制</SelectItem>
                  <SelectItem value="unlimited">不限</SelectItem>
                </SelectContent>
              </Select>
              {quotaMode === "limit" && (
                <Input
                  type="number"
                  value={quotaLimit}
                  onChange={(e) => setQuotaLimit(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>有效期</Label>
            <Select value={expiresIn} onValueChange={(v) => setExpiresIn(v as typeof expiresIn)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">永不</SelectItem>
                <SelectItem value="30">30 天</SelectItem>
                <SelectItem value="90">90 天</SelectItem>
                <SelectItem value="365">365 天</SelectItem>
              </SelectContent>
            </Select>
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

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
