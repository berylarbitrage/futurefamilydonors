-- Optional voice recording in the full application (one per applicant), next
-- to the optional video. Idempotent: safe to run again.
-- Run AFTER 20261119000000_videos.sql.

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png',
      'video/mp4','video/quicktime','video/webm',
      'audio/mpeg','audio/mp4','audio/x-m4a','audio/aac',
      'audio/wav','audio/x-wav','audio/webm','audio/ogg'
    ]
where id = 'donor-photos';

alter table public.photos drop constraint if exists photos_kind_check;
alter table public.photos add constraint photos_kind_check
  check (kind in ('childhood','recent','video','audio'));
