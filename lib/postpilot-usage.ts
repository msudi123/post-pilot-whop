import { getSupabaseAdmin } from './supabase';
import { getWhopSdk } from './whop';
import { getPostingIdentity } from './posting-identity';

export type UsageSummary = {
  plan: 'free' | 'starter';
  subscription_status: string;
  free_generation_limit: number;
  free_generations_used: number;
  free_available: number;
  monthly_generation_limit: number;
  monthly_generations_used: number;
  monthly_available: number;
  monthly_usage_period_start: string | null;
  monthly_usage_period_end: string | null;
  can_generate: boolean;
  upgrade_required: boolean;
  limit_reached: boolean;
  whop_manage_url: string | null;
  checkout_url: string;
};

type UsageRow = {
  user_id: string;
  whop_user_id?: string | null;
  plan: 'free' | 'starter';
  subscription_status?: string | null;
  whop_membership_id?: string | null;
  whop_manage_url?: string | null;
  free_generation_limit: number;
  free_generations_used: number;
  monthly_generation_limit: number;
  monthly_generations_used: number;
  monthly_usage_period_start?: string | null;
  monthly_usage_period_end?: string | null;
};

type MembershipLike = {
  id?: string | null;
  status?: string | null;
  manage_url?: string | null;
  renewal_period_start?: string | null | number;
  renewal_period_end?: string | null | number;
  product?: { id?: string | null } | null;
  plan?: { id?: string | null } | null;
  user?: { id?: string | null } | null;
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toWhopTimestamp(value: unknown) {
  if (!value) return null;
  if (typeof value === 'number') return new Date(value > 1e12 ? value : value * 1000);
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return new Date(numeric > 1e12 ? numeric : numeric * 1000);
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return null;
}

function isPaidMembershipStatus(status: unknown) {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'active' || normalized === 'trialing';
}

function getConfiguredProductId() {
  return process.env.POSTPILOT_PRODUCT_ID || '';
}

function getConfiguredPlanId() {
  return process.env.POSTPILOT_PLAN_ID || '';
}

export function isConfiguredMembership(membership: MembershipLike | null | undefined) {
  const productId = getConfiguredProductId();
  const planId = getConfiguredPlanId();
  const memberProductId = String(membership?.product?.id || '');
  const memberPlanId = String(membership?.plan?.id || '');

  if (!productId) return false;
  if (memberProductId !== productId) return false;
  if (planId && memberPlanId !== planId) return false;
  return true;
}

export async function resolveUsageIdentity(companyId: string, whopUserId?: string | null) {
  if (whopUserId) return { userId: whopUserId, whopUserId };
  const identity = await getPostingIdentity(companyId).catch(() => null);
  const resolvedWhopUserId = identity?.whop_user_id || '';
  return {
    userId: resolvedWhopUserId || companyId,
    whopUserId: resolvedWhopUserId || null,
  };
}

export async function getOrCreateUsage(userId: string, whopUserId?: string | null) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('postpilot_usage')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError && !existingError.message.toLowerCase().includes('does not exist')) {
    throw new Error(`usage lookup failed: ${existingError.message}`);
  }

  if (existing) return existing as UsageRow;

  const { data, error } = await supabase
    .from('postpilot_usage')
    .insert({
      user_id: userId,
      whop_user_id: whopUserId || null,
      plan: 'free',
      subscription_status: 'free',
      free_generation_limit: 7,
      free_generations_used: 0,
      monthly_generation_limit: 300,
      monthly_generations_used: 0,
    })
    .select('*')
    .single();

  if (error) throw new Error(`usage create failed: ${error.message}`);
  return data as UsageRow;
}

async function findActiveWhopMembership(whopUserId?: string | null): Promise<any | null | undefined> {
  const productId = getConfiguredProductId();
  const planId = getConfiguredPlanId();
  if (!productId || !whopUserId) return null;

  try {
    const query: Record<string, unknown> = {
      product_ids: [productId],
      user_ids: [whopUserId],
      statuses: ['active', 'trialing'],
      first: 20,
    };
    if (planId) query.plan_ids = [planId];

    for await (const membership of getWhopSdk().memberships.list(query as any)) {
      if (isConfiguredMembership(membership as MembershipLike) && isPaidMembershipStatus((membership as any).status)) {
        return membership as MembershipLike;
      }
    }
  } catch (error) {
    console.warn('[postpilot-usage] Whop membership check failed:', error instanceof Error ? error.message : error);
    return undefined;
  }

  return null;
}

async function updateUsageToFree(userId: string, whopUserId?: string | null, usage?: UsageRow | null) {
  const { data, error } = await getSupabaseAdmin()
    .from('postpilot_usage')
    .update({
      whop_user_id: whopUserId || usage?.whop_user_id || null,
      plan: 'free',
      subscription_status: 'free',
      whop_membership_id: null,
      whop_manage_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw new Error(`usage subscription update failed: ${error.message}`);
  return data as UsageRow;
}

async function updateUsageToStarter(userId: string, whopUserId: string | null | undefined, membership: MembershipLike, usage?: UsageRow | null) {
  const now = new Date();
  const periodStart =
    toWhopTimestamp(membership.renewal_period_start) ||
    (usage?.monthly_usage_period_start ? new Date(usage.monthly_usage_period_start) : now);
  const periodEnd =
    toWhopTimestamp(membership.renewal_period_end) ||
    (usage?.monthly_usage_period_end ? new Date(usage.monthly_usage_period_end) : addMonths(periodStart, 1));
  const periodExpired = usage?.monthly_usage_period_end ? now > new Date(usage.monthly_usage_period_end) : false;

  const payload = {
    user_id: userId,
    whop_user_id: whopUserId || usage?.whop_user_id || null,
    plan: 'starter' as const,
    subscription_status: membership.status || 'active',
    whop_membership_id: membership.id || null,
    whop_manage_url: membership.manage_url || null,
    free_generation_limit: usage?.free_generation_limit ?? 7,
    free_generations_used: usage?.free_generations_used ?? 0,
    monthly_generation_limit: usage?.monthly_generation_limit ?? 300,
    monthly_generations_used: periodExpired ? 0 : usage?.monthly_generations_used ?? 0,
    monthly_usage_period_start: periodExpired ? now.toISOString() : periodStart.toISOString(),
    monthly_usage_period_end: periodExpired ? addMonths(now, 1).toISOString() : periodEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  const query = getSupabaseAdmin()
    .from('postpilot_usage')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();
  const { data, error } = await query;
  if (error) throw new Error(`usage subscription update failed: ${error.message}`);
  return data as UsageRow;
}

export async function applyWhopMembershipUpdate(membership: MembershipLike | null | undefined) {
  const whopUserId = String(membership?.user?.id || '').trim();
  if (!whopUserId || !isConfiguredMembership(membership)) return null;
  if (!membership) return null;

  const usage = await getOrCreateUsage(whopUserId, whopUserId);
  if (!isPaidMembershipStatus(membership?.status)) {
    return updateUsageToFree(whopUserId, whopUserId, usage);
  }

  return updateUsageToStarter(whopUserId, whopUserId, membership, usage);
}

export async function syncSubscriptionStatus(userId: string, whopUserId?: string | null) {
  const usage = await getOrCreateUsage(userId, whopUserId);
  const membership = await findActiveWhopMembership(whopUserId);

  if (membership === undefined) {
    return usage;
  }

  if (!membership) {
    return updateUsageToFree(userId, whopUserId, usage);
  }

  return updateUsageToStarter(userId, whopUserId, membership, usage);
}

export async function getUsageSummary(userId: string, whopUserId?: string | null): Promise<UsageSummary> {
  const usage = await syncSubscriptionStatus(userId, whopUserId);
  const freeAvailable = Math.max(0, Number(usage.free_generation_limit || 7) - Number(usage.free_generations_used || 0));
  const monthlyAvailable = Math.max(0, Number(usage.monthly_generation_limit || 300) - Number(usage.monthly_generations_used || 0));
  const isStarter = usage.plan === 'starter';

  return {
    plan: usage.plan,
    subscription_status: usage.subscription_status || (isStarter ? 'active' : 'free'),
    free_generation_limit: Number(usage.free_generation_limit || 7),
    free_generations_used: Number(usage.free_generations_used || 0),
    free_available: freeAvailable,
    monthly_generation_limit: Number(usage.monthly_generation_limit || 300),
    monthly_generations_used: Number(usage.monthly_generations_used || 0),
    monthly_available: monthlyAvailable,
    monthly_usage_period_start: usage.monthly_usage_period_start || null,
    monthly_usage_period_end: usage.monthly_usage_period_end || null,
    can_generate: isStarter ? monthlyAvailable > 0 : freeAvailable > 0,
    upgrade_required: !isStarter && freeAvailable <= 0,
    limit_reached: isStarter ? monthlyAvailable <= 0 : freeAvailable <= 0,
    whop_manage_url: usage.whop_manage_url || null,
    checkout_url: process.env.POSTPILOT_CHECKOUT_URL || '',
  };
}

export async function canGeneratePosts(userId: string, whopUserId: string | null | undefined, requestedCount: number) {
  const summary = await getUsageSummary(userId, whopUserId);
  const count = Math.max(1, Number(requestedCount) || 1);
  if (summary.plan === 'starter') {
    return {
      allowed: count <= summary.monthly_available,
      reason: count <= summary.monthly_available ? null : 'monthly_limit_reached',
      summary,
    };
  }
  return {
    allowed: count <= summary.free_available,
    reason: count <= summary.free_available ? null : 'upgrade_required',
    summary,
  };
}

export async function consumeGenerationCredits(userId: string, whopUserId: string | null | undefined, count: number) {
  const summary = await getUsageSummary(userId, whopUserId);
  const fn = summary.plan === 'starter' ? 'increment_monthly_generation_usage' : 'increment_free_generation_usage';
  const { data, error } = await getSupabaseAdmin().rpc(fn, {
    p_user_id: userId,
    p_count: count,
  });
  if (error) throw new Error(`usage increment failed: ${error.message}`);
  if (data !== true) {
    throw new Error(summary.plan === 'starter' ? 'monthly_limit_reached' : 'upgrade_required');
  }
  return getUsageSummary(userId, whopUserId);
}

export function usageErrorMessage(reason: string | null | undefined, summary: UsageSummary, requestedCount: number) {
  if (reason === 'monthly_limit_reached') {
    return `You only have ${summary.monthly_available} AI-generated posts remaining this month.`;
  }
  if (summary.free_available === 0) {
    return 'You have used your 7 free AI-generated posts. Upgrade to PostPilot Starter for $19/month to keep generating Whop content.';
  }
  return `You only have ${summary.free_available} free AI-generated posts remaining. Generate ${Math.min(summary.free_available, requestedCount)} posts or upgrade to Starter.`;
}

export async function createDraftRows(params: {
  userId: string;
  whopUserId?: string | null;
  companyId: string;
  forumId?: string | null;
  drafts: Array<{ title?: string; content: string; generation_credit_count?: number; parent_draft_id?: string | null }>;
}) {
  if (params.drafts.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .from('postpilot_drafts')
    .insert(
      params.drafts.map((draft) => ({
        user_id: params.userId,
        whop_user_id: params.whopUserId || null,
        company_id: params.companyId,
        whop_forum_id: params.forumId || null,
        experience_id: params.forumId || null,
        title: draft.title || null,
        content: draft.content,
        status: 'draft',
        generation_credit_count: draft.generation_credit_count || 1,
        parent_draft_id: draft.parent_draft_id || null,
        free_regeneration_used: false,
      }))
    )
    .select('*');
  if (error) throw new Error(`draft create failed: ${error.message}`);
  return data || [];
}
