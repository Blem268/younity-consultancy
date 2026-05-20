create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  company text,
  preferred_contact_method text,
  zoho_lead_id text,
  zoho_contact_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  service text not null,
  status text not null default 'Submitted',
  message text,
  source text default 'Client Portal',
  clickup_task_id text,
  zoho_lead_id text,
  zoho_deal_id text,
  billing_type text,
  estimated_fee numeric(12,2),
  deposit_required numeric(12,2),
  amount_paid numeric(12,2),
  balance_due numeric(12,2),
  invoice_status text default 'Not Ready',
  zoho_books_invoice_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  request_id uuid references public.client_requests(id) on delete set null,
  document_type text not null,
  file_name text not null,
  file_path text not null,
  file_url text,
  notes text,
  status text not null default 'Submitted',
  uploaded_at timestamptz default now()
);

create table if not exists public.client_updates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  request_id uuid references public.client_requests(id) on delete cascade,
  title text not null,
  message text not null,
  created_by text default 'Younity Consultancy',
  created_at timestamptz default now()
);

create table if not exists public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  request_id uuid references public.client_requests(id) on delete set null,
  invoice_number text,
  amount numeric(12,2),
  status text default 'Not Ready',
  due_date date,
  zoho_books_invoice_id text,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
alter table public.client_requests enable row level security;
alter table public.client_documents enable row level security;
alter table public.client_updates enable row level security;
alter table public.client_invoices enable row level security;

create policy "Clients can view their own profile"
  on public.clients
  for select
  using (auth.uid() = user_id);

create policy "Clients can update their own profile"
  on public.clients
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Clients can view their own requests"
  on public.client_requests
  for select
  using (
    exists (
      select 1
      from public.clients
      where clients.id = client_requests.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Clients can view their own documents"
  on public.client_documents
  for select
  using (
    exists (
      select 1
      from public.clients
      where clients.id = client_documents.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Clients can insert their own documents"
  on public.client_documents
  for insert
  with check (
    exists (
      select 1
      from public.clients
      where clients.id = client_documents.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Clients can view their own updates"
  on public.client_updates
  for select
  using (
    exists (
      select 1
      from public.clients
      where clients.id = client_updates.client_id
        and clients.user_id = auth.uid()
    )
  );

create policy "Clients can view their own invoices"
  on public.client_invoices
  for select
  using (
    exists (
      select 1
      from public.clients
      where clients.id = client_invoices.client_id
        and clients.user_id = auth.uid()
    )
  );
