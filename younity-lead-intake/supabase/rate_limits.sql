create extension if not exists "pgcrypto";

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rate_limits_key_window_start_idx
  on public.rate_limits (key, window_start);

create index if not exists rate_limits_expires_at_idx
  on public.rate_limits (expires_at);

alter table public.rate_limits enable row level security;

-- No public/client RLS policies are intentionally defined.
-- This table is accessed only by server-side service-role/admin clients.

create or replace function public.increment_rate_limit(
  p_key text,
  p_window_start timestamptz,
  p_window_seconds integer,
  p_limit integer
)
returns table (
  allowed boolean,
  current_count integer,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_expires_at timestamptz;
begin
  v_expires_at := p_window_start + make_interval(secs => p_window_seconds);

  perform pg_advisory_xact_lock(
    hashtextextended(p_key || ':' || p_window_start::text, 0)
  );

  select rate_limits.count
    into v_count
    from public.rate_limits
    where rate_limits.key = p_key
      and rate_limits.window_start = p_window_start
    for update;

  if v_count is null then
    v_count := 1;

    insert into public.rate_limits (
      key,
      window_start,
      count,
      expires_at
    )
    values (
      p_key,
      p_window_start,
      v_count,
      v_expires_at
    );
  elsif v_count < p_limit then
    v_count := v_count + 1;

    update public.rate_limits
      set count = v_count,
          expires_at = v_expires_at,
          updated_at = now()
      where rate_limits.key = p_key
        and rate_limits.window_start = p_window_start;
  else
    update public.rate_limits
      set updated_at = now()
      where rate_limits.key = p_key
        and rate_limits.window_start = p_window_start;
  end if;

  return query
    select
      v_count <= p_limit as allowed,
      v_count as current_count,
      greatest(p_limit - v_count, 0) as remaining,
      v_expires_at as reset_at;
end;
$$;

-- Cleanup note:
-- Expired rows can be periodically deleted with:
-- delete from public.rate_limits where expires_at < now();
