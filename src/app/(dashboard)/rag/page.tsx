"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Layers,
  Link2,
  MessagesSquare,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteKnowledgeBase, useKnowledgeBases } from "@/hooks/use-api";
import { KbWizard, ModePickerDialog } from "@/components/rag/kb-wizard";
import { KbAvatar } from "@/components/rag/kb-avatar";
import type { KbMode, KnowledgeBase } from "@/types";

export default function RagPage() {
  const { data: kbs, isLoading } = useKnowledgeBases();
  const deleteKb = useDeleteKnowledgeBase();

  // 新增流程：模式选择 → 向导
  const [modePickerOpen, setModePickerOpen] = React.useState(false);
  const [wizardMode, setWizardMode] = React.useState<KbMode | null>(null);
  // 编辑流程
  const [editing, setEditing] = React.useState<KnowledgeBase | null>(null);
  // 链接弹窗
  const [linkKb, setLinkKb] = React.useState<KnowledgeBase | null>(null);
  // 勾选（批量删除）
  const [checked, setChecked] = React.useState<Set<string>>(new Set());

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onDeleteSelected() {
    const ids = [...checked];
    if (ids.length === 0) {
      toast.error("请先勾选要删除的知识库");
      return;
    }
    const names = kbs?.filter((k) => ids.includes(k.id)).map((k) => k.name) ?? [];
    if (!confirm(`确定删除 ${ids.length} 个知识库（${names.join("、")}）？文档与分段将一并删除。`)) {
      return;
    }
    ids.forEach((id) =>
      deleteKb.mutate(id, {
        onSuccess: () =>
          setChecked((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          }),
      }),
    );
  }

  function onDeleteOne(kb: KnowledgeBase) {
    if (!confirm(`确定删除知识库「${kb.name}」？其中的文档与分段将一并删除。`)) return;
    deleteKb.mutate(kb.id, { onSuccess: () => toast.success(`已删除「${kb.name}」`) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">知识库</h1>
        <p className="text-sm text-muted-foreground">上传文档并构建可供 Agent 挂载的知识库</p>
      </div>

      {/* 工具条：新增 / 删除 */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setModePickerOpen(true)}>
          <Plus className="size-4" /> 新增
        </Button>
        <Button variant="secondary" onClick={onDeleteSelected} disabled={checked.size === 0}>
          <Trash2 className="size-4" /> 删除{checked.size > 0 ? ` (${checked.size})` : ""}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (kbs?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <BookOpen className="size-10 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            还没有知识库，点击「新增」开始构建你的知识资产
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kbs?.map((kb) => (
            <KnowledgeCard
              key={kb.id}
              kb={kb}
              checked={checked.has(kb.id)}
              onToggleCheck={() => toggleCheck(kb.id)}
              onLink={() => setLinkKb(kb)}
              onEdit={() => setEditing(kb)}
              onDelete={() => onDeleteOne(kb)}
            />
          ))}
        </div>
      )}

      {/* 新增：模式选择 → 向导 */}
      <ModePickerDialog
        open={modePickerOpen}
        onOpenChange={setModePickerOpen}
        onPicked={(mode) => {
          setModePickerOpen(false);
          setWizardMode(mode);
        }}
      />
      {wizardMode !== null && (
        <KbWizard
          key={`new-${wizardMode}`}
          open
          mode={wizardMode}
          editing={null}
          onClose={() => setWizardMode(null)}
          onSaved={(kb) => {
            setWizardMode(null);
            toast.success(`知识库「${kb.name}」已创建`);
          }}
        />
      )}

      {/* 编辑：直接进向导 */}
      {editing !== null && (
        <KbWizard
          key={`edit-${editing.id}-${editing.updatedAt}`}
          open
          mode={editing.mode}
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={(kb) => {
            setEditing(null);
            toast.success(`「${kb.name}」已保存`);
          }}
        />
      )}

      <LinkDialog kb={linkKb} onClose={() => setLinkKb(null)} />
    </div>
  );
}

/* ---------------- 卡片 ---------------- */

function KnowledgeCard({
  kb,
  checked,
  onToggleCheck,
  onLink,
  onEdit,
  onDelete,
}: {
  kb: KnowledgeBase;
  checked: boolean;
  onToggleCheck: () => void;
  onLink: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const modeLabel = kb.mode === "qa" ? "通用模式" : "客服模式";

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-card transition-[border-color,box-shadow] duration-150 hover:shadow-md ${
        checked ? "border-primary ring-1 ring-primary" : ""
      }`}
    >
      {/* 头部：大头像 + 标题/徽章 */}
      <div className="flex items-start gap-3.5 p-5 pb-3">
        <KbAvatar icon={kb.icon} className="size-12 text-2xl" rounded="rounded-xl" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/rag/${kb.id}`}
            className="block truncate text-base font-semibold leading-tight hover:underline"
          >
            {kb.name}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {kb.published && (
              <Badge className="border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                已发布
              </Badge>
            )}
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {modeLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* 描述区：固定高度，撑起卡片 */}
      <Link href={`/rag/${kb.id}`} className="flex-1 px-5 pb-4">
        <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
          {kb.description || "暂无描述"}
        </p>
      </Link>

      {/* 统计行 */}
      <div className="flex items-center gap-4 px-5 pb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="size-3.5" /> {kb.docCount} 文档
        </span>
        <span className="flex items-center gap-1">
          <Layers className="size-3.5" /> {kb.chunkCount} 分段
        </span>
        <span>{(kb.totalChars / 1000).toFixed(1)}k 字</span>
      </div>

      {/* 操作条：链接/编辑/删除｜召回测试/聊天 + 勾选 */}
      <div className="flex items-center justify-between border-t px-3 py-1.5">
        <div className="flex items-center gap-1">
          <IconAction title="链接" onClick={onLink}>
            <Link2 className="size-4" />
          </IconAction>
          <IconAction title="编辑" onClick={onEdit}>
            <Pencil className="size-4" />
          </IconAction>
          <IconAction title="删除" onClick={onDelete}>
            <Trash2 className="size-4" />
          </IconAction>
          <span className="mx-1.5 h-4 w-px bg-border" />
          <LinkAction href={`/rag/${kb.id}?tab=retrieval`} title="召回测试">
            <Target className="size-4" />
          </LinkAction>
          <LinkAction href={`/rag/${kb.id}/chat`} title="基于该知识库聊天">
            <MessagesSquare className="size-4" />
          </LinkAction>
        </div>
        <button
          aria-label="选择知识库"
          onClick={onToggleCheck}
          className={`flex size-5 items-center justify-center rounded border transition-colors duration-150 ${
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          }`}
        >
          {checked && <Check className="size-3" />}
        </button>
      </div>
    </div>
  );
}

function IconAction({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded-md p-2 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

function LinkAction({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-label={title}
      className="rounded-md p-2 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
    >
      {children}
    </Link>
  );
}

/* ---------------- 链接弹窗（对齐截图 7） ---------------- */

const SHARE_METHODS = [
  { key: "link", title: "链接访问", desc: "适合直接打开或分享链接", ready: true },
  { key: "iframe", title: "Iframe 嵌入", desc: "适合嵌入到已有页面", ready: false },
  { key: "script", title: "脚本挂载", desc: "适合接入站点悬浮入口", ready: false },
  { key: "bot", title: "iLink Bot", desc: "适合微信扫码绑定后对话", ready: false },
] as const;

function LinkDialog({ kb, onClose }: { kb: KnowledgeBase | null; onClose: () => void }) {
  // SSR 阶段无 window；弹窗只在客户端交互后打开
  const chatUrl = kb && typeof window !== "undefined" ? `${window.location.origin}/rag/${kb.id}/chat` : "";
  // 记录已复制过的 kb id，切换弹窗目标时自动回到未复制态（无 effect setState）
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const copied = kb !== null && copiedId === kb.id;

  return (
    <Dialog open={kb !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>分享「{kb?.name}」</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3 py-1">
          {SHARE_METHODS.map((m) => (
            <div
              key={m.key}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${
                m.ready ? "border-primary ring-1 ring-primary" : "opacity-60"
              }`}
            >
              <div className="flex h-14 w-full items-center justify-center rounded-lg bg-muted">
                {m.ready ? (
                  <ExternalLink className="size-6 text-muted-foreground" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">即将上线</span>
                )}
              </div>
              <div className="text-sm font-medium">{m.title}</div>
              <div className="text-[11px] leading-snug text-muted-foreground">{m.desc}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">链接访问</Badge>
            <Badge variant="outline">知识库</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={chatUrl} target="_blank" rel="noreferrer">
                  打开
                </a>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(chatUrl);
                  if (kb) setCopiedId(kb.id);
                  toast.success("链接已复制");
                }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                复制链接
              </Button>
            </div>
          </div>
          <div className="text-sm font-medium">链接地址</div>
          <p className="text-xs text-muted-foreground">
            复制后可直接在浏览器打开或分享，链接已自动带上当前知识库参数。
          </p>
          <div className="overflow-x-auto rounded-lg bg-zinc-900 px-4 py-3">
            <code className="break-all text-xs text-zinc-100">{chatUrl}</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
