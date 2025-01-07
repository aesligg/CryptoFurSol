import { LLM_API_KEY } from '../config/env.js';

export const createLLMClient = () => {
  return new LLMClient({ apiKey: LLM_API_KEY });
};

const llmClient = createLLMClient();

export const generateDetails = async (systemPrompt, userPrompt, context) => {
  const prompt = `
  ${userPrompt}
  ${context}
  `
  const chatCompletion = await llmClient.generateResponse({
    model: "llm-model-ai-pets-v3",
    messages: [
      { role: "system", content: [{ type: "text", text: systemPrompt }] },
      { role: "user", content: [{ type: "text", text: prompt }] }
    ],
    response_format: { type: "json_object" },
    temperature: 1,
    max_tokens: 100
  })
  const details = JSON.parse(chatCompletion.choices[0].message.content);

  return details;
};