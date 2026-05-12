create table if not exists scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  forum_id text not null,
  content text not null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled',
  whop_post_id text,
  created_at timestamptz default now()
);

alter table scheduled_posts enable row level security;

-- Add whop_post_id if missing
alter table scheduled_posts add column if not exists whop_post_id text;

-- Add created_at if missing
alter table scheduled_posts add column if not exists created_at timestamptz default now();

-- Add failed_reason to capture error messages
alter table scheduled_posts add column if not exists failed_reason text;

create index if not exists idx_scheduled_posts_company
  on scheduled_posts (company_id, status, scheduled_at);

notify pgrst, 'reload schema';
