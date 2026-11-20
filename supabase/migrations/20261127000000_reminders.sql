-- Automatic reminders: applicants who haven't created their password or
-- finished the full application get a few friendly nudges (logged here so
-- nobody is emailed twice for the same nudge). Idempotent: safe to run again.
-- Run AFTER 20261126000000_reply_tracking.sql.

-- When the applicant last saved anything in the full application.
alter table public.full_applications add column if not exists updated_at timestamptz;
update public.full_applications set updated_at = coalesce(updated_at, submitted_at, now())
  where updated_at is null;
alter table public.full_applications alter column updated_at set default now();

create or replace function public.touch_full_application() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists full_applications_touch on public.full_applications;
create trigger full_applications_touch before update on public.full_applications
  for each row execute function public.touch_full_application();

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind text not null check (kind in ('register', 'finish')),
  sent_at timestamptz not null default now()
);
create index if not exists reminders_application_idx on public.reminders (application_id, kind);

-- Server only (service role): no policies.
alter table public.reminders enable row level security;
