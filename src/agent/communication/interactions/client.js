import {
    elizaLogger,
    stringToUuid,
    getEmbeddingZeroVector,
    composeContext,
    generateMessageResponse,
    ModelClass,
  } from "@elizaos/core";
  import {
    isRecent,
    isProcessed,
    isValidFormat,
    isValidEngagement,
    scoreMentions,
    wait,
    shuffleArray,
  } from "#src/agent/communication/interactions/utils.js";
  import cronParser from "cron-parser";
  import {
    messageHandlerTemplate,
    announcementTemplate,
    interactionPeriod,
    announcementBefore,
  } from "#src/agent/communication/interactions/config.js";
  
  export class InteractionClient {
    constructor(client, runtime) {
      this.client = client;
      this.runtime = runtime;
    }
  
    schedule() {
      const scheduleNextExecution = () => {
        const interval = cronParser.parseExpression(interactionPeriod);
        const nextExecution = interval.next().toDate();
        let nextAnnouncementExecution = new Date(nextExecution.getTime() - announcementBefore * 60 * 1000);
        const now = new Date();
  
        if (nextAnnouncementExecution - now < 0) {
          nextAnnouncementExecution = now;
        }
  
        elizaLogger.log(`Next announcement generation scheduled at: ${nextAnnouncementExecution}`);
        setTimeout(() => {
          elizaLogger.success(`Executing announcement generation at: ${new Date()}`);
          this.generateAnnouncement();
        }, nextAnnouncementExecution - now);
  
        elizaLogger.log(`Next interaction scheduled at: ${nextExecution}`);
        setTimeout(() => {
          elizaLogger.success(`Executing interaction at: ${new Date()}`);
          this.handleInteractions();
          scheduleNextExecution();
        }, nextExecution - now);
      };
  
      scheduleNextExecution();
    }
  
    async start() {
      this.schedule();
    }
  
    async generateAnnouncement() {
      try {
        const roomId = stringToUuid("announcements-room-" + this.runtime.agentId);
  
        await this.runtime.ensureConnection(
          this.runtime.agentId,
          roomId,
          this.client.twitterUserName,
          this.runtime.character.name,
          "twitter"
        );
        const topics = this.runtime.character.topics.join(", ");
  
        const petsRoomId = stringToUuid("pets-generation-room-" + this.runtime.agentId);
        const previouslyGeneratedPetsMessages = await this.runtime.messageManager.getMemories({
          roomId: petsRoomId,
          count: 20,
          unique: false,
        });
  
        let previouslyGeneratedPets = previouslyGeneratedPetsMessages.map(
          (message) => message.content.details.ticker + " - " + message.content.details.name
        );
        shuffleArray(previouslyGeneratedPets);
        previouslyGeneratedPets = previouslyGeneratedPets.slice(-2).join("\n");
        const lastGeneratedPetCached = await this.runtime.cacheManager.get("last_generated_pet");
        const lastGeneratedPet = lastGeneratedPetCached
          ? lastGeneratedPetCached.ticker + " - " + lastGeneratedPetCached.name
          : "was not generated";
  
        let state = await this.runtime.composeState(
          {
            userId: this.runtime.agentId,
            roomId: roomId,
            agentId: this.runtime.agentId,
            content: { text: topics },
          },
          {
            clientScrapper: this.client.scrapper,
            twitterUserName: this.client.twitterUserName,
            previouslyGeneratedPets: previouslyGeneratedPets,
            lastGeneratedPet: lastGeneratedPet,
          }
        );
  
        const context = composeContext({ state, template: announcementTemplate });
        const response = await generateMessageResponse({
          runtime: this.runtime,
          context,
          modelClass: ModelClass.SMALL,
        });
        const tweet = await this.client.sendTweet(response.content.text);
        await wait();
        await this.client.like(tweet.id);
        await wait();
        const tweetId = stringToUuid(tweet.id);
        const messageToCreate = {
          id: tweetId,
          agentId: this.runtime.agentId,
          userId: this.runtime.agentId,
          content: {
            text: tweet.text,
            url: tweet.permanentUrl,
            details: response.content,
            source: "twitter",
          },
          roomId: roomId,
          embedding: getEmbeddingZeroVector(),
          createdAt: tweet.timestamp * 1000,
        };
  
        state = await this.runtime.updateRecentMessageState(state);
  
        await this.runtime.messageManager.createMemory(messageToCreate);
  
        await wait();
      } catch (error) {
        elizaLogger.error(`Error generating announcement: ${error}`);
      }
    }
  
    async handleInteractions() {
      try {
        // TODO: Do not count already participated users for N times
        const mention = await this.mostEngagedMention();
        if (mention) {
          await this.handleMention(mention);
        } else {
          await this.runtime.cacheManager.delete("last_generated_pet");
          elizaLogger.log(`Most engaged mention not found`);
        }
      } catch (error) {
        elizaLogger.error(`Error handling interactions: ${error}`);
      }
    }
  
    async mostEngagedMention() {
      const twitterUsername = this.client.twitterUserName;
      const mentionCandidates = (await this.client.fetchSearchTweets(`@${twitterUsername}`)).tweets;
  
      let mentions = mentionCandidates.filter((mention) => {
        const processed = isProcessed(mention, this.client.lastCheckedTweetId);
        const recent = isRecent(mention);
        const validFormat = isValidFormat(mention);
        const validEngagement = isValidEngagement(mention);
  
        elizaLogger.log(`Tweet ${mention.id} checks:`, {
          processed,
          recent,
          reply: mention.isReply,
          retweet: mention.isRetweet,
          validFormat,
          validEngagement,
        });
  
        return !processed && !mention.isReply && !mention.isRetweet && recent && validFormat && validEngagement;
      });
      await this.client.setLatestCheckedTweetId(mentionCandidates[0].id);
  
      mentions = scoreMentions(mentions);
  
      return mentions[0];
    }
  
    async handleMention(mention) {
      const mentionId = stringToUuid(mention.id);
      const roomId = stringToUuid(mention.conversationId + "-" + this.runtime.agentId);
      const userId = stringToUuid(mention.userId);
  
      await this.runtime.ensureConnection(userId, roomId, mention.username, mention.name, "twitter");
  
      const message = {
        content: { text: mention.text },
        agentId: this.runtime.agentId,
        userId: userId,
        roomId,
      };
  
      const currentPost = `  ID: ${mention.id}
  From: ${mention.name} (@${mention.username})
  Text: ${mention.text}`;
  
      let state = await this.runtime.composeState(message, {
        clientScrapper: this.client.scrapper,
        twitterUserName: this.client.twitterUserName,
        currentPost,
      });
  
      const existingMention = await this.runtime.messageManager.getMemoryById(mentionId);
  
      if (!existingMention) {
        elizaLogger.log("Mention does not exist, saving it");
        const messageToCreate = {
          id: mentionId,
          agentId: this.runtime.agentId,
          content: { text: mention.text, url: mention.permanentUrl, source: "twitter" },
          userId: userId,
          roomId,
          createdAt: mention.timestamp * 1000,
          embedding: getEmbeddingZeroVector(),
        };
  
        await this.runtime.messageManager.createMemory(messageToCreate);
        await this.runtime.evaluate(message, { ...state, clientScrapper: this.client.scrapper });
      }
  
      const context = composeContext({
        state,
        template: messageHandlerTemplate,
      });
      const response = await generateMessageResponse({
        runtime: this.runtime,
        context,
        modelClass: ModelClass.LARGE,
      });
      const replyText = `
  Meet ${response.content.ticker} - ${response.content.name}!
  ${response.content.personality}
  
  Fun Fact: ${response.content.fun_fact}
  `;
  
      await this.client.like(mention.id);
      await wait();
      const reply = await this.client.sendReply(replyText, mention.id);
      await wait();
      await this.client.retweet(reply.id);
      await wait();
      await this.client.like(reply.id);
      await wait();
      const replyId = stringToUuid(reply.id);
      const petsRoomId = stringToUuid("pets-generation-room-" + this.runtime.agentId);
      const replyToCreate = {
        id: replyId,
        agentId: this.runtime.agentId,
        userId: this.runtime.agentId,
        content: {
          text: reply.text,
          url: reply.permanentUrl,
          inReplyTo: mentionId,
          details: response.content,
          source: "twitter",
        },
        roomId: petsRoomId,
        embedding: getEmbeddingZeroVector(),
        createdAt: reply.timestamp * 1000,
      };
  
      await this.runtime.cacheManager.set("last_generated_pet", response.content);
  
      state = await this.runtime.updateRecentMessageState(state);
  
      await this.runtime.messageManager.createMemory(replyToCreate);
  
      await wait();
    }
  }
  