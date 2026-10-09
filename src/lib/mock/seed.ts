import { MODELS_BY_TYPE, nextId, type MockStore } from "./store";
import type {
  Agent,
  ApiKey,
  Channel,
  KbDocument,
  KnowledgeBase,
} from "@/types";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString();
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

export function seed(store: MockStore): void {
  seedChannels(store);
  seedKeys(store);
  seedLogs(store);
  seedKnowledgeBases(store);
  seedAgents(store);
}

function seedChannels(store: MockStore): void {
  const rows: Array<Omit<Channel, "id" | "createdAt" | "updatedAt">> = [
    {
      name: "DeepSeek 官方",
      type: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      apiKeyMasked: "sk-****9f3a",
      models: MODELS_BY_TYPE.DeepSeek,
      priority: 10,
      status: "enabled",
      lastTestOk: true,
      lastTestLatencyMs: 236,
      lastTestAt: minutesAgo(32),
    },
    {
      name: "OpenAI 主力",
      type: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKeyMasked: "sk-****c21e",
      models: MODELS_BY_TYPE.OpenAI,
      priority: 5,
      status: "enabled",
      lastTestOk: true,
      lastTestLatencyMs: 512,
      lastTestAt: minutesAgo(95),
    },
    {
      name: "Claude 备用",
      type: "Claude",
      baseUrl: "https://api.anthropic.com/v1",
      apiKeyMasked: "sk-ant-****77bd",
      models: MODELS_BY_TYPE.Claude,
      priority: 3,
      status: "enabled",
      lastTestOk: false,
      lastTestLatencyMs: 0,
      lastTestAt: minutesAgo(140),
    },
    {
      name: "Gemini 中转",
      type: "Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      apiKeyMasked: "AIza****d04f",
      models: MODELS_BY_TYPE.Gemini,
      priority: 1,
      status: "disabled",
      lastTestOk: null,
      lastTestLatencyMs: null,
      lastTestAt: null,
    },
  ];
  for (const row of rows) {
    const now = new Date().toISOString();
    store.channels.push({
      ...row,
      id: nextId(store, "ch"),
      createdAt: daysAgo(7),
      updatedAt: now,
    });
  }
}

function seedKeys(store: MockStore): void {
  const rows: Array<Omit<ApiKey, "id" | "createdAt" | "lastUsedAt">> = [
    {
      name: "Web 应用默认",
      keyMasked: "sk-liagentplantform-****a1b2",
      quotaLimit: 1_000_000,
      quotaUsed: 372_400,
      expiresAt: null,
      status: "enabled",
    },
    {
      name: "数据分析项目",
      keyMasked: "sk-liagentplantform-****8c7d",
      quotaLimit: 500_000,
      quotaUsed: 498_120,
      expiresAt: daysAgo(-30),
      status: "enabled",
    },
    {
      name: "测试专用（已过期）",
      keyMasked: "sk-liagentplantform-****f00d",
      quotaLimit: 100_000,
      quotaUsed: 12_600,
      expiresAt: daysAgo(3),
      status: "disabled",
    },
  ];
  for (const row of rows) {
    store.keys.push({
      ...row,
      id: nextId(store, "key"),
      createdAt: daysAgo(10),
      lastUsedAt: minutesAgo(8),
    });
  }
}

const SAMPLE_PROMPTS = [
  "帮我总结这篇关于 RAG 检索优化的文章要点",
  "用 Python 写一个批量重命名文件的脚本",
  "解释一下 Transformer 中注意力机制的计算过程",
  "把这段中文产品介绍翻译成英文",
  "分析这份季度销售数据并给出三条建议",
  "为我的 Agent 写一段更友好的开场白",
];

function seedLogs(store: MockStore): void {
  const models = [
    ...MODELS_BY_TYPE.DeepSeek,
    ...MODELS_BY_TYPE.OpenAI,
    ...MODELS_BY_TYPE.Claude,
  ];
  const enabledChannels = store.channels.filter((c) => c.status === "enabled");
  for (let i = 0; i < 120; i++) {
    const channel = enabledChannels[i % enabledChannels.length];
    const model = models[i % models.length];
    const promptTokens = 200 + ((i * 137) % 1800);
    const completionTokens = 100 + ((i * 89) % 1500);
    const failed = i % 17 === 5;
    store.logs.push({
      id: nextId(store, "log"),
      createdAt: minutesAgo(i * 37 + 5),
      channelId: channel.id,
      channelName: channel.name,
      keyId: store.keys[i % store.keys.length].id,
      keyName: store.keys[i % store.keys.length].name,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      latencyMs: 300 + ((i * 211) % 2500),
      status: failed ? "error" : "success",
      errorMessage: failed ? "401 Unauthorized: invalid api key" : null,
      promptSummary: SAMPLE_PROMPTS[i % SAMPLE_PROMPTS.length],
    });
  }
}

const SAMPLE_DOC_TEXTS: string[][] = [
  [
    "检索增强生成（RAG）通过先检索后生成的两段式架构，将外部知识注入大模型的上下文中。",
    "向量检索将文本编码为高维向量，通过余弦相似度或内积召回语义相近的文档分段。",
    "混合检索结合关键词检索与向量检索，可以同时兼顾精确匹配与语义泛化能力。",
    "重排序（Rerank）模型对初步召回的候选分段精排，可显著提升最终命中质量。",
  ],
  [
    "本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。",
    "乙方应在合同签订后 30 个工作日内完成首期交付，交付物包括源代码与部署文档。",
    "任何一方违约，应向守约方支付合同总额 10% 的违约金。",
  ],
];

function seedKnowledgeBases(store: MockStore): void {
  const kbDefs = [
    { name: "AI 技术文档库", description: "RAG、Agent、Prompt 工程相关技术资料" },
    { name: "产品合同库", description: "公司常用合同与法务模板" },
  ];
  for (const def of kbDefs) {
    const kb: KnowledgeBase = {
      id: nextId(store, "kb"),
      name: def.name,
      description: def.description,
      docCount: 0,
      chunkCount: 0,
      totalChars: 0,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    };
    store.knowledgeBases.push(kb);
  }

  // 第一个库放两篇文档，第二个库放一篇
  const docDefs: Array<{ kbIndex: number; fileName: string; paras: string[] }> = [
    { kbIndex: 0, fileName: "RAG 检索优化指南.md", paras: SAMPLE_DOC_TEXTS[0] },
    { kbIndex: 0, fileName: "向量数据库选型.txt", paras: SAMPLE_DOC_TEXTS[0].slice(0, 2) },
    { kbIndex: 1, fileName: "服务合同模板.txt", paras: SAMPLE_DOC_TEXTS[1] },
  ];
  for (const def of docDefs) {
    const kb = store.knowledgeBases[def.kbIndex];
    const doc: KbDocument = {
      id: nextId(store, "doc"),
      kbId: kb.id,
      fileName: def.fileName,
      fileSize: def.paras.join("").length * 3,
      fileType: def.fileName.endsWith(".md") ? "md" : "txt",
      status: "completed",
      chunkCount: def.paras.length,
      chars: def.paras.join("").length,
      enabled: true,
      createdAt: daysAgo(4),
      error: null,
    };
    store.documents.push(doc);
    kb.docCount += 1;
    kb.chunkCount += doc.chunkCount;
    kb.totalChars += doc.chars;
    def.paras.forEach((content, index) => {
      store.chunks.push({
        id: nextId(store, "chk"),
        documentId: doc.id,
        documentName: doc.fileName,
        index,
        content,
        chars: content.length,
        enabled: true,
      });
    });
  }
}

function seedAgents(store: MockStore): void {
  const rows: Array<Omit<Agent, "id" | "updatedAt">> = [
    {
      icon: "📚",
      name: "文档问答助手",
      description: "基于 AI 技术文档库回答用户关于 RAG 与 Agent 的问题",
      model: "deepseek-chat",
      systemPrompt:
        "你是一个严谨的技术文档助手，仅根据提供的知识库内容回答问题。若知识库中没有相关内容，请明确告知。",
      temperature: 0.3,
      topP: 0.9,
      knowledgeBaseIds: [store.knowledgeBases[0].id],
      openingMessage: "你好！我可以回答 RAG 与 Agent 相关的技术问题，请直接提问。",
      openingQuestions: ["什么是混合检索？", "Rerank 的作用是什么？"],
      status: "enabled",
    },
    {
      icon: "💼",
      name: "合同审查助理",
      description: "帮您快速定位合同条款、检查关键约定",
      model: "claude-sonnet-4-5",
      systemPrompt:
        "你是一名合同审查助理，负责根据合同知识库回答条款问题，回答需引用具体条款内容。",
      temperature: 0.2,
      topP: 0.8,
      knowledgeBaseIds: [store.knowledgeBases[1].id],
      openingMessage: "您好，请把想了解的合同问题告诉我，例如违约金条款。",
      openingQuestions: ["违约金比例是多少？", "交付期限是多久？"],
      status: "enabled",
    },
  ];
  for (const row of rows) {
    store.agents.push({
      ...row,
      id: nextId(store, "agt"),
      updatedAt: daysAgo(1),
    });
  }
}
