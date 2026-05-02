import { NextRequest, NextResponse } from 'next/server';
import { getCompanyIdFromReferer, getErrorMessage } from '@/lib/api-auth';
import { getWhopSdk } from '@/lib/whop';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const experienceId = typeof body.experienceId === 'string' ? body.experienceId.trim() : '';
    const companyId =
      (typeof body.companyId === 'string' && body.companyId) ||
      getCompanyIdFromReferer(req.headers);

    if (!experienceId || !companyId) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields: experienceId, companyId' },
        { status: 400 }
      );
    }

    try {
      await getWhopSdk().forumPosts.list({
        experience_id: experienceId,
        first: 1,
      });
      return NextResponse.json({ valid: true });
    } catch (err) {
      return NextResponse.json({
        valid: false,
        error: getErrorMessage(err),
      });
    }
  } catch (err) {
    console.error('[forums/verify]', err);
    return NextResponse.json(
      { valid: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
