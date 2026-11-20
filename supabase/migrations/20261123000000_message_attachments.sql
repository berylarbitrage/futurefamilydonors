-- Attachments (files and pictures) on portal/admin messages.
-- Idempotent: safe to run again. Run AFTER 20261122000000_documents.sql.

-- Allow common picture and document types in the private bucket
-- (files live under <application id>/attachments/).
update storage.buckets
set allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
      'application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'video/mp4','video/quicktime','video/webm',
      'audio/mpeg','audio/mp4','audio/x-m4a','audio/aac',
      'audio/wav','audio/x-wav','audio/webm','audio/ogg'
    ]
where id = 'donor-photos';

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  -- null while the message is still being written (uploaded, not sent yet)
  message_id uuid references public.messages(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null check (char_length(file_name) <= 200),
  storage_path text not null unique,
  content_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);
create index if not exists message_attachments_message_idx on public.message_attachments(message_id);
create index if not exists message_attachments_application_idx
  on public.message_attachments(application_id);

alter table public.message_attachments enable row level security;

-- Read: the applicant sees attachments on their own sent messages; staff see all.
-- Writes happen only on the server (service role), after checking permissions.
drop policy if exists message_attachments_select on public.message_attachments;
create policy message_attachments_select on public.message_attachments for select to authenticated
  using (
    (message_id is not null and public.owns_application(application_id))
    or public.is_staff()
  );
