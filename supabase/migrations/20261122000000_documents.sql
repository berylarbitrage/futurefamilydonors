-- Optional supporting documents in the full application (degree, medical and
-- genetic reports, etc.). Applicants can add them before or after submitting.
-- Idempotent: safe to run again. Run AFTER 20261121000000_audio.sql.

-- Allow PDFs in the private bucket (files live under <application id>/docs/).
update storage.buckets
set allowed_mime_types = array[
      'image/jpeg','image/png','application/pdf',
      'video/mp4','video/quicktime','video/webm',
      'audio/mpeg','audio/mp4','audio/x-m4a','audio/aac',
      'audio/wav','audio/x-wav','audio/webm','audio/ogg'
    ]
where id = 'donor-photos';

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  doc_type text not null,
  file_name text not null check (char_length(file_name) <= 200),
  storage_path text not null unique,
  content_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);
create index if not exists documents_application_idx on public.documents(application_id);

alter table public.documents enable row level security;

-- Applicants see/add/remove their own; staff can see all; admins can remove.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using (public.owns_application(application_id) or public.is_staff());
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated
  with check (public.owns_application(application_id));
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete to authenticated
  using (public.owns_application(application_id) or public.is_admin());
