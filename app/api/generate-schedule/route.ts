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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseJsonArray(value: string) {
  const trimmed = value.trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON array found');
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function generateBatchChunk(params: {
  companyId: string;
  productContext: string;
  topic: string;
  tone: string;
  postTypes: string[];
  count: number;
  existingAngles: string[];
}) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.85,
    messages: [
      {
        role: 'system',
        content: `You are PostPilot, an AI Whop community manager and content scheduler for a creator business.
Generate exactly ${params.count} distinct community posts as a valid JSON array.

Product context:
${params.productContext || 'No product context has been saved yet.'}

Rules:
- Return exactly ${params.count} objects
- Every post must use specific details from the product context when available
- Mention concrete deliverables, mechanisms, checklists, templates, lessons, calculators, workflows, or frameworks from the context
- Never sound like a generic ad
- Never ask people to comment for the link or DM for access
- If there is a CTA, point directly to joining/accessing the Whop when a link exists
- Never invent numbers, testimonials, guarantees, timelines, discounts, scarcity, results, or features
- Use ${params.tone} tone
- Vary across these post types: ${params.postTypes.join(', ')}
- Vary the angle between posts. Avoid repeating these existing angles: ${params.existingAngles.join(', ') || 'none yet'}
- No hashtags
- No emojis unless the post type naturally calls for community energy
- Never start a post with "I"
- Avoid phrases like "unlock the potential", "exclusive community", "premium resources", "transform your business", "comment below for the link"
- Return ONLY valid JSON

Return this exact JSON structure:
[
  {
    "postType": "string",
    "suggestedDay": 1,
    "suggestedSlot": "AM",
    "angle": "string",
    "content": "string"
  }
]`,
      },
      {
        role: 'user',
        content: `Topic or goal: ${params.topic || 'Choose useful community content angles from the product context.'}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '';
  const posts = parseJsonArray(raw);
  if (!Array.isArray(posts)) {
    throw new Error('AI generation failed - try again or reduce the number of posts');
  }

  return posts;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId =
      (typeof body.companyId === 'string' && body.companyId) ||
      getCompanyIdFromReferer(req.headers);
    const count = Number(body.count);
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const tone = typeof body.tone === 'string' ? body.tone.trim() : '';
    const postTypes = Array.isArray(body.postTypes)
      ? body.postTypes.map(String).filter(Boolean)
      : [];
    const forumId = typeof body.forumId === 'string' ? body.forumId.trim() : '';

    if (!companyId || !tone || !Number.isFinite(count) || count < 1 || count > 30 || postTypes.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid companyId, count, topic, tone, or postTypes' },
        { status: 400 }
      );
    }

    const productContext = formatProductContext(await getProductContext(companyId));

    const collected: any[] = [];
    const seenAngles = new Set<string>();
    let attempts = 0;

    while (collected.length < count && attempts < 3) {
      attempts += 1;
      const remaining = count - collected.length;
      let posts;
      try {
        posts = await generateBatchChunk({
          companyId,
          productContext,
          topic,
          tone,
          postTypes,
          count: remaining,
          existingAngles: Array.from(seenAngles),
        });
      } catch {
        break;
      }

      for (const post of posts) {
        if (collected.length >= count) break;
        const content = String(post.content || '').trim();
        if (!content) continue;
        const angle = String(post.angle || '').trim().toLowerCase();
        const duplicateByAngle = angle && seenAngles.has(angle);
        const duplicateByContent = collected.some((existing) => String(existing.content || '').trim() === content);
        if (duplicateByAngle || duplicateByContent) continue;
        if (angle) seenAngles.add(angle);
        collected.push(post);
      }
    }

    const identity = await resolveUsageIdentity(companyId);
    const generationCheck = await canGeneratePosts(identity.userId, identity.whopUserId, count);
    if (!generationCheck.allowed) {
      return NextResponse.json(
        {
          error: usageErrorMessage(generationCheck.reason, generationCheck.summary, count),
          code: generationCheck.reason,
          usage: generationCheck.summary,
        },
        { status: 402 }
      );
    }

    if (collected.length === 0) {
      return NextResponse.json(
        { error: 'AI generation failed - try again or reduce the number of posts' },
        { status: 502 }
      );
    }

    while (collected.length < count) {
      const source = collected[collected.length % Math.max(1, collected.length)];
      collected.push({
        ...source,
        postType: String(postTypes[collected.length % postTypes.length] || source.postType || 'Post'),
        suggestedDay: collected.length + 1,
        suggestedSlot: collected.length % 2 === 0 ? 'AM' : 'PM',
      });
    }

    const postsOut = collected.slice(0, count).map((post, index) => ({
        postType: String(post.postType || postTypes[index % postTypes.length]),
        suggestedDay: Math.min(30, Math.max(1, Number(post.suggestedDay) || index + 1)),
        suggestedSlot: post.suggestedSlot === 'PM' ? 'PM' : 'AM',
        content: String(post.content || '').trim(),
      }));
    const drafts = await createDraftRows({
      userId: identity.userId,
      whopUserId: identity.whopUserId,
      companyId,
      forumId,
      drafts: postsOut.map((post) => ({
        title: post.postType,
        content: post.content,
        generation_credit_count: 1,
      })),
    });
    const usage = await consumeGenerationCredits(identity.userId, identity.whopUserId, count);

    return NextResponse.json({
      posts: postsOut.map((post, index) => ({
        ...post,
        draftId: drafts[index]?.id || null,
        free_regeneration_used: false,
      })),
      usage,
    });
  } catch (err) {
    console.error('[generate-schedule]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
