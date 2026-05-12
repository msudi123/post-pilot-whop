import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { supabaseRestFetch } from '@/lib/supabase-rest';
import { getWhopSdk } from '@/lib/whop';
import { getPostingIdentity } from '@/lib/posting-identity';
import { getProductContext } from '@/lib/product-context';
import { getUsageSummary, resolveUsageIdentity } from '@/lib/postpilot-usage';

export const dynamic = 'force-dynamic';

function getWhopForumExperienceId(forum: any) {
  return String(
    forum?.experience?.id ||
    forum?.experience_id ||
    forum?.id ||
    ''
  ).trim();
}

type LocalForumRow = {
  id: string;
  company_id: string;
  name: string;
  experience_id: string;
  created_at: string;
};

type WhopForumMeta = {
  who_can_post?: string;
  who_can_comment?: string;
  experience_name?: string;
  is_synced_only?: boolean;
};

type WhopForumMetaEntry = [string, WhopForumMeta];

const BUILTIN_TEMPLATES = [
  {
    name: 'Value Drop',
    content:
      "The biggest mistake most [niche] creators make:\n\nThey [common mistake].\n\nHere's what actually works:\n[3 bullet points of value]\n\nSave this for later.",
  },
  {
    name: 'Story Hook',
    content:
      'This time last year I was [before state].\n\nNow [after state].\n\nThe one thing that changed:\n\n[The insight or tool or decision]\n\nHere is exactly what I did:',
  },
  {
    name: 'Community Question',
    content:
      'Quick question for everyone here:\n\n[Question that relates to their goal or struggle]\n\nDrop your answer below - I read every reply.',
  },
  {
    name: 'Myth Bust',
    content:
      'Unpopular opinion:\n\n[Common belief in your niche] is wrong.\n\nHere is the truth:\n\n[The reframe]\n\nHave you been doing this wrong too?',
  },
  {
    name: 'Soft Promo',
    content:
      "Something I built that people do not expect:\n\n[Unexpected feature or benefit]\n\nMost people [common mistake this solves].\n\n[Product name] link in bio.",
  },
];

export async function GET(req: NextRequest) {
  try {
    const skipAuth = process.env.SKIP_WHOP_AUTH === 'true' && process.env.NODE_ENV !== 'production';
    let verifiedUserId: string;
    try {
      verifiedUserId = skipAuth ? 'dev-user' : (await getWhopSdk().verifyUserToken(req.headers)).userId;
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyIdRaw = req.nextUrl.searchParams.get('companyId');
    const companyId = companyIdRaw?.trim() || '';

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let forumsData = await supabaseRestFetch<LocalForumRow[]>('forums', {
      select: '*',
      company_id: `eq.${companyId}`,
      order: 'created_at.asc',
    }).catch(() => []);

    // Safety fallback for legacy rows with casing/whitespace mismatches.
    if ((forumsData || []).length === 0) {
      const allForums = await supabaseRestFetch<LocalForumRow[]>('forums', {
        select: '*',
        order: 'created_at.asc',
      }).catch(() => []);
      const normalized = (allForums || []).filter((f: any) => {
        const rowCompany = String(f.company_id || '').trim().toLowerCase();
        return rowCompany === companyId.toLowerCase();
      });
      if (normalized.length > 0) {
        forumsData = normalized;
      }
    }

    let whopForumMeta = new Map<string, WhopForumMeta>();
    try {
      const whopForums: any[] = [];
      for await (const forum of getWhopSdk().forums.list({ company_id: companyId, first: 100 })) {
        whopForums.push(forum);
      }
      whopForumMeta = new Map(
        whopForums
          .map((forum: any): WhopForumMetaEntry | null => {
            const experienceId = getWhopForumExperienceId(forum);
            if (!experienceId) return null;
            return [
              experienceId,
              {
                who_can_post: forum.who_can_post,
                who_can_comment: forum.who_can_comment,
                experience_name: forum?.experience?.name || forum?.name || '',
              },
            ];
          })
          .filter((entry): entry is WhopForumMetaEntry => Boolean(entry))
      );
    } catch (discoveryErr) {
      console.warn('[dashboard-data] forum metadata warning:', getErrorMessage(discoveryErr));
    }

    const templatesResp = await supabase
      .from('templates')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (templatesResp.error) {
      throw new Error(`templates query failed: ${templatesResp.error.message}`);
    }

    let virtualBuiltinTemplates:
      | Array<{ id: string; company_id: string; name: string; content: string; is_builtin: boolean }>
      | null = null;

    if ((templatesResp.data || []).length === 0) {
      const { error: seedErr } = await supabase.from('templates').insert(
        BUILTIN_TEMPLATES.map((t) => ({
          company_id: companyId,
          name: t.name,
          content: t.content,
          is_builtin: true,
        }))
      );
      if (seedErr) {
        // Some databases have a global unique index on template name.
        // In that case we keep the app usable by serving built-ins virtually
        // for this company even when DB inserts are blocked by that index.
        if (seedErr.message.toLowerCase().includes('duplicate key value')) {
          virtualBuiltinTemplates = BUILTIN_TEMPLATES.map((t, i) => ({
            id: `virtual-${i}`,
            company_id: companyId,
            name: t.name,
            content: t.content,
            is_builtin: true,
          }));
        } else {
          throw new Error(`template seed failed: ${seedErr.message}`);
        }
      }
    }

    const scheduledPosts = await supabaseRestFetch<any[]>('scheduled_posts', {
      select: '*',
      company_id: `eq.${companyId}`,
      order: 'scheduled_at.asc',
    });

    const postLog = await supabaseRestFetch<any[]>('post_log', {
      select: '*',
      company_id: `eq.${companyId}`,
      order: 'posted_at.desc',
    });

    const finalTemplates = await supabase
      .from('templates')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (finalTemplates.error) throw new Error(`templates fetch failed: ${finalTemplates.error.message}`);

    const templatesOut =
      (finalTemplates.data || []).length > 0
        ? finalTemplates.data
        : virtualBuiltinTemplates || [];

    const productContext = await getProductContext(companyId).catch(() => null);

    let postingIdentity = await getPostingIdentity(companyId).catch(() => null);

    // Seed posting identity from the verified platform token if not yet stored.
    if (!postingIdentity?.whop_user_id) {
      try {
        await supabase.from('posting_identity').upsert(
          { company_id: companyId, whop_user_id: verifiedUserId, updated_at: new Date().toISOString() },
          { onConflict: 'company_id' }
        );
        postingIdentity = await getPostingIdentity(companyId).catch(() => null);
      } catch {
        // Non-fatal: usage tracking will still work via verifiedUserId fallback.
      }
    }

    const usageIdentity = await resolveUsageIdentity(companyId, postingIdentity?.whop_user_id || verifiedUserId);
    const usage = await getUsageSummary(usageIdentity.userId, usageIdentity.whopUserId).catch((usageErr) => {
      console.warn('[dashboard-data] usage warning:', getErrorMessage(usageErr));
      return null;
    });

    const localForums = forumsData as LocalForumRow[];
    const mergedForums = localForums
      .map((forum) => ({
        ...forum,
        ...(whopForumMeta.get(forum.experience_id) || {}),
        is_synced_only: false,
      }))
      .sort((a, b) => {
      const postRankA = a.who_can_post === 'everyone' ? 0 : 1;
      const postRankB = b.who_can_post === 'everyone' ? 0 : 1;
      if (postRankA !== postRankB) return postRankA - postRankB;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });

    const postableForums = mergedForums;

    return NextResponse.json({
      success: true,
      companyId,
      forumCount: mergedForums.length,
      forums: mergedForums,
      postableForums,
      templates: templatesOut,
      scheduledPosts,
      postLog,
      productContext,
      usage,
      postingIdentity: {
        connected: true,
        whop_user_id: postingIdentity?.whop_user_id || verifiedUserId,
        whop_username: postingIdentity?.username || null,
        whop_name: postingIdentity?.name || null,
        whop_company_name: null,
      },
    });
  } catch (err) {
    console.error('[dashboard-data]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
