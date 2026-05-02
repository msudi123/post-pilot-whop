import { NextRequest, NextResponse } from 'next/server';
import { WHOP_OAUTH_COOKIE, getUserAccessToken } from '@/lib/whop-oauth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const token = bearerToken || getUserAccessToken(req.cookies);
  const cachedName = req.cookies.get(WHOP_OAUTH_COOKIE.userName)?.value || '';
  const cachedUsername = req.cookies.get(WHOP_OAUTH_COOKIE.userUsername)?.value || '';
  const cachedUserId = req.cookies.get(WHOP_OAUTH_COOKIE.userId)?.value || '';

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const res = await fetch('https://api.whop.com/oauth/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({
        connected: true,
        name: cachedName,
        username: cachedUsername,
        userId: cachedUserId,
      });
    }

    const user = await res.json();
    return NextResponse.json({
      connected: true,
      name: user.name || cachedName,
      username: user.preferred_username || cachedUsername,
      userId: user.sub || cachedUserId,
    });
  } catch {
    return NextResponse.json({
      connected: true,
      name: cachedName,
      username: cachedUsername,
      userId: cachedUserId,
    });
  }
}
