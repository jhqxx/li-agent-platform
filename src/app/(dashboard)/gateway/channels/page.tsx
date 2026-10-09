"use client";

import { useState } from "react";
import { Pencil, Plus, PlugZap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useChannels,
  useCreateChannel,
  useDeleteChannel,
  useTestChannel,
  useUpdateChannel,
} from "@/hooks/use-api";
import { DEFAULT_BASE_URLS, MODELS_BY_TYPE } from "@/lib/mock/store";
import type { Channel, ChannelInput, ChannelType } from "@/types";

const CHANNEL_TYPES: ChannelType[] = ["OpenAI", "DeepSeek", "Claude", "Gemini"];

export default function ChannelsPage() {
  const { data: channels, isLoading } = useChannels();
  const [editing, setEditing] = useState<Channel | null>(null);
  const [creating, setCreating] = useState(false);
  const deleteChannel = useDeleteChannel();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">渠道</h1>
          <p className="text-sm text-muted-foreground">管理上游 LLM 服务接入</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> 添加渠道
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>模型</TableHead>
              <TableHead className="text-right">优先级</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最近测试</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
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
              channels?.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">
                    {channel.name}
                    <div className="text-xs text-muted-foreground">{channel.baseUrl}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{channel.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-52 flex-wrap gap-1">
                      {channel.models.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs font-normal">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{channel.priority}</TableCell>
                  <TableCell>
                    <Badge variant={channel.status === "enabled" ? "default" : "secondary"}>
                      {channel.status === "enabled" ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TestCell channelId={channel.id} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <PlugZap className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(channel)}>
                          <Pencil /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`确定删除渠道「${channel.name}」？`)) {
                              deleteChannel.mutate(channel.id, {
                                onSuccess: () => toast.success("渠道已删除"),
                              });
                            }
                          }}
                        >
                          <Trash2 /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ChannelFormDialog
        key={editing?.id ?? "new"}
        open={creating || editing !== null}
        channel={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />
    </div>
  );
}

function TestCell({ channelId }: { channelId: string }) {
  const test = useTestChannel();
  const { data: channels } = useChannels();
  const channel = channels?.find((c) => c.id === channelId);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={test.isPending}
        onClick={() =>
          test.mutate(channelId, {
            onSuccess: (result) =>
              result.ok
                ? toast.success(`测试通过（${result.latencyMs}ms）`)
                : toast.error(result.message),
          })
        }
      >
        {test.isPending ? "测试中…" : "测试"}
      </Button>
      {channel?.lastTestOk !== null && channel?.lastTestOk !== undefined ? (
        <span className="text-xs text-muted-foreground">
          {channel.lastTestOk ? `${channel.lastTestLatencyMs}ms` : "失败"}
        </span>
      ) : null}
    </div>
  );
}

function ChannelFormDialog({
  open,
  channel,
  onOpenChange,
}: {
  open: boolean;
  channel: Channel | null;
  onOpenChange: (open: boolean) => void;
}) {
  // 组件以 key=channel.id 挂载，state 直接由初始 props 派生，无需 effect 重置
  const [type, setType] = useState<ChannelType>(channel?.type ?? "OpenAI");
  const [name, setName] = useState(channel?.name ?? "");
  const [baseUrl, setBaseUrl] = useState(channel?.baseUrl ?? DEFAULT_BASE_URLS.OpenAI);
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState(
    channel ? channel.models.join(", ") : MODELS_BY_TYPE.OpenAI.join(", "),
  );
  const [priority, setPriority] = useState(channel?.priority ?? 5);
  const [status, setStatus] = useState(channel ? channel.status === "enabled" : true);

  const create = useCreateChannel();
  const update = useUpdateChannel();

  function onTypeChange(value: ChannelType) {
    setType(value);
    setBaseUrl(DEFAULT_BASE_URLS[value]);
    setModels(MODELS_BY_TYPE[value].join(", "));
  }

  function submit() {
    const input: ChannelInput = {
      name,
      type,
      baseUrl,
      models: models
        .split(/[,\n]/)
        .map((m) => m.trim())
        .filter(Boolean),
      priority,
      status: status ? "enabled" : "disabled",
    };
    if (channel) {
      update.mutate(
        { id: channel.id, input },
        {
          onSuccess: () => {
            toast.success("渠道已更新");
            onOpenChange(false);
          },
        },
      );
    } else {
      if (!apiKey.trim()) {
        toast.error("请填写 API Key");
        return;
      }
      create.mutate(
        { ...input, apiKey: apiKey.trim() },
        {
          onSuccess: () => {
            toast.success("渠道已创建");
            onOpenChange(false);
          },
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{channel ? "编辑渠道" : "添加渠道"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>渠道类型</Label>
            <Select value={type} onValueChange={(v) => onTypeChange(v as ChannelType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如 DeepSeek 官方" />
          </div>
          <div className="grid gap-2">
            <Label>Base URL</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>API Key {channel && <span className="text-xs text-muted-foreground">（留空则不修改）</span>}</Label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              placeholder={channel ? channel.apiKeyMasked : "sk-..."}
            />
          </div>
          <div className="grid gap-2">
            <Label>模型列表（逗号分隔）</Label>
            <Textarea value={models} onChange={(e) => setModels(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <div className="grid gap-2">
              <Label>优先级（数值越大越优先）</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>启用</Label>
              <Switch checked={status} onCheckedChange={setStatus} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || update.isPending}
          >
            {channel ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
