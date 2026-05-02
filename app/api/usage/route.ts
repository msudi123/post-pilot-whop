import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-auth';
import { getUsageSummary, resolveUsageIdentity } from '@/lib/postpilot-usage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const companyId = String(req.nextUrl.searchParams.get('companyId') || '').trim();
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    const identity = await resolveUsageIdentity(companyId);
    const usage = await getUsageSummary(identity.userId, identity.whopUserId);

    return NextResponse.json({ success: true, usage });
  } catch (err) {
    console.error('[usage]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
