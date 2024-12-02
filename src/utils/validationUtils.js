export const isValidFormat = (text) => {
  const contextMatch = text.match(/Context:\s*(.+)/i);
  if (!contextMatch) return false;
  return contextMatch[1].length <= 250;
};

export const isValidEngagement = (metrics) => {
  const { like_count, retweet_count, reply_count } = metrics;
  return like_count >= MIN_LIKES && retweet_count >= MIN_RETWEETS && reply_count >= MIN_REPLIES;
};
