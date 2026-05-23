create extension if not exists "pgcrypto";

create table if not exists public.clickup_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_name text,
  clickup_task_id text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.clickup_webhook_events enable row level security;
