# PostPilot — AI Community Manager for Whop

PostPilot is a Whop-embedded app that generates, schedules, and publishes community content to your Whop forums using AI. It runs exclusively inside the Whop platform.

## What it does

- **Generate** AI-written forum posts tailored to your brand voice and community goals
- **Schedule** posts across a weekly or monthly calendar
- **Publish** directly to your Whop forums via the Whop SDK
- **Analytics** — track engagement (likes, comments) on published posts
- **Templates** — save and reuse post structures that work for your community

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **Platform:** Whop SDK (`@whop/sdk`, `@whop/iframe`)
- **Database:** Supabase (Postgres)
- **AI:** OpenAI
- **Deployment:** Vercel

## Authentication

PostPilot uses Whop's native platform authentication exclusively. When the app is opened inside Whop, the platform injects an `x-whop-user-token` header that is verified server-side via `whopsdk.verifyUserToken()`. No separate login or signup is required.

The app is gated by a Next.js middleware that blocks all `/dashboard/*` routes unless the request originates from within the Whop iframe.

## Project structure

```
app/
  api/                    # API routes (dashboard data, actions, AI generation, cron)
    auth/whop/            # Legacy OAuth endpoints (inactive, kept for reference)
  dashboard/[companyId]/  # Main dashboard — server auth gate + client UI
  page.tsx                # Root entry — extracts companyId from Whop referer
lib/
  whop.ts                 # Whop SDK singleton
  api-auth.ts             # verifyCompanyAdmin helper
  poster.ts               # Forum post publisher
  postpilot-usage.ts      # Usage tracking (free tier / starter plan)
  product-context.ts      # Company brand context read/write
  supabase.ts             # Supabase admin client
middleware.ts             # Whop-only access enforcement
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `WHOP_API_KEY` | Server-side Whop API key |
| `WHOP_APP_ID` | Your Whop app ID |
| `WHOP_WEBHOOK_SECRET` | For verifying Whop webhook payloads |
| `NEXT_PUBLIC_WHOP_APP_ID` | Client-side app ID for iframe SDK |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `OPENAI_API_KEY` | OpenAI API key for content generation |
| `CRON_SECRET` | Secret for protecting the cron endpoint |
| `SKIP_WHOP_AUTH` | Set to `true` for local dev only (never in production) |

## Local development

Since the app requires the Whop iframe context, use one of:

**Option A — Whop tunnel (recommended):**
1. Run `npm run dev`
2. Expose port 3000 with `ngrok http 3000`
3. Set the tunnel URL as your app URL in the Whop developer dashboard
4. Open the app from inside Whop

**Option B — Auth bypass:**
1. Add `SKIP_WHOP_AUTH=true` to `.env.local`
2. Run `npm run dev`
3. Open `http://localhost:3000/dashboard/biz_yourCompanyId`

## Deployment

Deployed via Vercel, connected to the `main` branch of this repository. Pushing to `main` triggers an automatic production deploy.

```bash
git push origin main
```
