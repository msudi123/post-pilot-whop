import { NextRequest, NextResponse } from 'next/server';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { postToForum } from '@/lib/poster';
import { processDueScheduledPosts } from '@/lib/process-due-posts';
import { getProductContext, saveProductContext } from '@/lib/product-context';
import { getWhopSdk } from '@/lib/whop';

export const dynamic = 'force-dynamic';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseScheduledAt(value: unknown) {
  const scheduledAt = String(value || '').trim();
  if (!scheduledAt) {
    throw new Error('Missing scheduledAt');
  }

  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid scheduledAt');
  }

  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;
    const companyIdRaw =
      (typeof body.companyId === 'string' && body.companyId) ||
      getCompanyIdFromReferer(req.headers);
    const companyId = String(companyIdRaw || '').trim();

    if (!action || !companyId) {
      return NextResponse.json({ error: 'Missing action or companyId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const productContext = await getProductContext(companyId).catch(() => null);
    const postingMode = String(productContext?.posting_mode || 'approval').toLowerCase() === 'auto-post'
      ? 'auto-post'
      : 'approval';

    if (action === 'addForum') {
      const name = String(body.name || '').trim();
      const experienceId = String(body.experienceId || '').trim();
      if (!name || !experienceId) {
        return NextResponse.json({ error: 'Missing name or experienceId' }, { status: 400 });
      }
      const { data, error } = await supabase
        .from('forums')
        .insert({
          company_id: companyId,
          name,
          experience_id: experienceId,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, forum: data });
    }

    if (action === 'pullForums') {
      const whopForums: any[] = [];
      for await (const forum of getWhopSdk().forums.list({ company_id: companyId, first: 100 })) {
        whopForums.push(forum);
      }

      const rows = whopForums
        .map((forum: any, index: number) => {
          const experienceId = String(forum?.experience?.id || '').trim();
          if (!experienceId) return null;
          return {
            company_id: companyId,
            experience_id: experienceId,
            name:
              String(forum?.name || '').trim() ||
              String(forum?.title || '').trim() ||
              String(forum?.experience?.name || '').trim() ||
              `Forum ${index + 1}`,
          };
        })
        .filter(Boolean) as Array<{ company_id: string; experience_id: string; name: string }>;

      if (rows.length === 0) {
        return NextResponse.json({ success: true, forums: [], count: 0 });
      }

      const { data, error } = await supabase
        .from('forums')
        .upsert(rows, { onConflict: 'company_id,experience_id' })
        .select('*');

      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, forums: data || [], count: rows.length });
    }

    if (action === 'deleteForum') {
      const id = String(body.id || '').trim();
      if (!id) return NextResponse.json({ error: 'Missing forum id' }, { status: 400 });
      if (!isUuid(id)) {
        return NextResponse.json({ error: 'This forum is synced from Whop and cannot be deleted here' }, { status: 400 });
      }
      const { error } = await supabase.from('forums').delete().eq('company_id', companyId).eq('id', id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true });
    }

    if (action === 'updateForumName') {
      const id = String(body.id || '').trim();
      const name = String(body.name || '').trim();
      if (!id || !name) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });
      if (!isUuid(id)) {
        return NextResponse.json({ error: 'This forum is synced from Whop and cannot be renamed here' }, { status: 400 });
      }
      const { error } = await supabase.from('forums').update({ name }).eq('company_id', companyId).eq('id', id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true });
    }

    if (action === 'addScheduledPost') {
      const forumId = String(body.forumId || '').trim();
      const content = String(body.content || '').trim();
      if (!forumId || !content) {
        return NextResponse.json({ error: 'Missing forumId, content, or scheduledAt' }, { status: 400 });
      }
      const scheduledAt = parseScheduledAt(body.scheduledAt);
      if (scheduledAt.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'Choose a future date and time for the scheduled post' },
          { status: 400 }
        );
      }
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          company_id: companyId,
          forum_id: forumId,
          content,
          scheduled_at: scheduledAt.toISOString(),
          status: postingMode === 'auto-post' ? 'scheduled' : 'draft',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, scheduledPost: data });
    }

    if (action === 'approveDraft') {
      const rowId = String(body.rowId || '').trim();
      if (!rowId) return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'scheduled', failed_reason: null })
        .eq('company_id', companyId)
        .eq('id', rowId)
        .eq('status', 'draft');
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true });
    }

    if (action === 'retryScheduledPost') {
      const rowId = String(body.rowId || '').trim();
      if (!rowId) return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'scheduled', failed_reason: null })
        .eq('company_id', companyId)
        .eq('id', rowId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true });
    }

    if (action === 'processDuePosts') {
      const result = await processDueScheduledPosts({ companyId });
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'saveTemplate') {
      const name = String(body.name || '').trim();
      const content = String(body.content || '').trim();
      if (!name || !content) {
        return NextResponse.json({ error: 'Missing name or content' }, { status: 400 });
      }
      const { error } = await supabase.from('templates').insert({
        company_id: companyId,
        name,
        content,
        is_builtin: false,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true });
    }

    if (action === 'saveProductContext') {
      const row = {
        company_id: companyId,
        tagline: String(body.tagline || '').trim(),
        what_it_does: String(body.what_it_does || '').trim(),
        who_its_for: String(body.who_its_for || '').trim(),
        key_benefits: String(body.key_benefits || '').trim(),
        price: String(body.price || '').trim(),
        promo_code: String(body.promo_code || '').trim(),
        promo_details: String(body.promo_details || '').trim(),
        product_link: String(body.product_link || '').trim(),
        buyer_pain: String(body.buyer_pain || '').trim(),
        desired_outcome: String(body.desired_outcome || '').trim(),
        biggest_objection: String(body.biggest_objection || '').trim(),
        proof_points: String(body.proof_points || '').trim(),
        cta_preference: String(body.cta_preference || '').trim(),
        target_keywords: String(body.target_keywords || '').trim(),
        whop_company: String(body.whop_company || '').trim(),
        whop_products: String(body.whop_products || '').trim(),
        posting_mode: String(body.posting_mode || 'approval').trim() || 'approval',
        signature_template: String(body.signature_template || '').trim(),
        signature_enabled_default: Boolean(body.signature_enabled_default),
        default_forum_id: String(body.default_forum_id || '').trim(),
        brand_voice: String(body.brand_voice || 'Professional').trim() || 'Professional',
        posting_goal: String(body.posting_goal || 'Engagement').trim() || 'Engagement',
        posting_frequency: String(body.posting_frequency || '5 posts/week').trim() || '5 posts/week',
        onboarding_completed: Boolean(body.onboarding_completed),
        updated_at: new Date().toISOString(),
      };

      const data = await saveProductContext(row);
      return NextResponse.json({ success: true, productContext: data });
    }

    if (action === 'postNowCustom') {
      const forumId = String(body.forumId || '').trim();
      const content = String(body.content || '').trim();
      if (!forumId || !content) {
        return NextResponse.json({ error: 'Missing forumId or content' }, { status: 400 });
      }
      const created = await postToForum(forumId, content, companyId);
      const { error } = await supabase.from('post_log').insert({
        company_id: companyId,
        post_id: `manual-${Date.now()}`,
        whop_post_id: created.id,
        ai_content: content,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, whopPostId: created.id });
    }

    if (action === 'repostScheduled') {
      const rowId = String(body.rowId || '').trim();
      if (!rowId) return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', rowId)
        .single();
      if (error || !data) throw new Error(error?.message || 'Scheduled post not found');
      const created = await postToForum(data.forum_id, data.content, companyId);
      const update = await supabase
        .from('scheduled_posts')
        .update({ status: 'posted', whop_post_id: created.id })
        .eq('company_id', companyId)
        .eq('id', rowId);
      if (update.error) throw new Error(update.error.message);
      const log = await supabase.from('post_log').insert({
        company_id: companyId,
        post_id: rowId,
        whop_post_id: created.id,
        ai_content: data.content,
      });
      if (log.error) throw new Error(log.error.message);
      return NextResponse.json({ success: true, whopPostId: created.id });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[dashboard-action]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
