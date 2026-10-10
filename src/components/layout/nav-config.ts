import {
  BookOpen,
  Bot,
  KeyRound,
  LayoutDashboard,
  PanelLeftIcon,
  ScrollText,
  Settings,
  TrendingUp,
  Waypoints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavItem {
  label: string;
  href: string;
  /** 路由匹配前缀 */
  match: string;
  icon: LucideIcon;
  children: readonly NavChild[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "RAG 管理",
    href: "/rag",
    match: "/rag",
    icon: BookOpen,
    children: [
      { label: "知识库", href: "/rag", icon: BookOpen, description: "文档上传 · 分段 · 检索测试" },
    ],
  },
  {
    label: "Agent 管理",
    href: "/agents",
    match: "/agents",
    icon: Bot,
    children: [
      { label: "Agent 列表", href: "/agents", icon: Bot, description: "编排 · 调试 · 发布" },
    ],
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

/** 首页「常用子菜单」：网关模块只挑高频项，完整列表仍在侧边栏 */
export const HOME_EXCLUDED = new Set(["/gateway/usage"]);

export function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}

/** 打开全局搜索命令面板（TopNav 监听此事件） */
export const OPEN_SEARCH_EVENT = "liagent:open-search";
