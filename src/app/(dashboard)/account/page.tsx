"use client";

import Link from "next/link";
import { ChevronRight, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOUNT, NAV_ITEMS } from "@/components/layout/nav-config";

export default function AccountPage() {
  const initial = ACCOUNT.name.slice(0, 1);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">管理账户</h1>
        <p className="text-sm text-muted-foreground">查看账户信息与登录偏好</p>
      </div>

      {/* 账户概览 */}
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary text-xl text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{ACCOUNT.name}</span>
              <Badge variant="secondary">{ACCOUNT.plan}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {ACCOUNT.email}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快捷入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">快捷入口</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {NAV_ITEMS.flatMap((item) => item.children).map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="group flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:bg-accent active:scale-[0.99]"
            >
              <child.icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{child.label}</div>
                <div className="truncate text-xs text-muted-foreground">{child.description}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* 安全与偏好（展示占位，功能随登录态接入） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">安全</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row icon={<UserRound className="size-4" />} label="个人信息" hint="名称与邮箱（当前为演示数据）" />
          <Row icon={<KeyRound className="size-4" />} label="登录密码" hint="首次登录后可修改" />
          <Row icon={<ShieldCheck className="size-4" />} label="两步验证" hint="未开启" />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ icon, label, hint }: { icon: React.ReactNode; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground/40" />
    </div>
  );
}
