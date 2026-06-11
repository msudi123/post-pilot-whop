import Image from 'next/image';
import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site';

const NAV_LINKS = [
  { href: '/support', label: 'Support' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/billing', label: 'Billing' },
  { href: '/help/credits', label: 'Credits' },
  { href: '/help/posting', label: 'Posting' },
  { href: '/help/postpilot-agent', label: 'Why PostPilot Agent' },
];

export function InfoPageShell({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F8FAFF] px-5 py-8 text-[#0B163F] dark:bg-slate-950 dark:text-slate-100 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="overflow-hidden rounded-2xl shadow-lg shadow-blue-200">
                <Image src="/postpilot-logo.png" alt="PostPilot logo" width={52} height={52} className="h-[52px] w-[52px] object-cover" priority />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0F1E46] dark:text-slate-100">{title}</h1>
              </div>
            </div>
            <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 dark:border-slate-700 dark:bg-blue-950/40 dark:text-blue-200">
              Back to PostPilot
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600 dark:text-slate-300">{summary}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
            <div className="max-w-none space-y-5 text-[15px] leading-7 text-slate-600 dark:text-slate-300 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-[#0F1E46] dark:[&_h2]:text-slate-100 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:pl-1">
              {children}
            </div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Help Links</h2>
              <div className="mt-4 space-y-2">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-200">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">Support Email</h2>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 block text-sm font-bold text-blue-700 dark:text-blue-200">
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Contact support for account access, billing questions, or publishing issues.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
