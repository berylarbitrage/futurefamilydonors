-- One-time email verification codes (6 digits) for public forms: referral
-- sign-up, applications and the contact form. Only codes' hashes are stored.
-- Idempotent: safe to run again. Run AFTER 20261123000000_message_attachments.sql.

create table if not exists public.email_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('refer', 'apply', 'contact')),
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_codes_lookup_idx on public.email_codes (email, purpose, created_at desc);

-- Server only (service role): no policies, so nobody else can read or write.
alter table public.email_codes enable row level security;
