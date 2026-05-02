import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';
import { formatProductContext, getProductContext } from '@/lib/product-context';
import {
  canGeneratePosts,
  consumeGenerationCredits,
  createDraftRows,
  resolveUsageIdentity,
  usageErrorMessage,
} from '@/lib/postpilot-usage';

export const dynamic = 'force-dynamic';

type Tone = 'Informative' | 'Story' | 'Promotional' | 'Engagement';
type Length = 'short' | 'medium' | 'long';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isValidTone(value: string): value is Tone {
  return ['Informative', 'Story', 'Promotional', 'Engagement'].includes(value);
}

function isValidLength(value: string): value is Length {
  return ['short', 'medium', 'long'].includes(value);
}

function lengthInstruction(length: Length) {
  if (length === 'short') return '1 to 3 lines.';
  if (length === 'medium') return '5 to 8 lines.';
  return '10 or more lines.';
}

const BANNED_GENERIC_PHRASES = [
  'unlock the potential',
  'exclusive whop community',
  'premium resources',
  'elevate your digital strategy',
  'optimize your customer experience',
  'crafted to guide you every step of the way',
  'joining the whop means more than just access',
  'it is about transformation',
  'curious about what\'s inside',
  'ready to take the leap',
  'comment',
  'i will send you the link',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const manualProductContext =
      typeof body.productContext === 'string' ? body.productContext.trim() : '';
    const tone = body.tone;
    const length = body.length;
    const companyId =
      (typeof body.companyId === 'string' && body.companyId) ||
      getCompanyIdFromReferer(req.headers);
    const forumId = typeof body.forumId === 'string' ? body.forumId.trim() : '';

    if (!isValidTone(tone) || !isValidLength(length) || !companyId) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: tone, length, companyId' },
        { status: 400 }
      );
    }

    const identity = await resolveUsageIdentity(companyId);
    const generationCheck = await canGeneratePosts(identity.userId, identity.whopUserId, 1);
    if (!generationCheck.allowed) {
      return NextResponse.json(
        {
          error: usageErrorMessage(generationCheck.reason, generationCheck.summary, 1),
          code: generationCheck.reason,
          usage: generationCheck.summary,
        },
        { status: 402 }
      );
    }

    const savedProductContext = formatProductContext(await getProductContext(companyId));
    const productContext = savedProductContext || manualProductContext;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content:
            `You are PostPilot, an AI Whop community manager writing posts for a specific creator business.

Write a post that sounds informed by the actual product details, not like a generic ad.

Hard requirements:
- Use at least 2 concrete product details from the provided context when they exist
- Mention a specific deliverable, mechanism, checklist, template, lesson, calculator, framework, or workflow from the context
- Sound like a creator talking to members inside a real Whop community
- Build curiosity through specificity, not vague hype
- If a CTA is used, send people directly to the Whop/link when available
- Do not use comment-to-DM funnels
- Do not ask the reader to comment for the link
- Do not invent numbers, reviews, timelines, guarantees, pricing, features, or outcomes
- Avoid generic ad language and empty filler
- No hashtags
- No emojis unless tone is Engagement
- Never start with "I"
- Return only the post text

Avoid phrases like:
${BANNED_GENERIC_PHRASES.map((item) => `- ${item}`).join('\n')}`,
        },
        {
          role: 'user',
          content: `Company/product context:
${productContext || 'No context provided.'}

Topic: ${topic || 'Choose the strongest useful angle from the product context.'}
Tone: ${tone}
Target length: ${lengthInstruction(length)}

Write one post that feels specific to this business. Prefer concrete details over broad claims.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: 'OpenAI returned empty content' },
        { status: 502 }
      );
    }

    const drafts = await createDraftRows({
      userId: identity.userId,
      whopUserId: identity.whopUserId,
      companyId,
      forumId,
      drafts: [{ title: `${tone} post`, content, generation_credit_count: 1 }],
    });
    const usage = await consumeGenerationCredits(identity.userId, identity.whopUserId, 1);

    return NextResponse.json({ content, draft: drafts[0] || null, usage });
  } catch (err) {
    console.error('[generate-post]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
