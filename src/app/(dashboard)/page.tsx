"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Clock,
  History,
  Sparkles,
  ArrowUpRight,
  Rocket,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { NAV_ITEMS, OPEN_SEARCH_EVENT } from "@/components/layout/nav-config";
import { useRecentVisits } from "@/hooks/use-recent-visits";
import type { UsageOverview } from "@/types";

export default function HomePage() {
  const recents = useRecentVisits();

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      {/* pill 横幅 */}
      <div className="flex justify-center pt-10">
        <Link
          href="/agents"
          className="group flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Rocket className="size-4 text-primary" />
          <span>用 Agent 编排你的第一个工作流</span>
          <span aria-hidden>🚀 ✨ 🤖</span>
        </Link>
      </div>

      {/* 大标题：当前时区时间 */}
      <div className="flex flex-col items-center py-10 text-center md:py-14">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Clock className="size-6" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
          <CurrentTime />
        </h1>
      </div>

      {/* 大搜索框：打开全局命令面板 */}
      <div className="flex justify-center">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
          className="group flex h-12 w-full max-w-2xl items-center gap-3 rounded-2xl border bg-card px-5 text-sm text-muted-foreground shadow-sm transition-all duration-200 hover:border-ring hover:shadow-md"
        >
          <Search className="size-4 transition-transform duration-200 group-hover:scale-110" />
          <span>搜索</span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      {/* 三列：常用菜单 / 最近访问 / AI 快捷操作 */}
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        <section>
          <SectionHeader label="常用菜单" href="/gateway/dashboard" />
          <ul className="mt-3 space-y-1">
            {NAV_ITEMS.flatMap((item) => item.children)
              .filter((child) => ["/gateway/dashboard", "/gateway/channels", "/gateway/keys", "/rag", "/agents"].includes(child.href))
              .map((child) => (
                <li key={child.href}>
                  <MenuRow
                    href={child.href}
                    icon={<child.icon className="size-4 shrink-0" />}
                    label={child.label}
                    description={child.description}
                  />
                </li>
              ))}
          </ul>
        </section>

        <section>
          <SectionHeader label="最近访问" href={recents[0]?.href ?? "/gateway/dashboard"} />
          <ul className="mt-3 space-y-1">
            {recents.length === 0 ? (
              <li className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                暂无记录，浏览菜单后会自动出现在这里
              </li>
            ) : (
              recents.map((r) => (
                <li key={r.href}>
                  <MenuRow
                    href={r.href}
                    icon={<History className="size-4 shrink-0" />}
                    label={r.label}
                    description={r.description}
                  />
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <SectionHeader label="AI 快捷操作" href="/agents" />
          <ul className="mt-3 space-y-1">
            <li>
              <MenuRow
                href="/agents"
                icon={<Sparkles className="size-4 shrink-0" />}
                label="新建 Agent"
                description="从模板创建并编排"
              />
            </li>
            <li>
              <MenuRow
                href="/rag"
                icon={<Plus className="size-4 shrink-0" />}
                label="上传知识库文档"
                description="构建 Agent 的知识来源"
              />
            </li>
            <li>
              <MenuRow
                href="/gateway/keys"
                icon={<ArrowUpRight className="size-4 shrink-0" />}
                label="创建 API 密钥"
                description="接入你的应用"
              />
            </li>
          </ul>
        </section>
      </div>

      {/* 推广横幅 */}
      <div className="mt-12 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col items-stretch sm:flex-row">
          <div className="flex items-center justify-center bg-primary p-8 text-primary-foreground sm:w-44">
            <Rocket className="size-10" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 p-5">
            <div className="font-medium">让 Agent 连接你的知识库 📚</div>
            <p className="text-sm text-muted-foreground">
              在 RAG 管理上传文档，在 Agent 编排页一键挂载，即刻获得可引用知识来源的智能助手。
            </p>
          </div>
          <div className="flex items-center justify-center p-5">
            <Button asChild>
              <Link href="/rag">开始使用</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="mt-10 pb-16">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Analytics</h2>
          <Link
            href="/gateway/usage"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            查看完整用量
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <HomeAnalytics />
      </div>
    </div>
  );
}

function SectionHeader({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

function MenuRow({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-accent active:scale-[0.99]"
    >
      <span className="text-muted-foreground transition-colors group-hover:text-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

/** 首页 Analytics：今日请求 + Token 两张迷你卡（复用 /api/v1/usage） */
function HomeAnalytics() {
  const { data } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.get<UsageOverview>("/usage"),
  });

  const trend = data?.trend ?? [];
  const today = trend[trend.length - 1];
  const yesterday = trend[trend.length - 2];

  function delta(current?: number, prev?: number): string | null {
    if (!current || !prev) return null;
    const pct = Math.round(((current - prev) / prev) * 100);
    if (!Number.isFinite(pct)) return null;
    return `${pct >= 0 ? "↗" : "↘"} ${Math.abs(pct)}%`;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">今日请求数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {today ? today.requests.toLocaleString() : "—"}
            {delta(today?.requests, yesterday?.requests) && (
              <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                {delta(today?.requests, yesterday?.requests)}
              </span>
            )}
          </div>
          <div className="mt-3 h-20">
            {trend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="reqFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={[0, "dataMax"]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="requests" stroke="var(--chart-1)" fill="url(#reqFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">今日 Token 消耗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {today ? formatTokens(today.tokens) : "—"}
            {delta(today?.tokens, yesterday?.tokens) && (
              <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                {delta(today?.tokens, yesterday?.tokens)}
              </span>
            )}
          </div>
          <div className="mt-3 h-20">
            {trend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="tokFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={[0, "dataMax"]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="tokens" stroke="var(--chart-2)" fill="url(#tokFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** 客户端时钟：显示浏览器当前时区时间，挂载后才渲染避免水合不一致 */
function CurrentTime() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const wake = () => setNow(new Date());
    const init = setTimeout(wake, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(init);
    };
  }, []);

  if (!now) {
    return <span className="invisible">00:00:00</span>;
  }

  const date = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const time = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <span className="flex flex-col items-center gap-2">
      <span className="tabular-nums">{time}</span>
      <span className="text-base font-normal text-muted-foreground">
        {date} · {tz}
      </span>
    </span>
  );
}
