"use client";

import { Activity, Coins, Gauge, Waypoints } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats, useUsage } from "@/hooks/use-api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function GatewayDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: usage } = useUsage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">仪表盘</h1>
        <p className="text-sm text-muted-foreground">LLM 网关运行总览</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="今日请求数"
          icon={<Activity className="size-4 text-muted-foreground" />}
          value={stats?.todayRequests}
          loading={isLoading}
        />
        <StatCard
          title="Token 消耗"
          icon={<Coins className="size-4 text-muted-foreground" />}
          value={stats ? formatNumber(stats.todayTokens) : undefined}
          loading={isLoading}
        />
        <StatCard
          title="活跃渠道"
          icon={<Waypoints className="size-4 text-muted-foreground" />}
          value={stats ? `${stats.activeChannels} / ${stats.totalChannels}` : undefined}
          hint="启用 / 总数"
          loading={isLoading}
        />
        <StatCard
          title="平均延迟"
          icon={<Gauge className="size-4 text-muted-foreground" />}
          value={stats ? `${stats.avgLatencyMs} ms` : undefined}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近 7 日请求趋势</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {usage ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usage.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    name="请求数"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="latencyMs"
                    name="平均延迟 (ms)"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">模型调用 Top 5</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {usage ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usage.topModels} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="model" width={150} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="requests" name="请求数" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  hint,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  value?: string | number;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading || value === undefined ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-semibold">{value}</div>
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
