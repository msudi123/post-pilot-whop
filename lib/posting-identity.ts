import { getSupabaseAdmin } from './supabase';
import { supabaseRestFetch } from './supabase-rest';

export type PostingIdentity = {
  company_id: string;
  whop_user_id?: string | null;
  name?: string | null;
  username?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
};

type WhopUserInfo = {
  sub?: string;
  id?: string;
  user_id?: string;
  name?: string;
  preferred_username?: string;
};

export async function getWhopUserInfo(accessToken: string): Promise<WhopUserInfo> {
  const res = await fetch('https://api.whop.com/oauth/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Whop user info: ${res.status}`);
  }

  return res.json();
}

export async function savePostingIdentity(params: {
  companyId: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}) {
  const user = await getWhopUserInfo(params.accessToken).catch(() => ({} as WhopUserInfo));
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString();
  const supabase = getSupabaseAdmin();

  const row = {
    company_id: params.companyId,
    whop_user_id: user.sub || user.id || user.user_id || '',
    name: user.name || '',
    username: user.preferred_username || '',
    access_token: params.accessToken,
    refresh_token: params.refreshToken || null,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('posting_identity')
    .upsert(row, { onConflict: 'company_id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(`posting_identity upsert failed: ${error.message}`);
  }

  return data as PostingIdentity;
}

export async function getPostingIdentity(companyId: string) {
  try {
    const rows = await supabaseRestFetch<PostingIdentity[]>('posting_identity', {
      select: '*',
      company_id: `eq.${companyId}`,
      limit: 1,
    });

    return rows[0] || null;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('does not exist') || message.includes('schema cache')) {
      return null;
    }
    throw error;
  }
}
