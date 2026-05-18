export async function generateAIContent(prompt: string): Promise<string> {
  return `Here's your generated content based on: "${prompt}"\n\nConnect an AI provider (OpenAI, Claude) to enable real-time generation.`;
}

export async function generateAiReply(_opts: Record<string, unknown>): Promise<{ reply: string }> {
  return { reply: "I'm here to help! How can I assist you today?" };
}
