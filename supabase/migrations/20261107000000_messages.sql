-- Coordinator <-> donor messages. Idempotent: safe to run more than once.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  subject text,
  body text not null check (char_length(body) between 1 and 5000),
  author_id uuid references auth.users on delete set null,
  email_status text not null default 'not_sent' check (email_status in ('sent', 'failed', 'not_sent')),
  email_error text,
  read_at timestamptz, -- inbound: when an admin read it; outbound: when the donor read it
  created_at timestamptz not null default now()
);

create index if not exists messages_application_idx on public.messages (application_id, created_at);
create index if not exists messages_unread_inbound_idx on public.messages (application_id)
  where direction = 'inbound' and read_at is null;

alter table public.messages enable row level security;

-- Admins: everything.
drop policy if exists messages_admin_all on public.messages;
create policy messages_admin_all on public.messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Applicants: read their own thread.
drop policy if exists messages_select_own on public.messages;
create policy messages_select_own on public.messages for select to authenticated
  using (public.owns_application(application_id));

-- Applicants: post replies (inbound only, as themselves, on their own application).
drop policy if exists messages_insert_own_reply on public.messages;
create policy messages_insert_own_reply on public.messages for insert to authenticated
  with check (
    public.owns_application(application_id)
    and direction = 'inbound'
    and author_id = auth.uid()
    and email_status = 'not_sent'
    and read_at is null
  );

grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
