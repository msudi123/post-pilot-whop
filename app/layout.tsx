import type { Metadata } from 'next';
import WhopIframeInitializer from './WhopIframeInitializer';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostPilot',
  description: 'AI-powered content scheduler for Whop communities',
  icons: {
    icon: '/postpilot-logo.png',
    apple: '/postpilot-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WhopIframeInitializer />
        {children}
      </body>
    </html>
  );
}
