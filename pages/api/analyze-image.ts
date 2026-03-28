import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64, mediaType, businessName, industry, tone, description, platforms, topic } = req.body
  if (!imageBase64 || !businessName) return res.status(400).json({ error: 'Image and business name required' })

  const targetPlatforms = platforms || ['Instagram', 'TikTok', 'Facebook', 'X (Twitter)']

  const platformFormats: Record<string, string> = {
    'Instagram': '150-200 chars + 5-8 relevant hashtags, emoji-friendly, engaging hook',
    'TikTok': 'punchy 100-150 char hook + 3-5 trending hashtags, casual and energetic, FOMO-driven',
    'Facebook': '2-3 conversational sentences, community feel, clear CTA, no excessive hashtags',
    'X (Twitter)': 'under 240 chars, witty and punchy, max 2 hashtags, conversational',
    'LinkedIn': '2-3 professional sentences, thought leadership angle, minimal hashtags',
    'Pinterest': '100-150 chars, keyword-rich, discovery-focused, describe what\'s in the image',
  }

  try {
    const platformList = targetPlatforms.map((p: string) => `- ${p}: ${platformFormats[p] || '150-200 chars, engaging'}`).join('\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }
          },
          {
            type: 'text',
            text: `You are an expert social media manager. Analyze this image and write platform-optimized captions for a small business.

Business: ${businessName}
Industry: ${industry || 'Small Business'}
Brand Tone: ${tone || 'friendly and professional'}
${description ? `About: ${description}` : ''}
${topic ? `Campaign/Topic: ${topic}` : ''}

First, briefly describe what you see in the image in 1 sentence (field: "imageDescription").

Then write captions for these platforms:
${platformList}

Also suggest:
- 3 best times to post this content (field: "bestTimes", array of strings like "Tuesday 7-9 PM")
- Content type classification (field: "contentType": "promotional" | "lifestyle" | "educational" | "engagement" | "product")
- Engagement score prediction 1-10 (field: "engagementScore")

Return ONLY valid JSON, no markdown, no explanation:
{
  "imageDescription": "...",
  "contentType": "...",
  "engagementScore": 8,
  "bestTimes": ["...", "...", "..."],
  "captions": {
    "Instagram": "...",
    "TikTok": "...",
    "Facebook": "...",
    "X (Twitter)": "...",
    "LinkedIn": "...",
    "Pinterest": "..."
  }
}`
          }
        ]
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)
    res.status(200).json(data)
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: msg })
  }
}
