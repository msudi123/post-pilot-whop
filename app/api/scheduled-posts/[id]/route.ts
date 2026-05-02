import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let bodyCompanyId = '';
    try {
      const body = await req.json();
      bodyCompanyId = typeof body.companyId === 'string' ? body.companyId : '';
    } catch {
      bodyCompanyId = '';
    }

    const companyId = (req.nextUrl.searchParams.get('companyId') || bodyCompanyId || '').trim();
    const id = params.id;

    if (!companyId || !id) {
      return NextResponse.json({ error: 'Missing companyId or id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const existing = await supabase
      .from('scheduled_posts')
      .select('id,company_id,status')
      .eq('id', id)
      .single();

    if (existing.error || !existing.data) {
      throw new Error(existing.error?.message || 'Scheduled post not found');
    }

    if (String(existing.data.company_id || '').trim().toLowerCase() !== companyId.toLowerCase()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id)
      .in('status', ['scheduled', 'draft', 'failed']);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[scheduled-posts/delete]', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
