import { elizaLogger } from "@elizaos/core";
import { Scraper, SearchMode } from "agent-twitter-client";

import { twitterConfig } from "#src/agent/communication/services/twitter/config.js";

export class TwitterClient {
  constructor(runtime) {
    this.runtime = runtime;
    this.twitterConfig = twitterConfig;
    this.twitterUserName = this.twitterConfig.username;
    this.scrapper = new Scraper();
  }

  async init() {
    const { username, password, email, retries } = this.twitterConfig;

    if (!username) throw new Error("Twitter username not configured");

    const cachedCookies = await this.runtime.cacheManager.get(`twitter/${username}/cookies`);

    if (cachedCookies) {
      elizaLogger.info("Using cached cookies");
      await this.setCookiesFromArray(cachedCookies);
    }

    elizaLogger.log("Waiting for Twitter login");
    let loginRetries = retries;
    while (loginRetries > 0) {
      try {
        if (await this.scrapper.isLoggedIn()) {
          elizaLogger.info("Successfully logged in.");
          break;
        } else {
          await this.scrapper.login(username, password, email);
          if (await this.scrapper.isLoggedIn()) {
            elizaLogger.info("Successfully logged in. Caching cookies.");
            await this.runtime.cacheManager.set(`twitter/${username}/cookies`, await this.scrapper.getCookies());
            break;
          }
        }
      } catch (error) {
        elizaLogger.error(`Login attempt failed: ${error}`);
      }

      loginRetries--;
      elizaLogger.error(`Failed to login to Twitter. Retrying... (${loginRetries} attempts left)`);

      if (loginRetries === 0) {
        elizaLogger.error("Max retries reached. Exiting login process.");
        throw new Error("Twitter login failed after maximum retries.");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    this.profile = await this.fetchProfile(username);

    if (this.profile) {
      elizaLogger.log("Twitter loaded:", JSON.stringify(this.profile, null, 10));
      this.runtime.character.twitterProfile = {
        id: this.profile.id,
        username: this.profile.username,
        screenName: this.profile.screenName,
        bio: this.profile.bio,
        nicknames: this.profile.nicknames,
      };
    } else {
      throw new Error("Failed to load profile");
    }

    await this.loadLatestCheckedTweetId();
  }

  async fetchSearchTweets(query, maxTweets = 50, searchMode = SearchMode.Latest, cursor = undefined) {
    try {
      const result = await this.scrapper.fetchSearchTweets(query, maxTweets, searchMode, cursor);
      return result ?? { tweets: [] };
    } catch (error) {
      elizaLogger.error(`Error fetching search tweets: ${error}`);
      return { tweets: [] };
    }
  }

  async sendTweet(text) {
    const result = await this.scrapper.sendTweet(text);
    const body = await result.json();
    const tweetResult = body?.data?.create_tweet?.tweet_results?.result;

    if (tweetResult) {
      const finalTweet = {
        id: tweetResult.rest_id,
        text: tweetResult.legacy.full_text,
        conversationId: tweetResult.legacy.conversation_id_str,
        timestamp: new Date(tweetResult.legacy.created_at).getTime() / 1000,
        userId: tweetResult.legacy.user_id_str,
        inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
        permanentUrl: `https://twitter.com/${this.twitterUserName}/status/${tweetResult.rest_id}`,
        hashtags: [],
        mentions: [],
        photos: [],
        thread: [],
        urls: [],
        videos: [],
      };

      return finalTweet;
    } else {
      elizaLogger.error(`Error sending tweet. Response: ${JSON.stringify(body)}`);
    }
    return undefined;
  }

  async retweet(tweetId) {
    await this.scrapper.retweet(tweetId);
  }

  async like(tweetId) {
    await this.scrapper.likeTweet(tweetId);
  }

  async sendReply(text, replyToTweetId) {
    const result = await this.scrapper.sendTweet(text, replyToTweetId);
    const body = await result.json();
    const tweetResult = body?.data?.create_tweet?.tweet_results?.result;

    if (tweetResult) {
      const finalTweet = {
        id: tweetResult.rest_id,
        text: tweetResult.legacy.full_text,
        conversationId: tweetResult.legacy.conversation_id_str,
        timestamp: new Date(tweetResult.legacy.created_at).getTime() / 1000,
        userId: tweetResult.legacy.user_id_str,
        inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
        permanentUrl: `https://twitter.com/${this.twitterUserName}/status/${tweetResult.rest_id}`,
        hashtags: [],
        mentions: [],
        photos: [],
        thread: [],
        urls: [],
        videos: [],
      };

      return finalTweet;
    } else {
      elizaLogger.error(`Error sending tweet. Response: ${JSON.stringify(body)}`);
    }
    return undefined;
  }

  async setCookiesFromArray(cookiesArray) {
    const cookieStrings = cookiesArray.map(
      (cookie) =>
        `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${
          cookie.secure ? "Secure" : ""
        }; ${cookie.httpOnly ? "HttpOnly" : ""}; SameSite=${cookie.sameSite || "Lax"}`
    );
    await this.scrapper.setCookies(cookieStrings);
  }

  async fetchProfile(username) {
    const cached = await this.runtime.cacheManager.get(`twitter/${username}/profile`);

    if (cached) return cached;

    try {
      const fetchedProfile = await this.scrapper.getProfile(username);
      const profile = {
        id: fetchedProfile.userId,
        username: fetchedProfile.username,
        screenName: fetchedProfile.name || this.runtime.character.name,
        bio: fetchedProfile.biography,
      };

      await this.runtime.cacheManager.set(`twitter/${profile.username}/profile`, profile);

      return profile;
    } catch (error) {
      console.error("Error fetching Twitter profile:", error);
      return undefined;
    }
  }

  async loadLatestCheckedTweetId() {
    const latestCheckedTweetId = await this.runtime.cacheManager.get(
      `twitter/${this.twitterUserName}/latest_checked_tweet_id`
    );

    if (latestCheckedTweetId) {
      this.lastCheckedTweetId = latestCheckedTweetId;
    }
  }

  async setLatestCheckedTweetId(latestCheckedTweetId) {
    if (latestCheckedTweetId) {
      this.lastCheckedTweetId = latestCheckedTweetId;

      await this.runtime.cacheManager.set(
        `twitter/${this.twitterUserName}/latest_checked_tweet_id`,
        this.lastCheckedTweetId
      );
    }
  }
}
