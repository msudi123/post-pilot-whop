-- Apply this on an existing production database to satisfy Supabase security lints
-- without changing PostPilot's server-side usage model.

alter table if exists public.posts enable row level security;
alter table if exists public.creators enable row level security;
alter table if exists public.analytics enable row level security;
alter table if exists public.postpilot_usage enable row level security;
alter table if exists public.postpilot_drafts enable row level security;
alter table if exists public.templates enable row level security;
alter table if exists public.scheduled_posts enable row level security;
alter table if exists public.analytics_cache enable row level security;
alter table if exists public.product_context enable row level security;
alter table if exists public.posting_identity enable row level security;
alter table if exists public.forums enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'increment_free_generation_usage'
  ) then
    alter function public.increment_free_generation_usage(text, integer) set search_path = public;
    revoke all on function public.increment_free_generation_usage(text, integer) from public;
    grant execute on function public.increment_free_generation_usage(text, integer) to service_role;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'increment_monthly_generation_usage'
  ) then
    alter function public.increment_monthly_generation_usage(text, integer) set search_path = public;
    revoke all on function public.increment_monthly_generation_usage(text, integer) from public;
    grant execute on function public.increment_monthly_generation_usage(text, integer) to service_role;
  end if;
end
$$;

notify pgrst, 'reload schema';
