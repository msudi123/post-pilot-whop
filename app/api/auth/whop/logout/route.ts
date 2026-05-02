import { NextRequest, NextResponse } from 'next/server';
import { WHOP_OAUTH_COOKIE, clearWhopOAuthCookies, getWhopOAuthClientId } from '@/lib/whop-oauth';
import { getCompanyIdFromReferer } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(WHOP_OAUTH_COOKIE.refreshToken)?.value;
  const body = await req.json().catch(() => ({}));
  const companyId =
    (typeof body.companyId === 'string' && body.companyId.trim()) ||
    getCompanyIdFromReferer(req.headers);

  if (refreshToken) {
    await fetch('https://api.whop.com/oauth/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: refreshToken,
        client_id: getWhopOAuthClientId(),
      }),
      cache: 'no-store',
    }).catch(() => {});
  }

  if (companyId) {
    try {
      await getSupabaseAdmin()
        .from('posting_identity')
        .delete()
        .eq('company_id', companyId);
    } catch {
      // Logout should still clear the local OAuth session even if the optional table is missing.
    }
  }

  const res = NextResponse.json({ success: true });
  clearWhopOAuthCookies(res.cookies);
  return res;
}
