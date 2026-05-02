import { NextRequest, NextResponse } from 'next/server';
import { POST_SCHEDULE } from '@/lib/schedule';
import { enhancePost, getOpenAIErrorMessage } from '@/lib/openai';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { postId, companyId: bodyCompanyId } = await req.json();
    const companyId = bodyCompanyId || getCompanyIdFromReferer(req.headers);

    if (!postId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, companyId' },
        { status: 400 }
      );
    }

    const post = POST_SCHEDULE.find((p) => p.id === postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let content: string;
    try {
      content = await enhancePost(post, companyId);
    } catch (err) {
      console.error('[preview-ai:openai]', err);
      return NextResponse.json(
        { error: getOpenAIErrorMessage(err) },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, content });
  } catch (err) {
    console.error('[preview-ai]', err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
