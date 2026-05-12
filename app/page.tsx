import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCompanyIdFromReferer } from '@/lib/api-auth';
import RootWhopResolver from './RootWhopResolver';

export default function RootPage() {
  const companyId = getCompanyIdFromReferer(headers());

  if (companyId?.startsWith('biz_')) {
    redirect(`/dashboard/${companyId}`);
  }

  return <RootWhopResolver />;
}
