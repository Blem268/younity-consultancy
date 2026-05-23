alter table public.workflow_errors
  add column if not exists resolved_by text null,
  add column if not exists resolution_note text null,
  add column if not exists reopened_at timestamptz null,
  add column if not exists reopened_by text null;

create index if not exists workflow_errors_resolved_idx
  on public.workflow_errors (resolved);

create index if not exists workflow_errors_severity_idx
  on public.workflow_errors (severity);

create index if not exists workflow_errors_source_idx
  on public.workflow_errors (source);

create index if not exists workflow_errors_created_at_idx
  on public.workflow_errors (created_at desc);

-- RLS remains enabled from supabase/workflow_errors.sql.
-- No public/client policies are intentionally added.
