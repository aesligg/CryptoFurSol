import { LIKE_WEIGHT, RETWEET_WEIGHT, REPLY_WEIGHT, IMPRESSION_WEIGHT } from '../config/env.js'

export const calculatePopularityScore = (metrics) => {
  const {
    like_count = 0,
    retweet_count = 0,
    reply_count = 0,
    impression_count = 0,
  } = metrics;

  return (
    like_count * LIKE_WEIGHT +
    retweet_count * RETWEET_WEIGHT +
    reply_count * REPLY_WEIGHT +
    impression_count * IMPRESSION_WEIGHT
  );
};
