import { elizaLogger } from "@elizaos/core";
import { InteractionClient } from "#src/agent/communication/interactions/client.js";
import { TwitterClient } from "#src/agent/communication/services/twitter/client.js";

class CommunicationManager {
  constructor(runtime) {
    this.client = new TwitterClient(runtime);
    this.interaction = new InteractionClient(this.client, runtime);
  }
}

export const CommunicationClient = {
  async start(runtime) {
    elizaLogger.log("Communication client started");
    const manager = new CommunicationManager(runtime);

    await manager.client.init();
    await manager.interaction.start();

    return manager;
  },
};

export default CommunicationClient;
