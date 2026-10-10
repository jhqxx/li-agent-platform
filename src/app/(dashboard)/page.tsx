"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ChevronRight, Clock } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import {
  NAV_ITEMS,
  OPEN_SEARCH_EVENT,
} from "@/components/layout/nav-config";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* 大标题：当前时区时间 */}
      <div className="flex flex-col items-center py-16 text-center md:py-24">
        <ClockClock />
        <h1 className="mt-6 text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
          <CurrentTime />
        </h1>
      </div>

      {/* 大搜索框：打开全局命令面板 */}
      <HomeSearch />

      {/* 三列常用子菜单 */}
      <div className="mt-10 grid gap-8 pb-16 md:grid-cols-3">
        {NAV_ITEMS.map((item) => (
          <section key={item.label}>
            <Link
              href={item.href}
              className="group flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
              <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <ul className="mt-3 space-y-1">
              {item.children.map((child) => (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-accent active:scale-[0.99]"
                  >
                    <child.icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{child.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {child.description}
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** 客户端时钟：显示浏览器当前时区时间，挂载后才渲染避免水合不一致 */
function CurrentTime() {
  // 订阅 interval 属于外部系统同步，回调里 setState 是 react-hooks 认可的模式
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const wake = () => setNow(new Date());
    // timeout 让首帧即有时钟，不与 effect 体同步 setState
    const init = setTimeout(wake, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(init);
    };
  }, []);

  if (!now) {
    // SSR 与首帧占位，保持尺寸稳定
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
      <span>{time}</span>
      <span className="text-base font-normal text-muted-foreground">
        {date} · {tz}
      </span>
    </span>
  );
}

function ClockClock() {
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
      <Clock className="size-6" />
    </div>
  );
}

function HomeSearch() {
  return (
    <button
      onClick={() => document.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
      className="group mx-auto flex h-12 w-full max-w-2xl items-center gap-3 rounded-2xl border bg-card px-5 text-sm text-muted-foreground shadow-sm transition-all duration-200 hover:border-ring hover:shadow-md"
    >
      <Search className="size-4 transition-transform duration-200 group-hover:scale-110" />
      <span>搜索菜单…</span>
      <span className="ml-auto flex items-center gap-1">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}
