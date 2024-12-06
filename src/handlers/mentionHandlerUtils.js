import { isValidFormat, isValidEngagement } from "../utils/validationUtils";
import { calculatePopularityScore } from "../utils/scoringUtils";

export const validateMentions = async (mentions) => {
  return mentions.filter((mention) => isValidFormat(mention.text) && isValidEngagement(mention.public_metrics));
};

export const scoreMentions = async (mentions) => {
  return mentions.map((mention) => ({
    ...mention,
    score: calculatePopularityScore(mention.public_metrics),
  }));
};

export const sortMentions = async (mentions) => mentions.sort((a, b) => b.score - a.score);