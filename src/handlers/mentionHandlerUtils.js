import { isValidFormat, isValidEngagement } from "../utils/validationUtils";

export const validateMentions = async (mentions) => {
  return mentions.filter((mention) => isValidFormat(mention.text) && isValidEngagement(mention.public_metrics));
};
