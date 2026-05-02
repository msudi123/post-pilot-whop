create table if not exists posting_identity (
  id uuid primary key default gen_random_uuid(),
  company_id text not null unique,
  whop_user_id text,
  name text,
  username text,
  access_token text,
  refresh_token text not null,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table posting_identity disable row level security;

alter table posting_identity
  alter column refresh_token drop not null;

create index if not exists idx_posting_identity_company
  on posting_identity (company_id);

notify pgrst, 'reload schema';
