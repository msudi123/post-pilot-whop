import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = await getWhopSdk().verifyUserToken(req.headers);
    return NextResponse.json({ connected: true, userId: token.userId });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
