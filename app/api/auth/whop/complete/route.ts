import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-auth';
import { savePostingIdentity } from '@/lib/posting-identity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = String(body.companyId || '').trim();
    const accessToken = String(body.accessToken || '').trim();
    const refreshToken = String(body.refreshToken || '').trim();
    const expiresIn = Number(body.expiresIn || 3600);

    if (!companyId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing companyId or accessToken' },
        { status: 400 }
      );
    }

    const identity = await savePostingIdentity({
      companyId,
      accessToken,
      refreshToken,
      expiresIn: Number.isFinite(expiresIn) ? expiresIn : 3600,
    });

    return NextResponse.json({
      success: true,
      name: identity.name,
      username: identity.username,
      userId: identity.whop_user_id,
    });
  } catch (err) {
    console.error('[whop-complete]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
