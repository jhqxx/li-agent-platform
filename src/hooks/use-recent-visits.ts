"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import type { NavChild } from "@/components/layout/nav-config";

const STORAGE_KEY = "liagent:recent-visits";
const MAX_ITEMS = 5;
/** 忽略记录的路径前缀 */
const IGNORED = ["/account"];

export interface RecentVisit {
  href: string;
  label: string;
  description: string;
  at: number;
}

function resolveChild(pathname: string): NavChild | null {
  for (const item of NAV_ITEMS) {
    for (const child of item.children) {
      if (pathname === child.href || pathname.startsWith(`${child.href}/`)) {
        return child;
      }
    }
  }
  return null;
}

function read(): RecentVisit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentVisit[]) : [];
  } catch {
    return [];
  }
}

/**
 * 记录并读取最近访问的菜单（localStorage，无需后端）。
 * 用 useSyncExternalStore 订阅 localStorage 变化，避免 effect 里直接 setState。
 */
export function useRecentVisits(): RecentVisit[] {
  const pathname = usePathname();
  const [version, setVersion] = React.useState(0);

  // 路由变化时写入记录，然后 bump version 触发重读
  React.useEffect(() => {
    if (IGNORED.some((p) => pathname.startsWith(p))) return;
    const child = resolveChild(pathname);
    if (!child) return;
    const id = setTimeout(() => {
      try {
        const list = read().filter((r) => r.href !== child.href);
        list.unshift({
          href: child.href,
          label: child.label,
          description: child.description,
          at: Date.now(),
        });
        const trimmed = list.slice(0, MAX_ITEMS);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        setVersion((v) => v + 1);
      } catch {
        // localStorage 不可用时静默降级
      }
    }, 0);
    return () => clearTimeout(id);
  }, [pathname]);

  // version 仅作为重读信号（写入后 bump），值本身不参与计算
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recents = React.useMemo(() => read(), [version]);
  return recents;
}

export function clearRecentVisits() {
  window.localStorage.removeItem(STORAGE_KEY);
}
