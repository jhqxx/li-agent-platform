"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSaveSettings, useSettings } from "@/hooks/use-api";
import type { GatewaySettings } from "@/types";

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const save = useSaveSettings();

  // draft 用「派生 + key 重挂载」模式：data 到达时通过 key 重置整棵编辑树，避免 effect 里 setState
  const [resetKey, setResetKey] = useState(0);
  const savedKey = data ? JSON.stringify(data) : "";
  const [lastKey, setLastKey] = useState(savedKey);
  if (savedKey && savedKey !== lastKey) {
    setLastKey(savedKey);
    setResetKey((n) => n + 1);
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <SettingsForm
      key={resetKey}
      initial={structuredClone(data)}
      saving={save.isPending}
      onSave={(partial) => save.mutate(partial, { onSuccess: () => toast.success("设置已保存") })}
    />
  );
}

function SettingsForm({
  initial,
  saving,
  onSave,
}: {
  initial: GatewaySettings;
  saving: boolean;
  onSave: (partial: Partial<GatewaySettings>) => void;
}) {
  const [draft, setDraft] = useState<GatewaySettings>(initial);

  function saveTab(partial: Partial<GatewaySettings>) {
    onSave(partial);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
        <p className="text-sm text-muted-foreground">网关服务与平台偏好配置</p>
      </div>

      <Tabs defaultValue="service">
        <TabsList>
          <TabsTrigger value="service">服务配置</TabsTrigger>
          <TabsTrigger value="general">通用设置</TabsTrigger>
          <TabsTrigger value="ui">界面设置</TabsTrigger>
          <TabsTrigger value="retry">重试策略</TabsTrigger>
        </TabsList>

        <TabsContent value="service">
          <ServiceTab draft={draft} setDraft={setDraft} onSave={saveTab} saving={saving} />
        </TabsContent>
        <TabsContent value="general">
          <GeneralTab draft={draft} setDraft={setDraft} onSave={saveTab} saving={saving} />
        </TabsContent>
        <TabsContent value="ui">
          <UiTab draft={draft} setDraft={setDraft} onSave={saveTab} saving={saving} />
        </TabsContent>
        <TabsContent value="retry">
          <RetryTab draft={draft} setDraft={setDraft} onSave={saveTab} saving={saving} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type TabProps = {
  draft: GatewaySettings;
  setDraft: (updater: (prev: GatewaySettings) => GatewaySettings) => void;
  onSave: (partial: Partial<GatewaySettings>) => void;
  saving: boolean;
};

function SaveButton({ onSave, saving, partial, label }: { onSave: TabProps["onSave"]; saving: boolean; partial: Partial<GatewaySettings>; label: string }) {
  return (
    <Button onClick={() => onSave(partial)} disabled={saving}>
      {saving ? "保存中…" : label}
    </Button>
  );
}

function ServiceTab({ draft, setDraft, onSave, saving }: TabProps) {
  const s = draft.service;
  return (
    <Card className="mt-4 max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">服务配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>请求超时（秒）</Label>
          <Input
            type="number"
            value={s.timeoutSeconds}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                service: { ...prev.service, timeoutSeconds: Number(e.target.value) },
              }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>代理地址（空为直连）</Label>
          <Input
            value={s.proxyUrl}
            placeholder="http://127.0.0.1:7890"
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                service: { ...prev.service, proxyUrl: e.target.value },
              }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>最大并发数</Label>
          <Input
            type="number"
            value={s.maxConcurrent}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                service: { ...prev.service, maxConcurrent: Number(e.target.value) },
              }))
            }
          />
        </div>
        <SaveButton onSave={onSave} saving={saving} partial={{ service: s }} label="保存服务配置" />
      </CardContent>
    </Card>
  );
}

function GeneralTab({ draft, setDraft, onSave, saving }: TabProps) {
  const g = draft.general;
  return (
    <Card className="mt-4 max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">通用设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>站点名称</Label>
          <Input
            value={g.siteName}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                general: { ...prev.general, siteName: e.target.value },
              }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>服务器地址</Label>
          <Input
            value={g.serverAddress}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                general: { ...prev.general, serverAddress: e.target.value },
              }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>日志保留天数</Label>
          <Input
            type="number"
            value={g.logRetentionDays}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                general: { ...prev.general, logRetentionDays: Number(e.target.value) },
              }))
            }
          />
        </div>
        <SaveButton onSave={onSave} saving={saving} partial={{ general: g }} label="保存通用设置" />
      </CardContent>
    </Card>
  );
}

function UiTab({ draft, setDraft, onSave, saving }: TabProps) {
  const u = draft.ui;
  const { theme: liveTheme, setTheme } = useTheme();
  return (
    <Card className="mt-4 max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">界面设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>主题（立即生效）</Label>
          <Select
            value={liveTheme ?? u.theme}
            onValueChange={(v) => {
              setTheme(v);
              setDraft((prev) => ({
                ...prev,
                ui: { ...prev.ui, theme: v as GatewaySettings["ui"]["theme"] },
              }));
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">浅色</SelectItem>
              <SelectItem value="dark">深色</SelectItem>
              <SelectItem value="system">跟随系统</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>语言</Label>
          <Select
            value={u.language}
            onValueChange={(v) =>
              setDraft((prev) => ({
                ...prev,
                ui: { ...prev.ui, language: v as GatewaySettings["ui"]["language"] },
              }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh-CN">简体中文</SelectItem>
              <SelectItem value="en-US">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>默认每页条数</Label>
          <Input
            type="number"
            value={u.pageSize}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                ui: { ...prev.ui, pageSize: Number(e.target.value) },
              }))
            }
          />
        </div>
        <SaveButton onSave={onSave} saving={saving} partial={{ ui: u }} label="保存界面设置" />
      </CardContent>
    </Card>
  );
}

function RetryTab({ draft, setDraft, onSave, saving }: TabProps) {
  const r = draft.retry;
  return (
    <Card className="mt-4 max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">重试策略</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>失败自动重试次数</Label>
          <Input
            type="number"
            value={r.maxRetries}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                retry: { ...prev.retry, maxRetries: Number(e.target.value) },
              }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>重试退避间隔（秒）</Label>
          <Input
            type="number"
            value={r.retryIntervalSeconds}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                retry: { ...prev.retry, retryIntervalSeconds: Number(e.target.value) },
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>连续失败自动禁用渠道</Label>
            <p className="text-xs text-muted-foreground">
              渠道连续失败达到阈值后自动禁用
            </p>
          </div>
          <Switch
            checked={r.autoDisableEnabled}
            onCheckedChange={(checked) =>
              setDraft((prev) => ({
                ...prev,
                retry: { ...prev.retry, autoDisableEnabled: checked },
              }))
            }
          />
        </div>
        {r.autoDisableEnabled && (
          <div className="grid gap-2">
            <Label>失败次数阈值</Label>
            <Input
              type="number"
              value={r.autoDisableThreshold}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  retry: { ...prev.retry, autoDisableThreshold: Number(e.target.value) },
                }))
              }
            />
          </div>
        )}
        <SaveButton onSave={onSave} saving={saving} partial={{ retry: r }} label="保存重试策略" />
      </CardContent>
    </Card>
  );
}
