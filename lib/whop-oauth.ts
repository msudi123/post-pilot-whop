import { createHash, randomBytes } from 'crypto';
import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';

export type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export const WHOP_OAUTH_COOKIE = {
  state: 'postpilot_whop_oauth_state',
  verifier: 'postpilot_whop_oauth_verifier',
  companyId: 'postpilot_whop_oauth_company',
  returnTo: 'postpilot_whop_oauth_return',
  accessToken: 'postpilot_whop_user_access',
  refreshToken: 'postpilot_whop_user_refresh',
  expiresAt: 'postpilot_whop_user_expires',
  userName: 'postpilot_whop_user_name',
  userUsername: 'postpilot_whop_user_username',
  userId: 'postpilot_whop_user_id',
};

export type WhopOAuthUser = {
  connected: boolean;
  name?: string;
  username?: string;
  userId?: string;
};

export function getWhopOAuthClientId() {
  return (
    process.env.WHOP_OAUTH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_WHOP_OAUTH_CLIENT_ID ||
    process.env.WHOP_APP_ID ||
    ''
  );
}

export function base64url(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function randomOAuthString(bytes = 32) {
  return base64url(randomBytes(bytes));
}

export function codeChallenge(verifier: string) {
  return base64url(createHash('sha256').update(verifier).digest());
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
    maxAge,
  };
}

export function getUserAccessToken(cookies: CookieReader) {
  const token = cookies.get(WHOP_OAUTH_COOKIE.accessToken)?.value || '';
  const expiresAt = Number(cookies.get(WHOP_OAUTH_COOKIE.expiresAt)?.value || 0);
  if (!token) return null;
  if (expiresAt && Date.now() > expiresAt - 60_000) return null;
  return token;
}

export function clearWhopOAuthCookies(cookies: ResponseCookies) {
  for (const key of Object.values(WHOP_OAUTH_COOKIE)) {
    cookies.set(key, '', { path: '/', maxAge: 0, secure: true, sameSite: 'none' });
  }
}
