'use client';

import { useEffect } from 'react';
import { createSdk } from '@whop/iframe';

export default function WhopIframeInitializer() {
  useEffect(() => {
    const sdk = createSdk({
      appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
    });

    return () => {
      sdk._cleanupTransport();
    };
  }, []);

  return null;
}
