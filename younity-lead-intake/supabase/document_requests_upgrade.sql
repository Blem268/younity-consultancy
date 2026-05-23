alter table public.client_documents
  add column if not exists requested_by text null,
  add column if not exists requested_at timestamptz null,
  add column if not exists reviewed_by text null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists review_note text null,
  add column if not exists required boolean not null default false;

create index if not exists client_documents_client_id_idx
  on public.client_documents (client_id);

create index if not exists client_documents_request_id_idx
  on public.client_documents (request_id);

create index if not exists client_documents_status_idx
  on public.client_documents (status);

create index if not exists client_documents_required_idx
  on public.client_documents (required);
