create table if not exists postpilot_usage (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  whop_user_id text,
  plan text not null default 'free',
  subscription_status text default 'free',
  whop_membership_id text,
  whop_manage_url text,
  free_generation_limit integer not null default 7,
  free_generations_used integer not null default 0,
  monthly_generation_limit integer not null default 300,
  monthly_generations_used integer not null default 0,
  monthly_usage_period_start timestamptz,
  monthly_usage_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint postpilot_usage_free_nonnegative check (free_generations_used >= 0 and free_generation_limit >= 0),
  constraint postpilot_usage_monthly_nonnegative check (monthly_generations_used >= 0 and monthly_generation_limit >= 0),
  constraint postpilot_usage_plan_check check (plan in ('free', 'starter'))
);

create table if not exists postpilot_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  whop_user_id text,
  company_id text,
  whop_forum_id text,
  experience_id text,
  title text,
  content text not null,
  status text not null default 'draft',
  generation_credit_count integer not null default 1,
  free_regeneration_used boolean not null default false,
  parent_draft_id uuid references postpilot_drafts(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint postpilot_drafts_status_check check (status in ('draft', 'scheduled', 'published', 'failed', 'canceled'))
);

alter table scheduled_posts add column if not exists generation_credit_count integer default 1;
alter table scheduled_posts add column if not exists free_regeneration_used boolean default false;
alter table scheduled_posts add column if not exists parent_draft_id uuid;
alter table scheduled_posts add column if not exists postpilot_draft_id uuid;

create index if not exists idx_postpilot_drafts_user_id on postpilot_drafts(user_id);
create index if not exists idx_postpilot_drafts_company_id on postpilot_drafts(company_id);

create or replace function increment_free_generation_usage(p_user_id text, p_count integer)
returns boolean
language plpgsql
security definer
as $$
declare
  updated_count integer;
begin
  if p_count <= 0 then
    return true;
  end if;

  update postpilot_usage
  set free_generations_used = free_generations_used + p_count,
      updated_at = now()
  where user_id = p_user_id
    and free_generations_used + p_count <= free_generation_limit;

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

create or replace function increment_monthly_generation_usage(p_user_id text, p_count integer)
returns boolean
language plpgsql
security definer
as $$
declare
  updated_count integer;
begin
  if p_count <= 0 then
    return true;
  end if;

  update postpilot_usage
  set monthly_generations_used = monthly_generations_used + p_count,
      updated_at = now()
  where user_id = p_user_id
    and monthly_generations_used + p_count <= monthly_generation_limit;

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

alter table postpilot_usage enable row level security;
alter table postpilot_drafts enable row level security;

alter function public.increment_free_generation_usage(text, integer) set search_path = public;
alter function public.increment_monthly_generation_usage(text, integer) set search_path = public;

revoke all on function public.increment_free_generation_usage(text, integer) from public;
revoke all on function public.increment_monthly_generation_usage(text, integer) from public;
grant execute on function public.increment_free_generation_usage(text, integer) to service_role;
grant execute on function public.increment_monthly_generation_usage(text, integer) to service_role;

notify pgrst, 'reload schema';
