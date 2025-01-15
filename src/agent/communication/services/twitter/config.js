export const twitterConfig = {
    username: process.env.TWITTER_USERNAME,
    password: process.env.TWITTER_PASSWORD,
    email: process.env.TWITTER_EMAIL,
    retries: process.env.TWITTER_RETRY_LIMIT || 1,
  };
  