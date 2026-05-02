import { NextRequest, NextResponse } from 'next/server';
import { POST_SCHEDULE } from '@/lib/schedule';
import { enhancePost } from '@/lib/openai';
import { postToForum } from '@/lib/poster';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { postId, experienceId, companyId: bodyCompanyId, content } = await req.json();
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

    let enhancedContent =
      typeof content === 'string' && content.trim().length > 0
        ? content.trim()
        : '';

    if (!enhancedContent) {
      try {
        enhancedContent = await enhancePost(post, companyId);
      } catch (err) {
        console.error('[post-now:openai-fallback]', err);
        enhancedContent = post.copy;
      }
    }
    const targetExperienceId =
      typeof experienceId === 'string' && experienceId.trim().length > 0
        ? experienceId.trim()
        : 'public';
    const whopPost = await postToForum(targetExperienceId, enhancedContent, companyId);

    const { error } = await getSupabaseAdmin().from('post_log').insert({
      company_id: companyId,
      post_id: postId,
      whop_post_id: whopPost.id,
      ai_content: enhancedContent,
    });

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      whopPostId: whopPost.id,
      content: enhancedContent,
    });
  } catch (err) {
    console.error('[post-now]', err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
