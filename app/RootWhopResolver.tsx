'use client';

import { useEffect, useState } from 'react';
import { createSdk } from '@whop/iframe';

function extractCompanyId(value?: string | null) {
  if (!value) return '';
  const match = value.match(/biz_[A-Za-z0-9]+/);
  return match?.[0] || '';
}

export default function RootWhopResolver() {
  const [message, setMessage] = useState('Detecting Whop company...');

  useEffect(() => {
    let cancelled = false;
    const sdk = createSdk({
      appId: process.env.NEXT_PUBLIC_WHOP_APP_ID || undefined,
    });

    async function resolveCompany() {
      try {
        const browserCompanyId =
          extractCompanyId(window.location.href) ||
          extractCompanyId(document.referrer);

        if (browserCompanyId) {
          window.location.replace(`/dashboard/${browserCompanyId}`);
          return;
        }

        const data = await sdk.getTopLevelUrlData({});
        if (cancelled) return;

        const companyId =
          extractCompanyId(data.fullHref) ||
          extractCompanyId(data.baseHref) ||
          extractCompanyId(data.companyRoute);

        if (companyId) {
          window.location.replace(`/dashboard/${companyId}`);
          return;
        }

        setMessage('Whop opened PostPilot, but no biz company id was found in the app context.');
      } catch (err) {
        if (!cancelled) {
          const referrerCompanyId = extractCompanyId(document.referrer);
          if (referrerCompanyId) {
            window.location.replace(`/dashboard/${referrerCompanyId}`);
            return;
          }

          setMessage(
            document.referrer
              ? 'Could not read Whop app context from the iframe SDK or referrer.'
              : 'Could not read Whop app context. The app did not receive a Whop referrer.'
          );
        }
      }
    }

    resolveCompany();

    return () => {
      cancelled = true;
      sdk._cleanupTransport();
    };
  }, []);

  return (
    <div
      style={{
        background: '#080808',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F0F0F0',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Opening PostPilot
        </h1>
        <p style={{ color: '#777777', fontSize: 14, lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
