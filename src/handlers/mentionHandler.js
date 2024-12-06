import { getMentions, validateMentions, scoreMentions, sortMentions } from '../services/twitterService.js';

export const handleMentions = async () => {
  try {
    let mentions = await getMentions();
    mentions = await validateMentions(mentions);
    mentions = await scoreMentions(mentions);
    mentions = await sortMentions(mentions);

    if (mentions[0]) {
      // TODO: generate pet details and reply
      console.log("Mention found.");
    } else {
      console.log("Mention not found.");
    }
  } catch (error) {
    console.error("Error handling mentions:", error);
  }
};
