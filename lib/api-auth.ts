import { getWhopSdk } from './whop';

export async function verifyCompanyAdmin(companyId: string, headers: Headers) {
  const whopsdk = getWhopSdk();
  const token = await whopsdk.verifyUserToken(headers);
  const access = await whopsdk.users.checkAccess(companyId, { id: token.userId });

  if (access.access_level !== 'admin') {
    throw new Error('Admin access is required');
  }

  return { userId: token.userId, access };
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
