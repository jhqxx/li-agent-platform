"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Waypoints, CornerDownLeft } from "lucide-react";
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
import {
  NAV_ITEMS,
  OPEN_SEARCH_EVENT,
  isActive,
} from "@/components/layout/nav-config";

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

/** 顶部一级菜单 + 大搜索框 + 全局命令面板 */
function TopNav() {
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

  // ⌘K 切换；首页搜索框通过自定义事件打开同一面板
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
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur">
      <SidebarTrigger className="transition-transform duration-200 active:scale-90" />

      {/* 大屏大搜索框 */}
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
        {NAV_ITEMS.map((item) => (
          <TopNavItem key={item.label} href={item.href} label={item.label} match={item.match} />
        ))}
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

function TopNavItem({
  href,
  label,
  match,
}: {
  href: string;
  label: string;
  match: string;
}) {
  const active = isActive(usePathname(), match);
  return (
    <Link
      href={href}
      className={`relative rounded-full px-3 py-1.5 text-sm transition-all duration-200 active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
