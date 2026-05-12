import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/dashboard')) return NextResponse.next();

  if (process.env.SKIP_WHOP_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const hasWhopToken = req.headers.has('x-whop-user-token');
  const referer = req.headers.get('referer') || '';
  const hasWhopReferer = referer.includes('whop.com') || referer.includes('whop.dev');

  if (!hasWhopToken && !hasWhopReferer) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Access Denied</title><style>
        body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;}
        .box{text-align:center;padding:48px;max-width:400px;}
        h1{font-size:1.5rem;font-weight:700;color:#0f172a;margin:0 0 12px;}
        p{color:#64748b;font-size:0.95rem;line-height:1.6;margin:0;}
      </style></head><body>
        <div class="box">
          <h1>Access Denied</h1>
          <p>Post Pilot must be opened from within the Whop platform.</p>
        </div>
      </body></html>`,
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
