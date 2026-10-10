"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  Home,
  History,
  Sparkles,
  LifeBuoy,
  UserRound,
  ChevronRight,
  Cog,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  ACCOUNT,
  NAV_ITEMS,
  OPEN_SEARCH_EVENT,
  isActive,
} from "@/components/layout/nav-config";
import { useRecentVisits } from "@/hooks/use-recent-visits";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** Cloudflare 风格侧边栏：账户块 → 快搜 → 主导航 → 底部管理账户 */
function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const recents = useRecentVisits();
  const [mounted, setMounted] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  // ⌘K 切换；搜索框通过自定义事件打开
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    const openEvent = () => setSearchOpen(true);
    document.addEventListener("keydown", down);
    document.addEventListener(OPEN_SEARCH_EVENT, openEvent);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener(OPEN_SEARCH_EVENT, openEvent);
    };
  }, []);

  const goto = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  return (
    <>
      <Sidebar collapsible="icon">
        {/* 账户块（Cloudflare：头像 + 邮箱 + 切换箭头） */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" tooltip={ACCOUNT.email} className="transition-colors duration-200">
                    <Avatar className="size-7 rounded-md">
                      <AvatarFallback className="rounded-md bg-primary text-xs text-primary-foreground">
                        {ACCOUNT.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-sm font-medium">{ACCOUNT.email}</span>
                      <span className="truncate text-xs text-muted-foreground">{ACCOUNT.plan}</span>
                    </div>
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{ACCOUNT.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{ACCOUNT.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    <UserRound /> 账户主页
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    <LogOut /> 退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* 快速搜索 */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="快速搜索"
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground transition-colors duration-200"
              >
                <Search />
                <span>快速搜索…</span>
                <span className="ml-auto flex items-center gap-0.5 group-data-[collapsible=icon]:hidden">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* 主导航 */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/"}
                    tooltip="账户主页"
                    className="transition-colors duration-200"
                  >
                    <Link href="/">
                      <Home />
                      <span>账户主页</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* 最近访问（localStorage 数据挂载后才渲染，避免水合不匹配） */}
          <RecentVisitsGroup recents={mounted ? recents : []} pathname={pathname} />

          {/* 三个功能分组（可折叠，Cloudflare 分组样式） */}
          {NAV_ITEMS.map((item) => {
            const groupActive = isActive(pathname, item.match);
            return (
              <SidebarGroup key={item.label}>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible defaultOpen={groupActive} className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={groupActive}
                          className="transition-colors duration-200"
                        >
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden transition-all duration-200">
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton asChild isActive={isActive(pathname, child.href)}>
                                <Link href={child.href}>{child.label}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        {/* 底部：管理账户 */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/account")}
                tooltip="管理账户"
                className="transition-colors duration-200"
              >
                <Link href="/account">
                  <Cog />
                  <span>管理账户</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* 全局命令面板 */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="快速搜索…" />
        <CommandList>
          <CommandEmpty>没有匹配的菜单</CommandEmpty>
          <CommandGroup heading="导航">
            <CommandItem value="账户主页 home" onSelect={() => goto("/")}>
              <Home className="size-4" />
              账户主页
            </CommandItem>
            <CommandItem value="管理账户 account" onSelect={() => goto("/account")}>
              <Cog className="size-4" />
              管理账户
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          {NAV_ITEMS.map((item) => (
            <React.Fragment key={item.label}>
              <CommandGroup heading={item.label}>
                {item.children.map((child) => (
                  <CommandItem
                    key={child.href}
                    value={`${item.label} ${child.label} ${child.description}`}
                    onSelect={() => goto(child.href)}
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
    </>
  );
}

/** 顶栏：极简，右侧动作区（询问 AI / 支持 / 头像） */
function TopBar() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="transition-colors duration-150" />
      <nav className="ml-auto flex items-center gap-1">
        <button
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
          onClick={() => router.push("/agents")}
        >
          <Sparkles className="size-4" /> 询问 AI
        </button>
        <button
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
          onClick={() => router.push("/account")}
        >
          <LifeBuoy className="size-4" /> 支持
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full transition-colors duration-150 hover:bg-accent">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {ACCOUNT.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{ACCOUNT.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{ACCOUNT.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/account")}>
              <UserRound /> 账户主页
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <LogOut /> 退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
}

function SidebarMenuSubLabel({ children }: { children: React.ReactNode }) {
  // SidebarMenuSub 是 ul，子元素必须是 li，否则水合不匹配
  return (
    <li
      data-slot="sidebar-menu-sub-label"
      className="list-none px-2 py-1 text-xs text-muted-foreground"
    >
      {children}
    </li>
  );
}

function RecentVisitsGroup({
  recents,
  pathname,
}: {
  recents: Array<{ href: string; label: string }>;
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="最近访问" className="transition-colors duration-200">
                <History />
                <span>最近访问</span>
                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden transition-all duration-200">
              <SidebarMenuSub>
                {recents.length === 0 ? (
                  <SidebarMenuSubLabel>暂无记录</SidebarMenuSubLabel>
                ) : (
                  recents.map((r) => (
                    <SidebarMenuSubItem key={r.href}>
                      <SidebarMenuSubButton asChild isActive={pathname === r.href}>
                        <Link href={r.href}>{r.label}</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
