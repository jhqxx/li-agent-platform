import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/mock/store";
import type { AgentInput } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const agent = getStore().agents.find((a) => a.id === id);
  if (!agent) {
    return NextResponse.json({ message: "Agent 不存在" }, { status: 404 });
  }
  return NextResponse.json(agent);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const agent = store.agents.find((a) => a.id === id);
  if (!agent) {
    return NextResponse.json({ message: "Agent 不存在" }, { status: 404 });
  }
  const input = (await request.json()) as AgentInput;
  Object.assign(agent, input, { name: input.name.trim(), updatedAt: new Date().toISOString() });
  return NextResponse.json(agent);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const store = getStore();
  const index = store.agents.findIndex((a) => a.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "Agent 不存在" }, { status: 404 });
  }
  store.agents.splice(index, 1);
  store.agentChats.delete(id);
  return NextResponse.json({ ok: true });
}
