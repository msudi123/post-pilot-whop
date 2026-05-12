import { headers } from 'next/headers';
import { getWhopSdk } from '@/lib/whop';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: { companyId: string };
}

export default async function DashboardPage({ params }: Props) {
  const { companyId } = params;

  const skipAuth = process.env.SKIP_WHOP_AUTH === 'true' && process.env.NODE_ENV !== 'production';

  let verifiedUserId: string;
  try {
    if (skipAuth) {
      verifiedUserId = 'dev-user';
    } else {
      const token = await getWhopSdk().verifyUserToken(headers());
      verifiedUserId = token.userId;
    }
  } catch {
    return (
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f8fafc',
        }}
      >
        <div style={{ textAlign: 'center', padding: '48px', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
            Access Denied
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Post Pilot must be opened from within the Whop platform.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardClient companyId={companyId} verifiedUserId={verifiedUserId} />;
}
