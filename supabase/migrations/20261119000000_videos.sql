-- Optional self-introduction video in the pre-screen (one per applicant).
-- Idempotent: safe to run again. Run AFTER 20261106000000_init.sql.

-- Allow short videos in the private bucket (50 MB per file).
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','video/mp4','video/quicktime','video/webm']
where id = 'donor-photos';

-- Videos are stored in public.photos with kind = 'video'.
alter table public.photos drop constraint if exists photos_kind_check;
alter table public.photos add constraint photos_kind_check
  check (kind in ('childhood','recent','video'));
