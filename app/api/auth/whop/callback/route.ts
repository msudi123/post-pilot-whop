import { NextRequest, NextResponse } from 'next/server';
import { WHOP_OAUTH_COOKIE, cookieOptions, getWhopOAuthClientId } from '@/lib/whop-oauth';
import { savePostingIdentity } from '@/lib/posting-identity';

export const dynamic = 'force-dynamic';

function resultPage(
  status: string,
  desc = '',
  returnTo = '/dashboard',
  session?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    name?: string;
    username?: string;
    userId?: string;
  }
) {
  const payload = JSON.stringify({
    type: 'whop_oauth_complete',
    status,
    error: desc,
    session,
  });
  const response = new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
  var payload = ${payload};
  var storageValue = payload.session && payload.session.accessToken
    ? JSON.stringify(payload.session)
    : '';

  function persistSession(target) {
    if (!storageValue) return;
    try {
      target.localStorage.setItem('postpilot_whop_oauth', storageValue);
    } catch (e) {}
  }

  if (window.opener) {
    try { persistSession(window.opener); } catch(e) {}
    try { window.opener.postMessage(payload, '*'); } catch(e) {}
    window.close();
  } else {
    persistSession(window);
    var p = new URLSearchParams({ whopAuth: payload.status });
    if (payload.error) p.set('oauthDescription', payload.error);
    window.location.replace(${JSON.stringify(returnTo)} + '?' + p.toString());
  }
</script>
</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );

  if (session?.accessToken && session.expiresAt) {
    const maxAge = Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000));
    response.cookies.set(WHOP_OAUTH_COOKIE.accessToken, session.accessToken, cookieOptions(maxAge));
    response.cookies.set(WHOP_OAUTH_COOKIE.expiresAt, String(session.expiresAt), cookieOptions(maxAge));
    response.cookies.set(WHOP_OAUTH_COOKIE.userName, session.name || session.username || '', cookieOptions(maxAge));
    response.cookies.set(WHOP_OAUTH_COOKIE.userUsername, session.username || '', cookieOptions(maxAge));
    response.cookies.set(WHOP_OAUTH_COOKIE.userId, session.userId || '', cookieOptions(maxAge));
  }

  if (session?.refreshToken) {
    response.cookies.set(WHOP_OAUTH_COOKIE.refreshToken, session.refreshToken, cookieOptions(60 * 60 * 24 * 30));
  }

  return response;
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  if (error) return resultPage('error', errorDesc || error);
  if (!code || !state) return resultPage('invalid', 'Missing code or state');

  // The state parameter contains verifier, companyId, returnTo — decode it directly.
  // This avoids cookie reliability issues in popup/iframe contexts.
  let stateData: { verifier?: string; companyId?: string; returnTo?: string; nonce?: string };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return resultPage('invalid', 'Could not decode state');
  }

  const { verifier, companyId, returnTo: _returnTo } = stateData;
  const returnTo = typeof _returnTo === 'string' && _returnTo.trim() ? _returnTo.trim() : (companyId ? `/dashboard/${companyId}` : '/dashboard');
  if (!verifier || !companyId) {
    return resultPage('invalid', 'State missing verifier or companyId', returnTo);
  }

  const clientId = getWhopOAuthClientId();
  const redirectUri = `${origin}/api/auth/whop/callback`;

  // Public PKCE client: client_secret is not required — the code_verifier is the proof.
  // If WHOP_CLIENT_SECRET is set AND is not an app API key (apik_...), include it.
  const rawSecret = process.env.WHOP_CLIENT_SECRET || '';
  const useSecret = rawSecret && !rawSecret.startsWith('apik_');

  const tokenParams: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  };
  if (useSecret) tokenParams.client_secret = rawSecret;

  const tokenRes = await fetch('https://api.whop.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    cache: 'no-store',
    body: new URLSearchParams(tokenParams).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    const desc = err.error_description || err.error || String(tokenRes.status);
    console.error('[whop-callback] token exchange failed', tokenRes.status);
    return resultPage('token', desc, returnTo);
  }

  const tokens = await tokenRes.json();
  const expiresIn = Number(tokens.expires_in || 3600);

  let identity;
  try {
    identity = await savePostingIdentity({
      companyId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresIn,
    });
  } catch (err) {
    return resultPage('identity_error', err instanceof Error ? err.message : 'identity save failed', returnTo);
  }

  return resultPage('connected', '', returnTo, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || '',
    expiresAt: Date.now() + expiresIn * 1000,
    name: identity?.name || '',
    username: identity?.username || '',
    userId: identity?.whop_user_id || '',
  });
}
