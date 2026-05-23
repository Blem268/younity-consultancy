create extension if not exists "pgcrypto";

create table if not exists public.workflow_errors (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  severity text not null default 'error',
  message text not null,
  context jsonb,
  related_client_id uuid null,
  related_request_id uuid null,
  related_document_id uuid null,
  resolved boolean not null default false,
  resolved_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists workflow_errors_created_at_idx
  on public.workflow_errors (created_at desc);

create index if not exists workflow_errors_source_idx
  on public.workflow_errors (source);

create index if not exists workflow_errors_resolved_idx
  on public.workflow_errors (resolved);

create index if not exists workflow_errors_related_client_id_idx
  on public.workflow_errors (related_client_id);

create index if not exists workflow_errors_related_request_id_idx
  on public.workflow_errors (related_request_id);

alter table public.workflow_errors enable row level security;

-- No public/client RLS policies are intentionally defined.
-- This table is accessed only by server-side service-role/admin clients
-- and protected internal admin pages.
