import { NextRequest, NextResponse } from 'next/server';
import {
  WHOP_OAUTH_COOKIE,
  codeChallenge,
  cookieOptions,
  getWhopOAuthClientId,
  randomOAuthString,
} from '@/lib/whop-oauth';

export const dynamic = 'force-dynamic';

function getOAuthScopes() {
  return 'openid profile forum:post:create forum:read forum:moderate';
}

function encodeState(payload: Record<string, string>) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export async function GET(req: NextRequest) {
  const clientId = getWhopOAuthClientId();
  const companyId = req.nextUrl.searchParams.get('companyId') || '';
  const returnTo =
    req.nextUrl.searchParams.get('returnTo') ||
    (companyId ? `/dashboard/${companyId}` : '/');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing WHOP_OAUTH_CLIENT_ID or WHOP_APP_ID' },
      { status: 500 }
    );
  }

  const verifier = randomOAuthString(32);
  const nonceState = randomOAuthString(16);
  const state = encodeState({
    nonce: nonceState,
    companyId,
    returnTo,
    verifier,
  });
  const nonce = randomOAuthString(16);
  const redirectUri = `${req.nextUrl.origin}/api/auth/whop/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: getOAuthScopes(),
    state,
    nonce,
    code_challenge: codeChallenge(verifier),
    code_challenge_method: 'S256',
  });

  if (companyId) params.set('company_id', companyId);
  const authorizeUrl = `https://api.whop.com/oauth/authorize?${params.toString()}`;

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(WHOP_OAUTH_COOKIE.state, state, cookieOptions(10 * 60));
  res.cookies.set(WHOP_OAUTH_COOKIE.verifier, verifier, cookieOptions(10 * 60));
  res.cookies.set(WHOP_OAUTH_COOKIE.companyId, companyId, cookieOptions(10 * 60));
  res.cookies.set(WHOP_OAUTH_COOKIE.returnTo, returnTo, cookieOptions(10 * 60));
  return res;
}
