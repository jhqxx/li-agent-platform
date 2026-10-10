"use client";

import * as React from "react";
import { FileStack, MessagesSquare, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KB_OPTIONS } from "@/lib/mock/kb-defaults";
import { api } from "@/lib/api/client";
import type {
  KbMode,
  KnowledgeBase,
  KnowledgeBaseInput,
} from "@/types";

/** 面向表单的草稿：KnowledgeBaseInput + 本地编辑态（标签输入框内容） */
type KbDraft = KnowledgeBaseInput & { tagInput: string };

const EMOJI_CHOICES = ["📚", "💼", "🐦", "🤖", "🧠", "📊", "🔍", "⚙️", "🏥", "🎓", "📦", "🌐"];

const STEPS = ["基础配置", "高级配置", "安全配置", "语义设置"] as const;

const MODE_META: Record<
  KbMode,
  { title: string; sub: string; desc: string; chips: string[] }
> = {
  qa: {
    title: "通用模式",
    sub: "Q2A 模式",
    desc: "向量化问题与答案，适用于文档检索、知识问答等场景",
    chips: ["文档检索", "知识问答", "RAG"],
  },
  chat: {
    title: "客服模式",
    sub: "Q2Q 模式",
    desc: "仅向量化问题，适用于 FAQ 问答、客服咨询等场景",
    chips: ["FAQ问答", "客服咨询", "精准匹配"],
  },
};

export function defaultDraft(mode: KbMode): KbDraft {
  return {
    name: "",
    description: "",
    icon: "📚",
    mode,
    welcome: "",
    sortOrder: 1,
    tags: [],
    advanced: {
      vectorDb: KB_OPTIONS.vectorDbs[0],
      embeddingModel: KB_OPTIONS.embeddingModels[0],
      summaryModel: KB_OPTIONS.summaryModels[0],
      parseModel: KB_OPTIONS.parseModels[0],
      rerankModel: KB_OPTIONS.rerankModels[0],
      sessionRounds: 3,
      matchCount: 2,
      chunkSize: 1000,
      matchRate: 60,
      webSearch: false,
      emptyHint: "知识库未匹配相关问题，请重新提问",
      docSummary: false,
      sessionCompress: false,
      annotateData: false,
      autoTag: true,
      similarQuestions: true,
      executionTrace: false,
    },
    security: {
      sensitiveFilter: false,
      filterHint: "您输入内容包含敏感词，请重新输入",
      footerHtml: "",
    },
    semantics: { tags: [], synonyms: "" },
    tagInput: "",
  };
}

export function kbToDraft(kb: KnowledgeBase): KbDraft {
  return {
    name: kb.name,
    description: kb.description,
    icon: kb.icon,
    mode: kb.mode,
    welcome: kb.welcome,
    sortOrder: kb.sortOrder,
    tags: kb.tags,
    advanced: kb.advanced,
    security: kb.security,
    semantics: kb.semantics,
    tagInput: "",
  };
}

/* ---------------- 模式选择弹窗 ---------------- */

export function ModePickerDialog({
  open,
  onOpenChange,
  onPicked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPicked: (mode: KbMode) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>选择知识库模式</DialogTitle>
          <DialogDescription className="text-center">
            请选择知识库的工作模式，创建后不可更改
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {(Object.keys(MODE_META) as KbMode[]).map((mode) => {
            const meta = MODE_META[mode];
            return (
              <button
                key={mode}
                onClick={() => onPicked(mode)}
                className="group flex flex-col items-center gap-2 rounded-xl border p-6 text-center transition-colors duration-150 hover:border-primary"
              >
                <div className="flex size-14 items-center justify-center rounded-xl bg-muted text-foreground">
                  {mode === "qa" ? (
                    <FileStack className="size-7" />
                  ) : (
                    <MessagesSquare className="size-7" />
                  )}
                </div>
                <div className="text-base font-semibold">{meta.title}</div>
                <div className="text-sm font-medium text-primary">{meta.sub}</div>
                <p className="text-xs leading-relaxed text-muted-foreground">{meta.desc}</p>
                <div className="flex flex-wrap justify-center gap-1 pt-1">
                  {meta.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- 四步向导 ---------------- */

export function KbWizard({
  open,
  mode,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** 新增：向导前选定的模式；编辑：取被编辑对象 */
  mode: KbMode;
  /** 编辑模式传入现有知识库 */
  editing: KnowledgeBase | null;
  onClose: () => void;
  onSaved: (kb: KnowledgeBase) => void;
}) {
  const [step, setStep] = React.useState(0);
  // 组件以 key 区分实例（新增按模式、编辑按 updatedAt），初始 draft 直接由 props 派生，无 effect 重置
  const [draft, setDraft] = React.useState<KbDraft>(() =>
    editing ? kbToDraft(editing) : defaultDraft(mode),
  );
  const [saving, setSaving] = React.useState(false);
  const isEdit = editing !== null;

  const set = (patch: Partial<KbDraft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const setAdvanced = (patch: Partial<KbDraft["advanced"]>) =>
    setDraft((prev) => ({ ...prev, advanced: { ...prev.advanced, ...patch } }));
  const setSecurity = (patch: Partial<KbDraft["security"]>) =>
    setDraft((prev) => ({ ...prev, security: { ...prev.security, ...patch } }));

  function validate(target: number): string | null {
    if (target > 0) {
      if (!draft.name.trim()) return "请填写名称";
      if (!draft.welcome.trim()) return "请填写欢迎语";
    }
    if (target > 2 && draft.security.sensitiveFilter && !draft.security.filterHint.trim()) {
      return "开启敏感词过滤后，提示语不能为空";
    }
    return null;
  }

  function goStep(target: number) {
    if (target > step) {
      const err = validate(target);
      if (err) {
        toast.error(err);
        return;
      }
    }
    setStep(Math.max(0, Math.min(STEPS.length - 1, target)));
  }

  async function submit() {
    const err = validate(STEPS.length);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const { tagInput, ...input } = draft;
      void tagInput;
      const kb = isEdit
        ? await api.put<KnowledgeBase>(`/knowledge-bases/${editing.id}`, input)
        : await api.post<KnowledgeBase>("/knowledge-bases", input);
      onSaved(kb);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑知识库" : "新增知识库"}</DialogTitle>
        </DialogHeader>

        {/* 步骤条 */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => goStep(i)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm transition-colors duration-150 ${
                i === step
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full text-xs ${
                  i === step ? "bg-primary-foreground/20" : "bg-muted"
                }`}
              >
                {i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-[380px]">
          {step === 0 && <StepBasic draft={draft} set={set} lockedMode />}
          {step === 1 && <StepAdvanced draft={draft} setAdvanced={setAdvanced} />}
          {step === 2 && <StepSecurity draft={draft} setSecurity={setSecurity} />}
          {step === 3 && (
            <StepSemantics
              draft={draft}
              set={set}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => goStep(step + 1)}>下一步</Button>
          ) : (
            <Button onClick={submit} disabled={saving}>
              {saving ? "保存中…" : "确认"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Step 组件 ---------------- */

function Field({
  required,
  label,
  hint,
  children,
  className,
}: {
  required?: boolean;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <Label className="w-24 shrink-0 pt-2 text-sm">
        {required && <span className="mr-0.5 text-destructive">*</span>}
        {label}
        {hint && <span className="ml-1 text-xs text-muted-foreground">{hint}</span>}
      </Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function StepBasic({
  draft,
  set,
  lockedMode,
}: {
  draft: KbDraft;
  set: (patch: Partial<KbDraft>) => void;
  lockedMode: boolean;
}) {
  return (
    <div className="space-y-4 py-2">
      <Field required label="头像">
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((emoji) => (
            <button
              key={emoji}
              onClick={() => set({ icon: emoji })}
              className={`flex size-11 items-center justify-center rounded-lg border text-xl transition-colors duration-150 ${
                draft.icon === emoji
                  ? "border-primary bg-primary/10"
                  : "border-dashed hover:bg-accent"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Field>
      <Field required label="名称">
        <Input
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="请输入名称"
        />
      </Field>
      <Field label="知识库描述">
        <div className="relative">
          <Textarea
            value={draft.description}
            onChange={(e) => set({ description: e.target.value.slice(0, 255) })}
            rows={3}
            placeholder="请输入知识库描述，帮助用户了解该知识库的内容"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {draft.description.length} / 255
          </span>
        </div>
      </Field>
      <div className="flex items-center gap-6">
        <div className="flex flex-1 items-center gap-3">
          <Label className="w-24 shrink-0 text-sm">
            知识库模式 <span className="text-xs text-muted-foreground">(?)</span>
          </Label>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={draft.mode === "qa"}
                disabled={lockedMode}
                onChange={() => set({ mode: "qa" })}
              />
              通用模式
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={draft.mode === "chat"}
                disabled={lockedMode}
                onChange={() => set({ mode: "chat" })}
              />
              客服模式
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm">排序值 (?),</Label>
          <div className="flex items-center rounded-md border">
            <button
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => set({ sortOrder: Math.max(1, draft.sortOrder - 1) })}
            >
              −
            </button>
            <span className="w-14 text-center text-sm tabular-nums">{draft.sortOrder}</span>
            <button
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => set({ sortOrder: draft.sortOrder + 1 })}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <Field required label="欢迎语">
        <div className="relative">
          <Textarea
            value={draft.welcome}
            onChange={(e) => set({ welcome: e.target.value.slice(0, 1024) })}
            rows={5}
            placeholder="描述知识库的内容，详尽的描述将帮助AI深入理解该知识库的内容，能更准确的检索到内容，提高该知识库的命中率。"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {draft.welcome.length} / 1024
          </span>
        </div>
      </Field>
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  min = 1,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center rounded-md border">
      <button
        className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <span className="w-full min-w-16 text-center text-sm tabular-nums">{value}</span>
      <button
        className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => onChange(value + step)}
      >
        +
      </button>
    </div>
  );
}

function StepAdvanced({
  draft,
  setAdvanced,
}: {
  draft: KbDraft;
  setAdvanced: (patch: Partial<KbDraft["advanced"]>) => void;
}) {
  const a = draft.advanced;
  return (
    <div className="space-y-5 py-2">
      <SectionTitle>模型配置</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Field required label="向量库">
          <Select value={a.vectorDb} onValueChange={(v) => setAdvanced({ vectorDb: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KB_OPTIONS.vectorDbs.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field required label="向量模型">
          <Select value={a.embeddingModel} onValueChange={(v) => setAdvanced({ embeddingModel: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KB_OPTIONS.embeddingModels.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field required label="总结模型">
          <Select value={a.summaryModel} onValueChange={(v) => setAdvanced({ summaryModel: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KB_OPTIONS.summaryModels.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field required label="解析模型" hint="?">
          <Select value={a.parseModel} onValueChange={(v) => setAdvanced({ parseModel: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KB_OPTIONS.parseModels.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="重排模型" hint="?">
          <Select value={a.rerankModel} onValueChange={(v) => setAdvanced({ rerankModel: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KB_OPTIONS.rerankModels.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <SectionTitle>检索配置</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Field required label="会话轮数" hint="?">
          <NumberStepper value={a.sessionRounds} onChange={(v) => setAdvanced({ sessionRounds: v })} />
        </Field>
        <Field required label="匹配条数" hint="?">
          <NumberStepper value={a.matchCount} onChange={(v) => setAdvanced({ matchCount: v })} />
        </Field>
        <Field label="分片值" hint="?">
          <NumberStepper value={a.chunkSize} onChange={(v) => setAdvanced({ chunkSize: v })} step={100} />
        </Field>
        <Field label="匹配率" hint="?">
          <div className="flex items-center gap-3 pt-2">
            <Slider
              value={[a.matchRate]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => setAdvanced({ matchRate: v })}
            />
            <span className="w-10 text-right text-sm tabular-nums">{a.matchRate}%</span>
          </div>
        </Field>
        <div className="flex items-center gap-3">
          <Label className="text-sm">联网搜索</Label>
          <Switch checked={a.webSearch} onCheckedChange={(v) => setAdvanced({ webSearch: v })} />
        </div>
        <Field required label="空提示" hint="?">
          <Input
            value={a.emptyHint}
            onChange={(e) => setAdvanced({ emptyHint: e.target.value })}
            placeholder="知识库未匹配相关问题，请重新提问"
          />
        </Field>
      </div>

      <SectionTitle>处理选项</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {(
          [
            ["文档总结", "docSummary"],
            ["会话压缩", "sessionCompress"],
            ["标注数据", "annotateData"],
            ["自动标签", "autoTag"],
            ["相似问题", "similarQuestions"],
            ["执行溯源", "executionTrace"],
          ] as const
        ).map(([label, key]) => (
          <div key={key} className="flex items-center gap-3">
            <Label className="w-20 text-sm">
              {label} <span className="text-xs text-muted-foreground">?</span>
            </Label>
            <Switch checked={a[key]} onCheckedChange={(v) => setAdvanced({ [key]: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepSecurity({
  draft,
  setSecurity,
}: {
  draft: KbDraft;
  setSecurity: (patch: Partial<KbDraft["security"]>) => void;
}) {
  const s = draft.security;
  return (
    <div className="space-y-5 py-2">
      <SectionTitle>内容过滤</SectionTitle>
      <div className="grid grid-cols-2 gap-x-6">
        <div className="flex items-center gap-3">
          <Label className="text-sm">敏感词过滤</Label>
          <Switch
            checked={s.sensitiveFilter}
            onCheckedChange={(v) => setSecurity({ sensitiveFilter: v })}
          />
        </div>
        {s.sensitiveFilter && (
          <Field required label="提示" hint="?">
            <Input
              value={s.filterHint}
              onChange={(e) => setSecurity({ filterHint: e.target.value })}
              placeholder="您输入内容包含敏感词，请重新输入"
            />
          </Field>
        )}
      </div>
      <SectionTitle>附加信息</SectionTitle>
      <Field label="底部信息">
        <Textarea
          value={s.footerHtml}
          onChange={(e) => setSecurity({ footerHtml: e.target.value })}
          rows={4}
          placeholder="聊天框底部的信息，支持 HTML 语法"
        />
      </Field>
    </div>
  );
}

function StepSemantics({
  draft,
  set,
}: {
  draft: KbDraft;
  set: (patch: Partial<KbDraft>) => void;
}) {
  function addTag() {
    const tag = draft.tagInput.trim();
    if (!tag) return;
    if (draft.tags.includes(tag)) {
      toast.error("标签已存在");
      return;
    }
    set({ tags: [...draft.tags, tag], tagInput: "" });
  }

  return (
    <div className="space-y-5 py-2">
      <Field label="知识库标签" hint="?">
        <div className="flex flex-wrap items-center gap-2">
          {draft.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border bg-muted/60 px-2.5 py-1 text-xs"
            >
              {tag}
              <button
                onClick={() => set({ tags: draft.tags.filter((t) => t !== tag) })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <Input
              value={draft.tagInput}
              onChange={(e) => set({ tagInput: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="添加标签"
              className="h-8 w-28 text-xs"
            />
            <Button variant="ghost" size="icon" className="size-8" onClick={addTag}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </Field>
      <div className="border-t border-dashed pt-4">
        <Field label="同义词术语" hint="?">
          <Input
            value={draft.semantics.synonyms}
            onChange={(e) =>
              set({ semantics: { ...draft.semantics, synonyms: e.target.value } })
            }
            placeholder="请选择同义词术语"
          />
        </Field>
      </div>
    </div>
  );
}
