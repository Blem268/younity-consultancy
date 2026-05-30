-- Priority set by client at request creation (maps from portal urgency: Low, Normal, High)
alter table public.client_requests
  add column if not exists priority text;
