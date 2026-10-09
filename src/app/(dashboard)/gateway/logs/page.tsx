"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChannels, useLogs } from "@/hooks/use-api";
import type { LogEntry } from "@/types";

const PAGE_SIZE = 20;

export default function LogsPage() {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [channelId, setChannelId] = useState("all");
  const [model, setModel] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const { data: channels } = useChannels();
  const modelOptions = [...new Set(channels?.flatMap((c) => c.models) ?? [])];

  const { data, isLoading, isFetching } = useLogs({
    keyword: search,
    channelId: channelId === "all" ? undefined : channelId,
    model: model === "all" ? undefined : model,
    page,
    size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">日志</h1>
        <p className="text-sm text-muted-foreground">网关请求日志，支持按关键词、渠道、模型筛选</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="w-64 pl-8"
            placeholder="搜索关键词…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(keyword);
                setPage(0);
              }
            }}
          />
        </div>
        <Select
          value={channelId}
          onValueChange={(v) => {
            setChannelId(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="渠道" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部渠道</SelectItem>
            {channels?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={model}
          onValueChange={(v) => {
            setModel(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="模型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模型</SelectItem>
            {modelOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setKeyword("");
            }}
          >
            清除搜索
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead>渠道</TableHead>
              <TableHead>模型</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">延迟</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(log)}
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.channelName}</TableCell>
                  <TableCell>
                    <code className="text-xs">{log.model}</code>
                  </TableCell>
                  <TableCell className="text-right">{log.totalTokens.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{log.latencyMs}ms</TableCell>
                  <TableCell>
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>
                      {log.status === "success" ? "成功" : "失败"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {data?.total ?? 0} 条 · 第 {page + 1} / {totalPages} 页
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>请求详情</SheetTitle>
            <SheetDescription>
              {selected && new Date(selected.createdAt).toLocaleString()}
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 px-4 pb-6 text-sm">
              <Row label="渠道">{selected.channelName}</Row>
              <Row label="密钥">{selected.keyName}</Row>
              <Row label="模型">
                <code className="text-xs">{selected.model}</code>
              </Row>
              <Row label="请求内容">{selected.promptSummary}</Row>
              <Row label="状态">
                <Badge variant={selected.status === "success" ? "default" : "destructive"}>
                  {selected.status === "success" ? "成功" : "失败"}
                </Badge>
              </Row>
              {selected.errorMessage && (
                <Row label="错误信息">
                  <code className="text-xs text-destructive">{selected.errorMessage}</code>
                </Row>
              )}
              <Row label="Prompt Tokens">{selected.promptTokens.toLocaleString()}</Row>
              <Row label="Completion Tokens">{selected.completionTokens.toLocaleString()}</Row>
              <Row label="总 Tokens">{selected.totalTokens.toLocaleString()}</Row>
              <Row label="延迟">{selected.latencyMs}ms</Row>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 break-all">{children}</span>
    </div>
  );
}
