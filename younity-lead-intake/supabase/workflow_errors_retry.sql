alter table public.workflow_errors
  add column if not exists retryable boolean not null default false,
  add column if not exists retry_status text null,
  add column if not exists retry_attempts integer not null default 0,
  add column if not exists last_retry_at timestamptz null,
  add column if not exists last_retry_by text null,
  add column if not exists last_retry_message text null;

-- RLS remains enabled from supabase/workflow_errors.sql.
-- No public/client policies are intentionally added.
