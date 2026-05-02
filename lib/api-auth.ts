import { getWhopSdk } from './whop';
import { getUserAccessToken, type CookieReader } from './whop-oauth';

async function getOAuthUserId(accessToken: string) {
  const res = await fetch('https://api.whop.com/oauth/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Unable to verify connected Whop user');
  }

  const user = await res.json();
  const userId = user.sub || user.id || user.user_id;
  if (!userId) {
    throw new Error('Connected Whop user is missing an id');
  }
  return String(userId);
}

export async function verifyCompanyAdmin(companyId: string, headers: Headers, cookies?: CookieReader) {
  const whopsdk = getWhopSdk();
  let userId = '';

  try {
    const token = await whopsdk.verifyUserToken(headers);
    userId = token.userId;
  } catch (err) {
    const authHeader = headers.get('authorization') || '';
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';
    const accessToken = bearerToken || (cookies ? getUserAccessToken(cookies) : null);
    if (!accessToken) throw err;
    userId = await getOAuthUserId(accessToken);
  }

  const access = await whopsdk.users.checkAccess(companyId, { id: userId });

  if (access.access_level !== 'admin') {
    throw new Error('Admin access is required');
  }

  return { userId, access };
}

export function getErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) {
    return err.message;
  }

  return 'Unexpected error';
}

export function getCompanyIdFromReferer(headers: Headers) {
  const referer = headers.get('referer');
  if (!referer) return null;

  try {
    const pathParts = new URL(referer).pathname.split('/').filter(Boolean);
    const dashboardIndex = pathParts.indexOf('dashboard');
    return dashboardIndex >= 0 ? pathParts[dashboardIndex + 1] ?? null : null;
  } catch {
    return null;
  }
}
