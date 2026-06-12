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
  const message = err instanceof Error ? err.message.trim() : '';
  const normalized = message.toLowerCase();

  if (!message) {
    return 'Something went wrong. Please try again.';
  }

  // Keep direct validation and action guidance that already reads well for users.
  if (
    normalized.startsWith('missing ') ||
    normalized.startsWith('choose ') ||
    normalized.startsWith('no ') ||
    normalized.includes('future date') ||
    normalized.includes('upgrade to postpilot') ||
    normalized.includes('free ai-generated posts') ||
    normalized.includes('starter includes') ||
    normalized.includes('draft not found') ||
    normalized.includes('scheduled post not found') ||
    normalized.includes('forum is synced')
  ) {
    return message;
  }

  if (normalized.includes('admin access is required')) {
    return 'You need admin access to manage this workspace.';
  }

  if (
    normalized.includes('unauthorized') ||
    normalized.includes('verifyusertoken') ||
    normalized.includes('x-whop-user-token')
  ) {
    return 'Please reopen Post Pilot from your workspace and try again.';
  }

  if (
    normalized.includes('429') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('insufficient_quota')
  ) {
    return 'AI writing is temporarily unavailable right now. Please try again in a few minutes.';
  }

  if (
    normalized.includes('openai') ||
    normalized.includes('api key') ||
    normalized.includes('invalid_api_key')
  ) {
    return 'AI writing is temporarily unavailable right now. Please try again later.';
  }

  if (
    normalized.includes('forum:post:create') ||
    normalized.includes('not fully authorized')
  ) {
    return 'Post Pilot needs posting permission before it can publish in this forum. Reinstall or re-approve the app, then try again.';
  }

  if (normalized.includes('forum:read permission')) {
    return 'Analytics is not ready yet because forum read access has not been enabled for this app.';
  }

  return 'Something went wrong. Please try again.';
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
