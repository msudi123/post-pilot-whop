import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getWhopSdk } from '@/lib/whop';

export const dynamic = 'force-dynamic';

const ONE_HOUR_MS = 60 * 60 * 1000;

function isPermissionError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes('forbidden') ||
    m.includes('permission') ||
    m.includes('scope') ||
    m.includes('forum:read') ||
    m.includes('not authorized') ||
    m.includes('unauthorized')
  );
}

export async function GET(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const postsResp = await supabase
      .from('post_log')
      .select('whop_post_id, ai_content, posted_at')
      .eq('company_id', companyId)
      .not('whop_post_id', 'is', null)
      .order('posted_at', { ascending: false });
    if (postsResp.error) throw new Error(postsResp.error.message);

    const scheduledResp = await supabase
      .from('scheduled_posts')
      .select('whop_post_id, content, scheduled_at, status')
      .eq('company_id', companyId)
      .eq('status', 'posted')
      .not('whop_post_id', 'is', null)
      .order('scheduled_at', { ascending: false });
    if (scheduledResp.error) throw new Error(scheduledResp.error.message);

    const forumsResp = await supabase.from('forums').select('experience_id,name').eq('company_id', companyId);
    if (forumsResp.error) throw new Error(forumsResp.error.message);
    const forumNameById = new Map((forumsResp.data || []).map((f) => [f.experience_id, f.name]));

    const mergedPosts = new Map<string, { whop_post_id: string; ai_content: string; posted_at: string }>();
    for (const post of postsResp.data || []) {
      const postId = String(post.whop_post_id || '').trim();
      if (!postId) continue;
      mergedPosts.set(postId, {
        whop_post_id: postId,
        ai_content: String(post.ai_content || ''),
        posted_at: String(post.posted_at || ''),
      });
    }
    for (const post of scheduledResp.data || []) {
      const postId = String(post.whop_post_id || '').trim();
      if (!postId || mergedPosts.has(postId)) continue;
      mergedPosts.set(postId, {
        whop_post_id: postId,
        ai_content: String(post.content || ''),
        posted_at: String(post.scheduled_at || ''),
      });
    }

    const rows = [];
    for (const post of Array.from(mergedPosts.values()).sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())) {
      const postId = post.whop_post_id;
      const cacheResp = await supabase
        .from('analytics_cache')
        .select('*')
        .eq('company_id', companyId)
        .eq('whop_post_id', postId)
        .maybeSingle();
      if (cacheResp.error) throw new Error(cacheResp.error.message);

      const cache = cacheResp.data;
      const stale =
        !cache ||
        !cache.last_fetched ||
        Date.now() - new Date(cache.last_fetched).getTime() > ONE_HOUR_MS;

      let commentCount = Number(cache?.comment_count || 0);
      let likeCount = Number(cache?.like_count || 0);
      let viewCount = Number(cache?.view_count || 0);
      let forumId = '';

      if (stale) {
        try {
          const detail = await getWhopSdk().forumPosts.retrieve(postId);
          commentCount = Number((detail as any)?.comment_count || 0);
          likeCount = Number((detail as any)?.like_count || 0);
          viewCount = Number((detail as any)?.view_count || 0);
          forumId = String((detail as any)?.experience_id || '');
          const upsert = await supabase.from('analytics_cache').upsert({
            company_id: companyId,
            whop_post_id: postId,
            comment_count: commentCount,
            like_count: likeCount,
            view_count: viewCount,
            last_fetched: new Date().toISOString(),
          });
          if (upsert.error) throw new Error(upsert.error.message);
        } catch (err) {
          const message = getErrorMessage(err);
          if (isPermissionError(message)) {
            return NextResponse.json(
              {
                permissionError:
                  'Analytics needs forum:read permission in your Whop app. Please add it and try again.',
                details: message,
              },
              { status: 200 }
            );
          }
          // Non-permission failures should not block analytics for all rows.
          // Keep cached values (or zeros) and continue.
        }
      }

      rows.push({
        whop_post_id: postId,
        content: post.ai_content || '',
        posted_at: post.posted_at,
        comment_count: commentCount,
        like_count: likeCount,
        view_count: viewCount,
        forum: forumNameById.get(forumId) || 'Unknown',
      });
    }
    return NextResponse.json({ success: true, rows });
  } catch (err) {
    console.error('[analytics]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
