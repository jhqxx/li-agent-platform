"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, MessagesSquare, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useKbChunks,
  useKbDocuments,
  useSearchKb,
  useUploadDocument,
} from "@/hooks/use-api";
import type { KbSearchResult } from "@/types";

export default function KbDetailPage() {
  const params = useParams<{ kbId: string }>();
  const kbId = params.kbId;
  const router = useRouter();
  const searchParams = useSearchParams();
  // 支持 ?tab=retrieval 深链（卡片「召回测试」入口）
  const initialTab = searchParams.get("tab") === "retrieval" ? "retrieval" : "documents";

  const { data: docs, isLoading } = useKbDocuments(kbId);
  const { data: chunks } = useKbChunks(kbId);
  const upload = useUploadDocument(kbId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/rag")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">知识库详情</h1>
          <p className="text-sm text-muted-foreground">管理文档、预览分段、测试检索效果</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/rag/${kbId}/chat`}>
            <MessagesSquare className="size-4" /> 去聊天
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="documents">文档</TabsTrigger>
          <TabsTrigger value="chunks">分段预览</TabsTrigger>
          <TabsTrigger value="retrieval">检索测试</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                upload.mutate(file, {
                  onSuccess: (doc) => toast.success(`「${doc.fileName}」解析完成，切分 ${doc.chunkCount} 段`),
                  onError: (err) => toast.error(err.message),
                });
                e.target.value = "";
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
              <Upload className="size-4" />
              {upload.isPending ? "上传解析中…" : "上传文档（txt / md）"}
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : (docs?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              暂无文档，上传 txt / md 文件开始构建
            </div>
          ) : (
            <div className="space-y-3">
              {docs?.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <FileText className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{doc.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {(doc.fileSize / 1024).toFixed(1)} KB · {doc.chars} 字 ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                    <Badge variant="secondary">{doc.chunkCount} 分段</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chunks" className="space-y-3">
          {(chunks?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              暂无分段
            </div>
          ) : (
            chunks?.map((chunk) => (
              <Card key={chunk.id}>
                <CardContent className="py-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-normal">
                      {chunk.documentName}
                    </Badge>
                    <span>第 {chunk.index + 1} 段 · {chunk.chars} 字</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{chunk.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="retrieval">
          <RetrievalTest kbId={kbId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    completed: { label: "已完成", variant: "default" },
    parsing: { label: "解析中", variant: "secondary" },
    uploading: { label: "上传中", variant: "secondary" },
    failed: { label: "失败", variant: "destructive" },
  };
  const item = map[status] ?? map.uploading;
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

function RetrievalTest({ kbId }: { kbId: string }) {
  const [query, setQuery] = useState("");
  const search = useSearchKb(kbId);
  const [result, setResult] = useState<KbSearchResult | null>(null);

  function run() {
    if (!query.trim()) {
      toast.error("请输入测试查询");
      return;
    }
    search.mutate(
      { query: query.trim(), topK: 5 },
      { onSuccess: setResult },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="输入查询，例如：什么是混合检索"
        />
        <Button onClick={run} disabled={search.isPending}>
          <Search className="size-4" />
          {search.isPending ? "检索中…" : "检索"}
        </Button>
      </div>

      {result && (
        <p className="text-xs text-muted-foreground">
          命中 {result.hits.length} 条，耗时 {result.latencyMs}ms（模拟评分）
        </p>
      )}

      {result?.hits.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          没有命中的分段，试试其他关键词
        </div>
      )}

      <div className="space-y-3">
        {result?.hits.map((hit) => (
          <Card key={hit.chunkId}>
            <CardContent className="py-4">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="outline" className="font-normal">
                  {hit.documentName}
                </Badge>
                <span className="font-mono text-xs text-primary">
                  score {hit.score.toFixed(4)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{hit.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
