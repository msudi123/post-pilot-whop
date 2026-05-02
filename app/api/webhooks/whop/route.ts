import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-auth';
import { applyWhopMembershipUpdate, isConfiguredMembership } from '@/lib/postpilot-usage';
import { getWhopSdk } from '@/lib/whop';

export const dynamic = 'force-dynamic';

const HANDLED_EVENTS = new Set([
  'membership.activated',
  'membership.deactivated',
  'membership.cancel_at_period_end_changed',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers = Object.fromEntries(req.headers);
    const event = getWhopSdk().webhooks.unwrap(body, { headers });

    if (!HANDLED_EVENTS.has(event.type)) {
      return NextResponse.json({ success: true, ignored: true, type: event.type });
    }

    const membership = event.data as {
      id?: string | null;
      user?: { id?: string | null } | null;
      product?: { id?: string | null } | null;
      plan?: { id?: string | null } | null;
      status?: string | null;
      manage_url?: string | null;
      renewal_period_start?: string | null | number;
      renewal_period_end?: string | null | number;
    };

    if (!isConfiguredMembership(membership)) {
      return NextResponse.json({ success: true, ignored: true, reason: 'non_target_membership', type: event.type });
    }

    const usage = await applyWhopMembershipUpdate(membership);
    return NextResponse.json({
      success: true,
      type: event.type,
      userId: membership.user?.id || null,
      membershipId: membership.id || null,
      plan: usage?.plan || null,
      subscription_status: usage?.subscription_status || null,
    });
  } catch (err) {
    console.error('[whop-webhook]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
