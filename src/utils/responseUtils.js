import { generateDetails } from "../services/llmService.js";

export const getContext = async (text) => {
  const contextMatch = text.match(/Context:\s*(.+)/i);
  
  return contextMatch ? contextMatch[1] : "A mysterious pet";
};

export const generatePetDetails = async (context) => {
  try {
    // TODO: add details generation generateDetails(...)
  } catch (error) {
    console.error("Error generating pet details:", error);
    return {};
  }
};