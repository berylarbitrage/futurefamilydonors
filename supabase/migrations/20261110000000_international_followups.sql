-- International applicants + pre-screen follow-up answers.
-- Idempotent: safe to run again.

alter table public.applications add column if not exists country text not null default 'United States';
alter table public.applications add column if not exists region text;      -- state / province (non-US)
alter table public.applications add column if not exists city text;
alter table public.applications add column if not exists postal_code text;
-- Follow-up answers to Yes/No pre-screen questions (e.g. previous donations).
alter table public.applications add column if not exists prescreen_details jsonb not null default '{}';

-- State / ZIP are only collected for U.S. applicants now.
alter table public.applications alter column state drop not null;
alter table public.applications alter column zip drop not null;

create index if not exists applications_country_idx on public.applications (country);
