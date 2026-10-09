"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  ChevronDown,
  LayoutDashboard,
  KeyRound,
  ScrollText,
  Settings,
  TrendingUp,
  Waypoints,
  PanelLeftIcon,
} from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarTrigger } from "@/components/ui/sidebar";

const NAV_ITEMS = [
  {
    label: "RAG 管理",
    href: "/rag",
    icon: BookOpen,
    children: [
      { label: "知识库", href: "/rag" },
    ],
  },
  {
    label: "Agent 管理",
    href: "/agents",
    icon: Bot,
    children: [
      { label: "Agent 列表", href: "/agents" },
    ],
  },
  {
    label: "LLM 网关管理",
    href: "/gateway/dashboard",
    icon: Waypoints,
    children: [
      { label: "仪表盘", href: "/gateway/dashboard", icon: LayoutDashboard },
      { label: "用量", href: "/gateway/usage", icon: TrendingUp },
      { label: "渠道", href: "/gateway/channels", icon: PanelLeftIcon },
      { label: "密钥", href: "/gateway/keys", icon: KeyRound },
      { label: "日志", href: "/gateway/logs", icon: ScrollText },
      { label: "设置", href: "/gateway/settings", icon: Settings },
    ],
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/rag") return pathname === "/rag" || pathname.startsWith("/rag/");
  if (href === "/agents") return pathname === "/agents" || pathname.startsWith("/agents/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Waypoints className="size-4" />
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold">Li Agent Platform</span>
              <span className="truncate text-xs text-muted-foreground">RAG · Agent · 网关</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {NAV_ITEMS.map((item) => {
            const groupActive = item.children.some((c) => isActive(pathname, c.href));
            return (
              <SidebarGroup key={item.label}>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                  {item.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.children.length === 1 ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(pathname, item.children[0].href)}
                          tooltip={item.label}
                        >
                          <Link href={item.children[0].href}>
                            <item.icon />
                            <span>{item.children[0].label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={groupActive}
                          tooltip={item.label}
                        >
                          <Link href={item.children[0].href}>
                            <item.icon />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto transition-transform" />
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton asChild isActive={isActive(pathname, child.href)}>
                                <Link href={child.href}>{child.label}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="ml-auto text-xs text-muted-foreground">
            {currentPageTitle(pathname)}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function currentPageTitle(pathname: string): string {
  for (const item of NAV_ITEMS) {
    for (const child of item.children) {
      if (isActive(pathname, child.href)) {
        return `${item.label} / ${child.label}`;
      }
    }
  }
  return "";
}
