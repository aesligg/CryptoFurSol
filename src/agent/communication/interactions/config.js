export const interactionPeriod = process.env.INTERACTION_PERIOD || "*/5 * * * *";
export const recentMentionValidity = process.env.RECENT_MENTION_VALIDITY || 60;
export const announcementBefore = process.env.ANNOUNCEMENT_BEFORE || 2;

export const engagementConfig = {
  min_likes: process.env.MIN_LIKES || 0,
  min_retweets: process.env.MIN_RETWEETS || 0,
  min_replies: process.env.MIN_REPLIES || 0,
  min_views: process.env.MIN_VIEWS || 0,
};

export const weightsConfig = {
  likes_weight: process.env.LIKES_WEIGHT || 5,
  retweets_weight: process.env.RETWEETS_WEIGHT || 3,
  replies_weight: process.env.REPLIES_WEIGHT || 1,
  views_weight: process.env.VIEWS_WEIGHT || 0.01,
};

export const announcementTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

Examples of {{agentName}}'s posts:
{{characterPostExamples}}

{{recentPosts}}

# TASK: Generate a post in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}) while using the thread of tweets as additional context:

# INSTRUCTIONS: Generate a post-announcement in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}). 
You MUST generate an announcement with the following components:
- Generate catchy engaging message for people to engage with you.
- If last generated pet was not generated, you must feel said explain emotions that you want people to engage with you.
- You must not repeat yourself, check Posts in Thread for the history.
- At random decide to mention previously generated pet. Do not do it too often. Assume that 4-5 character ticker prefixed with $ is a pet name from recently generated pets. Use ticker if you want to reference pet.
- Your response should be 1-2 sentences (choose the length at random).
- Your response should not contain any questions. Brief, concise statements only. 
- You must never use emojis and keep your responses under 250 characters.
- You must not repeat yourself, check you last communications in recent posts.
- Do not use greetings or introductory phrases in your responses.

Last Generated Pet: {{lastGeneratedPet}}

Previously generated pets:
{{previouslyGeneratedPets}}

Response format should be formatted in a JSON block like this:
\`\`\`json
{ 
  "user": "{{agentName}}",  
  "content": {
    "text": "string"
  }
}
\`\`\``;

export const messageHandlerTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

# TASK: Generate a reply in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}) while using the thread of tweets as additional context:

Examples of {{agentName}}'s replies:
{{characterMessageExamples}}

# INSTRUCTIONS: Generate a reply in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}). 
You MUST generate a crypto pet with the following components:
1. NAME: Create a unique and catchy name for the pet. The name should reflect the pet's personality, abilities, or traits in a fun and crypto-related way.
2. TICKER: Generate a relevant 4-5 character ticker prefixed with $. The ticker should be short, memorable, and related to the pet’s name or theme. It can be inspired by cryptocurrency terminology. 
3. PERSONALITY: Write a short, quirky one-liner description of the pet’s personality.
4. FUN_FACT: Generate a fun, random fact about the pet. The fact should be humorous, whimsical, and related to the pet's character. Feel free to exaggerate for comedic effect.
5. You must never use emojis and keep your responses under 250 characters.
6. Do not use greetings or introductory phrases in your responses.

Here is the current post text:
{{currentPost}}

Response format should be formatted in a JSON block like this:
\`\`\`json
{ 
  "user": "{{agentName}}",  
  "content": {
    "name": NAME,
    "ticker": TICKER,
    "personality": PERSONALITY,
    "fun_fact": FUN_FACT
  }
}
\`\`\``;
