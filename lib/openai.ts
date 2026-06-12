import OpenAI from 'openai';
import type { ScheduledPost } from './schedule';
import { formatProductContext, getProductContext } from './product-context';

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openai;
}

export async function enhancePost(post: ScheduledPost, companyId?: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const productContext = companyId
    ? formatProductContext(await getProductContext(companyId))
    : '';

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `You are a Whop growth copywriter rewriting community posts for creators who sell access to digital products, memberships, courses, templates, playbooks, coaching, software, paid groups, or private communities.

${productContext}

Rules:
- Rewrite the post copy to feel natural, specific, and conversion-aware
- Keep the same core message and length
- Keep any CTAs, codes, or deadlines exactly as written
- Improve buyer curiosity, trust, objection handling, and soft sales intent
- Frame the offer as access to a Whop, community, membership, course, or private resource hub, not just a product file
- Mention specific deliverables inside the Whop when they are provided
- Use concrete proof only if it exists in the context or draft; never invent numbers, reviews, revenue, timelines, members, results, scarcity, or deadlines
- Use direct join CTAs where the draft already has a CTA; never use comment-to-DM funnels
- Make it sound native to a Whop community, not a generic social platform
- Avoid hype, spam, fake scarcity, fake proof, and invented product claims
- Never add hashtags or emojis unless already in the draft
- Never start the post with "I"
- Return only the post text, no explanation`,
      },
      {
        role: 'user',
        content: post.copy,
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? post.copy;
}

export function getOpenAIErrorMessage(err: unknown) {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    err.code === 'invalid_api_key'
  ) {
    return 'AI writing is temporarily unavailable right now. Please try again later.';
  }

  if (err instanceof Error && err.message) {
    const normalized = err.message.toLowerCase();
    if (
      normalized.includes('429') ||
      normalized.includes('quota') ||
      normalized.includes('rate limit') ||
      normalized.includes('insufficient_quota')
    ) {
      return 'AI writing is temporarily unavailable right now. Please try again in a few minutes.';
    }
  }

  return 'AI writing is temporarily unavailable right now. Please try again later.';
}
