import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';
import { formatProductContext, getProductContext } from '@/lib/product-context';
import {
  canGeneratePosts,
  consumeGenerationCredits,
  getUsageSummary,
  resolveUsageIdentity,
  usageErrorMessage,
} from '@/lib/postpilot-usage';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

type DraftRow = {
  id: string;
  user_id: string;
  company_id?: string | null;
  title?: string | null;
  content: string;
  free_regeneration_used?: boolean | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId =
      (typeof body.companyId === 'string' && body.companyId) ||
      getCompanyIdFromReferer(req.headers);
    const draftId = typeof body.draftId === 'string' ? body.draftId.trim() : '';
    const currentTitle = typeof body.title === 'string' ? body.title.trim() : '';
    const currentContent = typeof body.content === 'string' ? body.content.trim() : '';
    const topicHint = typeof body.topicHint === 'string' ? body.topicHint.trim() : '';

    if (!companyId || !draftId) {
      return NextResponse.json({ error: 'Missing companyId or draftId' }, { status: 400 });
    }

    const identity = await resolveUsageIdentity(companyId);
    const { data: sourceDraft, error: draftError } = await getSupabaseAdmin()
      .from('postpilot_drafts')
      .select('id, user_id, company_id, title, content, free_regeneration_used')
      .eq('id', draftId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (draftError) {
      throw new Error(`draft lookup failed: ${draftError.message}`);
    }

    if (!sourceDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (String(sourceDraft.user_id || '') !== identity.userId) {
      return NextResponse.json({ error: 'Draft does not belong to the current user' }, { status: 403 });
    }

    const paidRegenerationRequired = Boolean(sourceDraft.free_regeneration_used);
    if (paidRegenerationRequired) {
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
    }

    const savedProductContext = formatProductContext(await getProductContext(companyId));
    const baseTitle = currentTitle || sourceDraft.title || 'Community post';
    const baseContent = currentContent || sourceDraft.content || '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.9,
      messages: [
        {
          role: 'system',
          content:
            `You are PostPilot, an AI Whop community manager rewriting an existing draft for a specific creator business.

Write a fresh variation of the draft that keeps the core topic but improves specificity, flow, and usefulness.

Hard requirements:
- Keep the same core topic and audience fit
- Change the phrasing and angle enough that it feels like a meaningful new version
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
- No emojis unless the draft clearly needs an energetic community tone
- Never start with "I"
- Return only the rewritten post text

Avoid phrases like:
${BANNED_GENERIC_PHRASES.map((item) => `- ${item}`).join('\n')}`,
        },
        {
          role: 'user',
          content: `Company/product context:
${savedProductContext || 'No context provided.'}

Current title: ${baseTitle}
Current draft:
${baseContent}

Additional hint:
${topicHint || 'Keep the intent of the original draft but make it feel fresher and more specific.'}

Rewrite this into one improved post.`,
        },
      ],
    });

    const regeneratedContent = completion.choices[0]?.message?.content?.trim();
    if (!regeneratedContent) {
      return NextResponse.json({ error: 'OpenAI returned empty content' }, { status: 502 });
    }

    const usage = paidRegenerationRequired
      ? await consumeGenerationCredits(identity.userId, identity.whopUserId, 1)
      : await getUsageSummary(identity.userId, identity.whopUserId);

    const { data: updatedDraft, error: updateError } = await getSupabaseAdmin()
      .from('postpilot_drafts')
      .update({
        title: baseTitle,
        content: regeneratedContent,
        free_regeneration_used: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(`draft update failed: ${updateError.message}`);
    }

    return NextResponse.json({
      title: updatedDraft.title || baseTitle,
      content: updatedDraft.content || regeneratedContent,
      draft: updatedDraft,
      usage,
      used_credit: paidRegenerationRequired,
      free_regeneration_used: true,
    });
  } catch (err) {
    console.error('[regenerate-post]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
