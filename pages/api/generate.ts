import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from 'anthropic'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { businessName, industry, tone, description, platform, topic } = req.body

  if (!businessName || !industry) {
    return res.status(400).json({ error: 'Business name and industry are required' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a social media expert for small businesses. Generate a ${platform} post for the following business:

Business Name: ${businessName}
Industry: ${industry}
Tone: ${tone || 'friendly and professional'}
About: ${description || 'A local small business'}
Topic/Promotion: ${topic || 'general brand awareness'}

Write an engaging ${platform} post that:
- Sounds authentic and human, not robotic
- Is the right length for ${platform} (Instagram: 150-200 chars + hashtags, Facebook: 2-3 sentences, Twitter: under 280 chars)
- Includes 5-8 relevant hashtags for Instagram
- Has a clear call to action
- Fits the tone perfectly

Return ONLY the post text, ready to copy-paste. No explanations.`,
        },
      ],
    })

    const postText = message.content[0].type === 'text' ? message.content[0].text : ''
    res.status(200).json({ post: postText })
  } catch (err: unknown) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
}
