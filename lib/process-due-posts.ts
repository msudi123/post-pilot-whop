import { getSupabaseAdmin } from './supabase';
import { postToForum } from './poster';
import { getErrorMessage } from './api-auth';

export async function processDueScheduledPosts(options?: {
  companyId?: string;
  lookbackHours?: number;
}) {
  const now = new Date();
  const lookback = new Date(
    now.getTime() - (options?.lookbackHours ?? 24) * 60 * 60 * 1000
  );
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_at', lookback.toISOString())
    .lte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(25);

  if (options?.companyId) {
    query = query.eq('company_id', options.companyId);
  }

  const due = await query;
  if (due.error) {
    throw new Error(`scheduled_posts query failed: ${due.error.message}`);
  }

  const results = [];
  for (const row of due.data || []) {
    try {
      const whopPost = await postToForum(row.forum_id, row.content, row.company_id);
      const update = await supabase
        .from('scheduled_posts')
        .update({ status: 'posted', whop_post_id: whopPost.id })
        .eq('id', row.id);
      if (update.error) throw new Error(update.error.message);

      const log = await supabase.from('post_log').insert({
        company_id: row.company_id,
        post_id: row.id,
        whop_post_id: whopPost.id,
        ai_content: row.content,
      });
      if (log.error) throw new Error(log.error.message);

      results.push({ id: row.id, status: 'posted', whopPostId: whopPost.id });
    } catch (err) {
      const reason = getErrorMessage(err);
      console.error('[process-due-posts] failed row', row.id, reason);
      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed', failed_reason: reason })
        .eq('id', row.id);
      results.push({ id: row.id, status: 'failed', error: reason });
    }
  }

  return {
    processed: results.length,
    results,
    ranAt: now.toISOString(),
  };
}
