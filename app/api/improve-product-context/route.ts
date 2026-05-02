import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const allowedFields = new Map([
  ['tagline', 'Product Tagline'],
  ['what_it_does', 'What it does'],
  ['who_its_for', "Who it's for"],
  ['key_benefits', 'Key benefits'],
  ['buyer_pain', 'Main buyer pain'],
  ['desired_outcome', 'Desired outcome'],
  ['biggest_objection', 'Biggest objection'],
  ['proof_points', 'Proof or results'],
  ['cta_preference', 'CTA preference'],
  ['target_keywords', 'Target keywords'],
  ['promo_details', 'Promo details'],
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId =
      (typeof body.companyId === 'string' && body.companyId) ||
      getCompanyIdFromReferer(req.headers);
    const field = String(body.field || '').trim();
    const label = allowedFields.get(field);
    const currentValue = String(body.currentValue || '').trim();
    const context = body.context && typeof body.context === 'object' ? body.context : {};

    if (!companyId || !label) {
      return NextResponse.json({ error: 'Missing companyId or supported field' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.55,
      messages: [
        {
          role: 'system',
          content: `You improve product context fields for PostPilot, a Whop post scheduler.

Write concise, specific context that helps AI generate high-converting Whop community posts.
Optimize for buyer curiosity, trust, product education, objection handling, and soft sales.
Never invent concrete features, prices, deadlines, results, or guarantees.
If the source context is thin, write a useful but cautious version that stays general.
For benefits, proof, pains, outcomes, objections, and keywords, use one item per line.
Return only the improved field text.`,
        },
        {
          role: 'user',
          content: `Improve this field: ${label}

Current field value:
${currentValue || '(empty)'}

Full product context:
${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const value = completion.choices[0]?.message?.content?.trim();
    if (!value) {
      return NextResponse.json({ error: 'OpenAI returned empty content' }, { status: 502 });
    }

    return NextResponse.json({ value });
  } catch (err) {
    console.error('[improve-product-context]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
