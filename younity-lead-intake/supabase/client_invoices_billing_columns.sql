-- Columns used by auto-draft invoice creation and Zoho sync
alter table public.client_invoices
  add column if not exists billing_type text;

alter table public.client_invoices
  add column if not exists notes text;

alter table public.client_invoices
  add column if not exists updated_at timestamptz default now();
