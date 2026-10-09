import type { EnabledStatus } from "./channel";
import type { SearchHit } from "./rag";

export interface Agent {
  id: string;
  icon: string;
  name: string;
  description: string;
  /** 模型标识，如 deepseek-chat */
  model: string;
  /** 人设与回复逻辑 Prompt */
  systemPrompt: string;
  temperature: number;
  topP: number;
  /** 挂载的知识库 id 列表 */
  knowledgeBaseIds: string[];
  openingMessage: string;
  /** 推荐的后续问题 */
  openingQuestions: string[];
  status: EnabledStatus;
  updatedAt: string;
}

export interface AgentInput {
  icon: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  knowledgeBaseIds: string[];
  openingMessage: string;
  openingQuestions: string[];
  status: EnabledStatus;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  /** assistant 消息附带的知识库命中 */
  citations?: SearchHit[];
}
