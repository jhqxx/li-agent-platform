"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  KeyRound,
  ScrollText,
  Search,
  Settings,
  TrendingUp,
  Waypoints,
  PanelLeftIcon,
  CornerDownLeft,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

const NAV_ITEMS = [
  {
    label: "RAG 管理",
    href: "/rag",
    match: "/rag",
    icon: BookOpen,
    children: [{ label: "知识库", href: "/rag", icon: BookOpen, description: "文档上传 · 分段 · 检索测试" }],
  },
  {
    label: "Agent 管理",
    href: "/agents",
    match: "/agents",
    icon: Bot,
    children: [{ label: "Agent 列表", href: "/agents", icon: Bot, description: "编排 · 调试 · 发布" }],
  },
  {
    label: "LLM 网关管理",
    href: "/gateway/dashboard",
    match: "/gateway",
    icon: Waypoints,
    children: [
      { label: "仪表盘", href: "/gateway/dashboard", icon: LayoutDashboard, description: "请求 · Token · 延迟总览" },
      { label: "用量", href: "/gateway/usage", icon: TrendingUp, description: "按渠道与模型分析消耗" },
      { label: "渠道", href: "/gateway/channels", icon: PanelLeftIcon, description: "上游 LLM 服务接入" },
      { label: "密钥", href: "/gateway/keys", icon: KeyRound, description: "API Key 与配额" },
      { label: "日志", href: "/gateway/logs", icon: ScrollText, description: "请求日志检索" },
      { label: "设置", href: "/gateway/settings", icon: Settings, description: "服务 · 界面 · 重试策略" },
    ],
  },
] as const;

function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeGroup =
    NAV_ITEMS.find((item) => isActive(pathname, item.match)) ?? NAV_ITEMS[2];

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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {activeGroup.children.map((child) => (
                  <SidebarMenuItem key={child.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, child.href)}
                      tooltip={child.label}
                      className="transition-colors duration-200"
                    >
                      <Link href={child.href}>
                        <child.icon />
                        <span>{child.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <TopNav />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** 顶部一级菜单 + 大搜索框 */
function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [searchOpen, setSearchOpen] = React.useState(false);

  // 大屏默认展开搜索菜单（首次进入时）
  React.useEffect(() => {
    if (!isMobile) {
      const t = setTimeout(() => setSearchOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [isMobile]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const goto = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur">
      <SidebarTrigger className="transition-transform duration-200 active:scale-90" />

      {/* 大屏大搜索框（参考 Cloudflare ⌘K 样式） */}
      <button
        onClick={() => setSearchOpen(true)}
        className="group mx-auto hidden h-9 w-full max-w-md items-center gap-2 rounded-full border bg-muted/50 px-4 text-sm text-muted-foreground transition-all duration-200 hover:border-ring hover:bg-muted hover:shadow-sm sm:flex"
      >
        <Search className="size-4 transition-transform duration-200 group-hover:scale-110" />
        <span>搜索菜单…</span>
        <span className="ml-auto flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      {/* 一级菜单置顶 */}
      <nav className="ml-auto flex items-center gap-1 px-2 sm:ml-0">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative rounded-full px-3 py-1.5 text-sm transition-all duration-200 active:scale-95 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="搜索菜单…" />
        <CommandList>
          <CommandEmpty>没有匹配的菜单</CommandEmpty>
          {NAV_ITEMS.map((item) => (
            <React.Fragment key={item.label}>
              <CommandGroup heading={item.label}>
                {item.children.map((child) => (
                  <CommandItem
                    key={child.href}
                    value={`${item.label} ${child.label} ${child.description}`}
                    onSelect={() => goto(child.href)}
                    className="[&_[cmdk-item]]:transition-colors"
                  >
                    <child.icon className="size-4" />
                    <div className="flex flex-col">
                      <span>{child.label}</span>
                      <span className="text-xs text-muted-foreground">{child.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
        <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> 导航
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="size-3" /> 打开
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> 关闭
          </span>
        </div>
      </CommandDialog>
    </header>
  );
}
