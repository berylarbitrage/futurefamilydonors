-- One-time "create your password" links, used when staff move an applicant to
-- the next step and when admins invite team members.
-- Only a sha256 hash of each link's secret is stored. Idempotent.

create table if not exists public.account_setup_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users on delete cascade,
  purpose text not null check (purpose in ('applicant', 'team')),
  next_path text not null default '/portal',
  application_id uuid references public.applications on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists account_setup_tokens_user_idx on public.account_setup_tokens (user_id);

-- No policies: only the server (service role) can read or write these.
alter table public.account_setup_tokens enable row level security;
