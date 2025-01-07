import { getMentions } from '../services/twitterService.js';
import { validateMentions, scoreMentions, sortMentions } from '../utils/mentionUtils.js';
import { getContext } from '../utils/responseUtils.js';

export const handleMentions = async () => {
  try {
    let mentions = await getMentions();
    mentions = await validateMentions(mentions);
    mentions = await scoreMentions(mentions);
    mentions = await sortMentions(mentions);

    if (mentions[0]) {
      const context = await getContext(mentions[0].text);
      console.log("Mention found.");
    } else {
      console.log("Mention not found.");
    }
  } catch (error) {
    console.error("Error handling mentions:", error);
  }
};
