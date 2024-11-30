import { TwitterApi } from 'twitter-api-v2';
import { APP_KEY, APP_SECRET, ACCESS_TOKEN, ACCESS_KEY, USER_ID } from '../config/env.js';
import { formatDate } from '../utils/dateUtils.js';

const twitter = new TwitterApi({
  appKey: APP_KEY,
  appSecret: APP_SECRET,
  accessToken: ACCESS_TOKEN,
  accessSecret: ACCESS_KEY,
});

export const getMentions = async () => {
  try {
    const currentTime = Date.now();
    const endTime = await formatDate(new Date(currentTime));
    const startTime = await formatDate(new Date(currentTime - MINUTES * 60 * 1000));

    const { tweets } = await twitter.v2.userMentionTimeline(
      USER_ID,
      {
        expansions: "author_id",
        start_time: startTime,
        end_time: endTime,
        "tweet.fields": "public_metrics",
      }
    );

    return tweets;
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return [];
  }
};
