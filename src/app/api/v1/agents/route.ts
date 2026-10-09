import { NextResponse, type NextRequest } from "next/server";
import { getStore, nextId } from "@/lib/mock/store";
import type { Agent, AgentInput } from "@/types";

export async function GET() {
  const store = getStore();
  const sorted = [...store.agents].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as AgentInput;
  if (!input.name?.trim()) {
    return NextResponse.json({ message: "Agent 名称不能为空" }, { status: 400 });
  }
  const store = getStore();
  const agent: Agent = {
    ...input,
    name: input.name.trim(),
    id: nextId(store, "agt"),
    updatedAt: new Date().toISOString(),
  };
  store.agents.push(agent);
  return NextResponse.json(agent, { status: 201 });
}
