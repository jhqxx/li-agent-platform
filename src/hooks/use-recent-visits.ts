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
  /** 累计访问次数：排序主键，避免顺序抖动 */
  visits?: number;
  /** 最近一次访问时间：排序次键 */
  lastAt?: number;
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

/** 写入延迟：用户点击最近访问后，页面跳转瞬间列表不能重排（否则被点项上移导致误触） */
const WRITE_DELAY_MS = 1500;

/**
 * 记录并读取最近访问的菜单（localStorage，无需后端）。
 * 写入刻意延迟 1.5s：跳转动画期间列表保持稳定，之后才重排。
 */
export function useRecentVisits(): RecentVisit[] {
  const pathname = usePathname();
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    if (IGNORED.some((p) => pathname.startsWith(p))) return;
    const child = resolveChild(pathname);
    if (!child) return;
    const id = setTimeout(() => {
      try {
        const list = read();
        const existing = list.find((r) => r.href === child.href);
        const rest = list.filter((r) => r.href !== child.href);
        const updated: RecentVisit = {
          href: child.href,
          label: child.label,
          description: child.description,
          // 保留首次访问时间作为权重基础，仅刷新展示时间
          at: existing ? existing.at : Date.now(),
          visits: (existing?.visits ?? 0) + 1,
          lastAt: Date.now(),
        };
        // 按访问次数优先、最近访问其次排序，顺序稳定不抖动
        const merged = [updated, ...rest]
          .sort((a, b) => (b.visits ?? 0) - (a.visits ?? 0) || (b.lastAt ?? 0) - (a.lastAt ?? 0))
          .slice(0, MAX_ITEMS);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setVersion((v) => v + 1);
      } catch {
        // localStorage 不可用时静默降级
      }
    }, WRITE_DELAY_MS);
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
