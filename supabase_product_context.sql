create table if not exists product_context (
  id uuid primary key default gen_random_uuid(),
  company_id text not null unique,
  tagline text,
  what_it_does text,
  who_its_for text,
  key_benefits text,
  price text,
  promo_code text,
  promo_details text,
  product_link text,
  buyer_pain text,
  desired_outcome text,
  biggest_objection text,
  proof_points text,
  cta_preference text,
  target_keywords text,
  whop_company text,
  whop_products text,
  posting_mode text default 'approval',
  signature_template text,
  signature_enabled_default boolean default true,
  default_forum_id text,
  brand_voice text default 'Professional',
  posting_goal text default 'Engagement',
  posting_frequency text default '5 posts/week',
  onboarding_completed boolean default false,
  updated_at timestamptz default now()
);

alter table product_context disable row level security;

alter table product_context add column if not exists buyer_pain text;
alter table product_context add column if not exists desired_outcome text;
alter table product_context add column if not exists biggest_objection text;
alter table product_context add column if not exists proof_points text;
alter table product_context add column if not exists cta_preference text;
alter table product_context add column if not exists target_keywords text;
alter table product_context add column if not exists posting_mode text default 'approval';
alter table product_context add column if not exists signature_template text;
alter table product_context add column if not exists signature_enabled_default boolean default true;
alter table product_context add column if not exists default_forum_id text;
alter table product_context add column if not exists brand_voice text default 'Professional';
alter table product_context add column if not exists posting_goal text default 'Engagement';
alter table product_context add column if not exists posting_frequency text default '5 posts/week';
alter table product_context add column if not exists onboarding_completed boolean default false;

-- Force Supabase/PostgREST to refresh its schema cache after adding columns.
notify pgrst, 'reload schema';

create index if not exists idx_scheduled_posts_due
  on scheduled_posts (company_id, status, scheduled_at);
