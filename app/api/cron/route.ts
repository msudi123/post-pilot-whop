import { NextRequest, NextResponse } from 'next/server';
import { processDueScheduledPosts } from '@/lib/process-due-posts';
import { getErrorMessage } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processDueScheduledPosts();
    if (result.processed === 0) {
      return NextResponse.json({ message: 'No post due' });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[cron]', err);
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
