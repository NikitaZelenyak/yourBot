import { createOpenAI } from '@ai-sdk/openai'

const provider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_API_KEY);

export const openai = provider('gpt-4o')
export const openaiMini = provider('gpt-4o-mini')
