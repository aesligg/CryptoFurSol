import {
    engagementConfig,
    weightsConfig,
    recentMentionValidity,
  } from "#src/agent/communication/interactions/config.js";
  
  export function wait(minTime = 1, maxTime = 2) {
    const minTimeMs = minTime * 1000;
    const maxTimeMs = maxTime * 1000;
    const waitTime = Math.floor(Math.random() * (maxTimeMs - minTimeMs + 1)) + minTimeMs;
    return new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  
  export function scoreMentions(mentions) {
    mentions.forEach((mention) => (mention.popularityScore = popularityScore(mention)));
  
    return mentions.sort((a, b) => b.popularityScore - a.popularityScore);
  }
  
  export function isRecent(mention) {
    return Date.now() - mention.timestamp * 1000 < (recentMentionValidity + 5) * 60 * 1000;
  }
  
  export function isProcessed(mention, lastCheckedTweetId) {
    if (!lastCheckedTweetId) {
      return false;
    }
  
    return BigInt(mention.id) <= BigInt(lastCheckedTweetId);
  }
  
  export function isValidFormat(mention) {
    const contextMatch = mention.text.match(/Context:\s*(.+)/i);
  
    return !!contextMatch;
  }
  
  export function isValidEngagement(mention) {
    const likes = mention.likes || 0;
    const retweets = mention.retweets || 0;
    const replies = mention.replies || 0;
    const views = mention.views || 0;
  
    return (
      likes >= engagementConfig.min_likes &&
      retweets >= engagementConfig.min_retweets &&
      replies >= engagementConfig.min_replies &&
      views >= engagementConfig.min_views
    );
  }
  
  export function shuffleArray(array) {
    let currentIndex = array.length;
  
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  }
  
  function popularityScore(mention) {
    const likes = mention.likes || 0;
    const retweets = mention.retweets || 0;
    const replies = mention.replies || 0;
    const views = mention.views || 0;
  
    return (
      likes * weightsConfig.likes_weight +
      retweets * weightsConfig.retweets_weight +
      replies * weightsConfig.replies_weight +
      views * weightsConfig.views_weight
    );
  }
  