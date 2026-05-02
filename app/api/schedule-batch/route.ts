import { NextRequest, NextResponse } from 'next/server';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type BatchPostInput = {
  forumId?: string;
  forum_id?: string;
  content?: string;
  dayOffset?: number;
  slot?: 'AM' | 'PM';
  scheduledAt?: string;
  scheduled_at?: string;
  draftId?: string;
  postpilot_draft_id?: string;
};

function scheduledAtFromOffset(dayOffset: number, slot: 'AM' | 'PM') {
  const date = new Date();
  date.setUTCHours(slot === 'AM' ? 9 : 19, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + Math.max(0, dayOffset - 1));
  return date.toISOString();
}

function isValidDate(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId =
      (typeof body.companyId === 'string' && body.companyId) ||
      getCompanyIdFromReferer(req.headers);
    const posts: BatchPostInput[] = Array.isArray(body.posts) ? body.posts : [];

    if (!companyId || posts.length === 0) {
      return NextResponse.json({ error: 'Missing companyId or posts' }, { status: 400 });
    }

    const rows = posts.map((post) => {
      const forumId = String(post.forumId || post.forum_id || '').trim();
      const content = String(post.content || '').trim();
      const dayOffset = Math.min(30, Math.max(1, Number(post.dayOffset) || 1));
      const slot = post.slot === 'PM' ? 'PM' : 'AM';
      const scheduledAt = String(post.scheduledAt || post.scheduled_at || '').trim();

      if (!forumId || !content) {
        throw new Error('Every post needs a forum and content');
      }

      return {
        company_id: companyId,
        forum_id: forumId,
        content,
        postpilot_draft_id: post.draftId || post.postpilot_draft_id || null,
        scheduled_at: isValidDate(scheduledAt)
          ? new Date(scheduledAt).toISOString()
          : scheduledAtFromOffset(dayOffset, slot),
        status: 'scheduled',
      };
    });

    const { data, error } = await getSupabaseAdmin()
      .from('scheduled_posts')
      .insert(rows)
      .select('*');

    if (error) throw new Error(error.message);

    const draftIds = rows.map((row: any) => row.postpilot_draft_id).filter(Boolean);
    if (draftIds.length > 0) {
      await getSupabaseAdmin()
        .from('postpilot_drafts')
        .update({ status: 'scheduled', updated_at: new Date().toISOString() })
        .in('id', draftIds);
    }

    return NextResponse.json({
      scheduled: data?.length || 0,
      posts: data || [],
    });
  } catch (err) {
    console.error('[schedule-batch]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
