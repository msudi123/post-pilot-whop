import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { supabaseRestFetch } from '@/lib/supabase-rest';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const companyId = (req.nextUrl.searchParams.get('companyId') || '').trim();
    const keyword = req.nextUrl.searchParams.get('keyword') || '';
    const forumId = req.nextUrl.searchParams.get('forumId') || 'all';
    const status = req.nextUrl.searchParams.get('status') || 'all';
    const from = req.nextUrl.searchParams.get('from') || '';
    const to = req.nextUrl.searchParams.get('to') || '';

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const rawRows = await supabaseRestFetch<any[]>('scheduled_posts', {
      select: '*',
      company_id: `eq.${companyId}`,
      order: 'scheduled_at.desc',
    });

    let rows = rawRows;
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      rows = rows.filter((r: any) => String(r.content || '').toLowerCase().includes(k));
    }
    if (forumId !== 'all') {
      rows = rows.filter((r: any) => r.forum_id === forumId);
    }
    if (status === 'all') {
      rows = rows.filter((r: any) => ['posted', 'failed', 'cancelled'].includes(String(r.status || '').toLowerCase()));
    } else {
      rows = rows.filter((r: any) => String(r.status || '').toLowerCase() === status.toLowerCase());
    }
    if (from) {
      rows = rows.filter((r: any) => String(r.scheduled_at) >= `${from}T00:00:00.000Z`);
    }
    if (to) {
      rows = rows.filter((r: any) => String(r.scheduled_at) <= `${to}T23:59:59.999Z`);
    }

    const forumsResp = await supabase.from('forums').select('*').eq('company_id', companyId);
    if (forumsResp.error) throw new Error(forumsResp.error.message);
    const forumMap = new Map((forumsResp.data || []).map((f) => [f.experience_id, f.name]));

    const mappedRows = rows.map((row) => ({
      ...row,
      forum_name: forumMap.get(row.forum_id) || row.forum_id,
    }));
    return NextResponse.json(
      { success: true, rows: mappedRows, companyId, count: mappedRows.length },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('[history]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
