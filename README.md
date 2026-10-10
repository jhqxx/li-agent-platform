# Li Agent Platform

RAG · Agent · LLM 网关一体化管理平台（前端）。

基于 Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui 构建的现代化管理界面，当前为「契约先行 + Mock 数据」阶段：前端只依赖标准 REST 契约，数据由 Next.js Route Handlers + 内存 Store 提供，后续 Java Spring AI 后端就绪后可零成本切换。

## 功能总览

| 模块 | 功能 |
|---|---|
| 账户主页 | 时钟大标题、全局搜索、常用菜单 / 最近访问 / AI 快捷操作三列、推广横幅、Analytics 迷你趋势卡 |
| RAG 管理 | 知识库列表（卡片）、文档上传（txt/md）、分段预览、检索测试（模拟评分 + 分数） |
| Agent 管理 | Agent 列表、编排页（模型/温度/TopP/人设 Prompt/知识库挂载/开场白）、调试 Playground（Mock 回复 + 知识库引用回显） |
| LLM 网关 | 仪表盘（4 统计卡 + 趋势 + 模型 Top5）、用量（趋势/占比/渠道汇总）、渠道（增删改测，支持 OpenAI/DeepSeek/Claude/Gemini）、密钥（`sk-liagentplantform-*`、配额、有效期）、日志（关键词/渠道/模型筛选 + 分页 + 详情）、设置（服务/通用/界面/重试策略四 Tab） |
| 账户 | 管理账户页（概览/快捷入口/安全占位）、最近访问（localStorage） |

交互特性：⌘K 全局命令面板、Cloudflare 风格侧边栏（账户块 + 快搜 + 可折叠分组 + 底部管理账户）、深色模式、菜单切换动画。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
```

其他命令：

```bash
npm run build      # 生产构建（Turbopack）
npm run lint       # ESLint 9
npx next typegen   # 重新生成路由类型
```

环境变量（可选）：

```bash
# 指向后端 API（默认同源 /api/v1，即 Next.js Mock 实现）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## 目录结构

```
src/
├── app/
│   ├── (dashboard)/            # 路由组：共享侧边栏布局（括号不进 URL）
│   │   ├── layout.tsx          #   AppShell（侧边栏 + 顶栏）
│   │   ├── page.tsx            #   / 账户主页
│   │   ├── account/page.tsx    #   /account 管理账户
│   │   ├── rag/                #   /rag 知识库列表 + [kbId] 详情（文档/分段/检索测试）
│   │   ├── agents/             #   /agents 列表 + [agentId] 编排页
│   │   └── gateway/            #   网关六页（dashboard/usage/channels/keys/logs/settings）
│   └── api/v1/                 # REST 契约的 Mock 实现（后续由 Java 后端替代）
├── components/
│   ├── layout/                 # AppShell + nav-config（菜单单一数据源）
│   ├── ui/                     # shadcn/ui 基础组件
│   └── providers.tsx           # react-query Provider
├── hooks/                      # use-api（全部数据 hooks）、use-recent-visits
├── lib/
│   ├── api/client.ts           # fetch 封装（读 NEXT_PUBLIC_API_BASE_URL）
│   └── mock/                   # 内存 Store（globalThis 单例）+ 种子数据 + 模拟分词
└── types/                      # API 契约类型（对齐未来 Java DTO）
```

## API 契约（前端依赖的全部接口）

资源命名对齐 Spring Boot 习惯，JSON 字段 camelCase，分页 `?page=&size=`（page 从 0 开始）→ `{ items, total, page, size }`：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET/POST | `/api/v1/channels` | 渠道列表 / 新增 |
| PUT/DELETE | `/api/v1/channels/{id}` | 编辑 / 删除 |
| POST | `/api/v1/channels/{id}/test` | 连通性测试 |
| GET/POST | `/api/v1/keys` | 密钥列表 / 创建（完整 key 仅创建响应返回一次） |
| PUT/DELETE | `/api/v1/keys/{id}` | 编辑（含启停）/ 删除 |
| GET | `/api/v1/logs` | 日志（`keyword/channelId/model/status/page/size`） |
| GET | `/api/v1/stats/dashboard` | 仪表盘 4 项统计 |
| GET | `/api/v1/usage` | 用量（趋势/模型 Top/渠道汇总） |
| GET/PUT | `/api/v1/settings` | 设置（service/general/ui/retry 四组，可分组合并保存） |
| GET/POST | `/api/v1/knowledge-bases` | 知识库列表 / 创建 |
| GET/DELETE | `/api/v1/knowledge-bases/{id}` | 详情 / 删除（级联文档与分段） |
| GET | `/api/v1/knowledge-bases/{id}/documents` · `/chunks` | 文档列表 / 分段列表 |
| POST | `/api/v1/knowledge-bases/{id}/documents` | 上传文档（multipart `file`，同步解析切分） |
| POST | `/api/v1/knowledge-bases/{id}/search` | 检索测试 `{ query, topK }` → 命中分段 + 分数 |
| GET/POST | `/api/v1/agents` | Agent 列表 / 创建 |
| GET/PUT/DELETE | `/api/v1/agents/{id}` | 详情 / 编辑 / 删除 |
| POST | `/api/v1/agents/{id}/chat` | 调试对话 `{ message }` → 回复 + citations |

## 后端对接指南（Java Spring AI）

1. 按上表实现同构接口（建议 springdoc 生成文档与前端 `src/types/` 比对字段）。
2. 前端切换：设 `NEXT_PUBLIC_API_BASE_URL` 指向 Java 服务，或在 `next.config.ts` 加 rewrite 代理，前端代码零改动。
3. 联调通过后移除 `src/app/api/v1/` 与 `src/lib/mock/`（或保留作本地开发 fallback）。

## 当前 Mock 边界

- 数据存内存（`globalThis` 单例），dev 热重载不丢，重启即还原种子数据。
- 渠道测试、Agent 对话、检索评分均为模拟实现（检索用 CJK bigram + 关键词覆盖率评分）。
- 仅支持 txt/md 文档上传；PDF 解析与真实 Embedding 见 TODO。

## 后续迭代

见 [docs/TODO.md](docs/TODO.md)：Agent 完整编排画布、真实 LLM 转发、真实 Embedding 向量化、流式响应、Spring AI 对接。
