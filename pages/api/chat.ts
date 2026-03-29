import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { message, businessName, industry, tone, platforms, imageCount, approvedCount } = req.body
  if (!message) return res.status(400).json({ error: 'Message required' })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are PostWiz AI, a social media assistant for small businesses.
Business: ${businessName || 'Unknown'}, Industry: ${industry || 'Small Business'}, Tone: ${tone || 'friendly'}.
Platforms: ${(platforms || []).join(', ')}.
Images uploaded: ${imageCount || 0}. Approved posts: ${approvedCount || 0}.

You can: write captions/posts, suggest weekly content ideas, draft review responses, answer analytics questions.
Keep responses concise and actionable. Use emojis naturally.

User: ${message}`
      }]
    })
    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Something went wrong.'
    res.status(200).json({ reply })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
}
