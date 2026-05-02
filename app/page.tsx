import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCompanyIdFromReferer } from '@/lib/api-auth';
import RootWhopResolver from './RootWhopResolver';

export default function RootPage() {
  const companyId = getCompanyIdFromReferer(headers());

  if (companyId?.startsWith('biz_')) {
    redirect(`/dashboard/${companyId}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    redirect('/dashboard/dev-preview');
  }

  const fallbackCompanyId =
    process.env.POSTPILOT_DEFAULT_COMPANY_ID ||
    process.env.NEXT_PUBLIC_POSTPILOT_DEFAULT_COMPANY_ID ||
    'biz_mBLvrTmiRVTy6h';

  if (fallbackCompanyId.startsWith('biz_')) {
    redirect(`/dashboard/${fallbackCompanyId}`);
  }

  return <RootWhopResolver />;
}
