-- Cache for the website's AI translations (Language menu). One row per
-- English text and language, so each text is translated only once.
-- Idempotent: safe to run again. Run AFTER 20261124000000_email_codes.sql.

create table if not exists public.translations (
  lang text not null,
  source_hash text not null,
  source text not null,
  translated text not null,
  created_at timestamptz not null default now(),
  primary key (lang, source_hash)
);
create index if not exists translations_created_idx on public.translations (created_at);

-- Server only (service role): no policies.
alter table public.translations enable row level security;
