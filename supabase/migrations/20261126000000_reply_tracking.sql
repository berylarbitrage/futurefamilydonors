-- "Waiting for your reply": an applicant's message stays flagged until staff
-- reply, or mark it "No reply needed" (this column).
-- Idempotent: safe to run again. Run AFTER 20261125000000_translations.sql.

alter table public.messages add column if not exists no_reply_needed_at timestamptz;
create index if not exists messages_awaiting_idx on public.messages (application_id, created_at desc);
