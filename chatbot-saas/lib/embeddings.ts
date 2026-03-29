import OpenAI from 'openai'

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function embedText(text: string): Promise<number[]> {
  const response = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return response.data[0].embedding
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 20
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })
    results.push(...response.data.map((d) => d.embedding))
  }

  return results
}
