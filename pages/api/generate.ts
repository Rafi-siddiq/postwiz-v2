import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const platformInstructions: Record<string, string> = {
  Instagram: 'Instagram caption (150-200 chars + 5-8 hashtags, engaging, emoji-friendly)',
  TikTok: 'TikTok caption (punchy hook under 150 chars + 3-5 trending hashtags, casual and energetic)',
  Facebook: 'Facebook post (2-3 conversational sentences, community feel, optional link CTA)',
  'X (Twitter)': 'Tweet (under 250 chars, witty and on-brand, 1-2 hashtags max)',
  LinkedIn: 'LinkedIn post (professional, 2-3 paragraphs, thought leadership tone, no hashtag spam)',
  Pinterest: 'Pinterest pin description (keyword-rich, 100-150 chars, discovery-focused)',
  Yelp: 'Yelp review response (warm, professional, personal, 2-3 sentences, thank the reviewer by name if given)',
  'Google Reviews': 'Google review response (professional, SEO-friendly, mention business name naturally, 2-3 sentences)',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { businessName, industry, tone, description, platform, topic, reviewText, reviewerName } = req.body
  if (!businessName || !industry) return res.status(400).json({ error: 'Business name and industry required' })

  const isReview = platform === 'Yelp' || platform === 'Google Reviews'
  const instructions = platformInstructions[platform] || 'social media post (engaging, on-brand, 150-200 chars)'

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: isReview
          ? `You are a reputation management expert. Write a ${instructions} for this business:

Business: ${businessName}
Industry: ${industry}
Tone: ${tone || 'friendly and professional'}
${description ? `About: ${description}` : ''}

${reviewText ? `Review to respond to: "${reviewText}"` : 'Write a general positive review response template.'}
${reviewerName ? `Reviewer name: ${reviewerName}` : ''}

Write ONLY the response text, ready to post. No explanations. Be genuine and personal.`
          : `You are a social media expert for small businesses. Write a ${instructions} for:

Business: ${businessName}
Industry: ${industry}
Tone: ${tone || 'friendly and professional'}
${description ? `About: ${description}` : ''}
${topic ? `Topic/Promotion: ${topic}` : 'General brand awareness post'}

Write ONLY the post text, ready to copy-paste. Sounds human and authentic. Include a clear call to action.`
      }]
    })

    const post = message.content[0].type === 'text' ? message.content[0].text : ''
    res.status(200).json({ post })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
}
