# 后续迭代 TODO

## RAG 知识库（本迭代留存）

本期已落地：知识库模式（通用 Q2A / 客服 Q2Q，仅存储+展示）、四步创建/编辑向导（基础/高级/安全/语义）、卡片五操作（链接/编辑/删除/召回测试/聊天）、链接分享弹窗、动态聊天页 `/rag/[kbId]/chat`（Mock 回复 + 引用）。留待后续：

- [ ] 访问控制（是否对外 / 安全密钥 / 可见范围）——安全配置 Tab 中省略的部分
- [ ] 其余分享方式：Iframe 嵌入、脚本挂载、iLink Bot（弹窗中已占位「即将上线」）
- [ ] 客服模式（Q2Q）的真实检索分支：仅匹配问答对、精准匹配逻辑
- [ ] 聊天页真实 LLM 接入 + 流式响应（当前 Mock 回复 + 引用）
- [ ] 知识库勾选批量删除的空态优化与回收站

## Agent 完整编排（本迭代留存）

当前 Agent 管理实现了「列表 + 编排表单 + 调试 Playground」。完整编排能力（参考 Coze 工作流画布）留待后续迭代：

- [ ] 节点式工作流画布（触发器 → LLM 节点 → 知识库检索节点 → 条件分支 → 输出）
- [ ] 工具/插件管理（HTTP 调用、代码执行、内置插件市场）
- [ ] 多 Agent 协作编排（子 Agent 调用、消息传递）
- [ ] 编排版本管理与发布流程（草稿 → 测试 → 生产）

## 数据层升级（对接 Java Spring AI 后端）

当前为「契约先行 + Mock 实现」：前端只依赖 `src/types/` 的 REST 契约与 `src/lib/api/client.ts` 的 fetch 封装，数据由 `/api/v1/*` Route Handlers + 内存 Store（`src/lib/mock/`）提供。

- [ ] Java Spring AI 实现同一套 `/api/v1` 契约（camelCase DTO、`page/size → { items, total }` 分页）
- [ ] 前端切换：设 `NEXT_PUBLIC_API_BASE_URL=http://<java-host>/api/v1`，或在 `next.config.ts` 加 rewrite 代理
- [ ] 移除 `src/app/api/v1/` 与 `src/lib/mock/`（或保留作为本地开发 fallback）
- [ ] 鉴权：密钥校验、配额扣减移到网关后端

## 真实能力接入

- [ ] LLM 真实转发：网关按渠道配置转发 chat 请求（当前 `/agents/{id}/chat` 与渠道测试均为 Mock）
- [ ] 真实 Embedding 向量化 + 向量库（替换 `src/lib/mock/tokenize.ts` 的模拟评分；需先在渠道页配好 Embedding 渠道）
- [ ] PDF 文档解析（当前仅支持 txt/md 文本）
- [ ] 流式响应（SSE）与打字机效果
