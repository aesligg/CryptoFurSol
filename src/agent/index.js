import { AgentRuntime } from "@elizaos/core";

export async function startAgent() {
  const runtime = new AgentRuntime({
    evaluators: [],
    plugins: [],
    providers: [],
    actions: [],
    services: [],
    managers: [],
  });
  await runtime.initialize();
}
