"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsage } from "@/hooks/use-api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export default function UsagePage() {
  const { data: usage } = useUsage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">用量</h1>
        <p className="text-sm text-muted-foreground">按时间、模型与渠道维度分析 Token 消耗</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Token 消耗趋势（近 7 日）</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {usage ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usage.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  name="Tokens"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">模型用量占比</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {usage ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usage.topModels}
                    dataKey="requests"
                    nameKey="model"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {usage.topModels.map((entry, index) => (
                      <Cell key={entry.model} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">渠道用量汇总</CardTitle>
          </CardHeader>
          <CardContent>
            {usage ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>渠道</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead className="text-right">请求数</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">错误</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.byChannel.map((row) => (
                    <TableRow key={row.channelId}>
                      <TableCell className="font-medium">{row.channelName}</TableCell>
                      <TableCell>{row.channelType}</TableCell>
                      <TableCell className="text-right">{row.requests}</TableCell>
                      <TableCell className="text-right">{row.tokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {row.errorCount > 0 ? (
                          <span className="text-destructive">{row.errorCount}</span>
                        ) : (
                          "0"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
