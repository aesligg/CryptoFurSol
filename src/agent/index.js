import { AgentRuntime } from "@elizaos/core";

import { loadCharacter } from "#src/agent/character/utils.js";
import { initializeDatabaseAdapter } from "#src/agent/database/utils.js";
import { initializeCacheManager } from "#src/agent/cache/utils.js";
import { CommunicationClient } from "#src/agent/communication/client.js";

export async function startAgent() {
  const character = await loadCharacter();
  const databaseAdapter = await initializeDatabaseAdapter();
  const cacheManager = initializeCacheManager(databaseAdapter, character.id);
  const runtime = new AgentRuntime({
    character,
    modelProvider: character.modelProvider,
    databaseAdapter,
    cacheManager,
    evaluators: [],
    plugins: [],
    providers: [],
    actions: [],
    services: [],
    managers: [],
  });
  await runtime.initialize();

  const commmunicationClient = await CommunicationClient.start(runtime);
  runtime.clients = [commmunicationClient];
}
