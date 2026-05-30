-- Wipe client workflow data (keeps clients, admins, auth users).
-- Run in Supabase SQL Editor. Order respects foreign keys.

delete from public.workflow_errors
where related_request_id is not null
   or related_client_id is not null;

delete from public.client_updates;
delete from public.client_documents;
delete from public.client_invoices;
delete from public.client_requests;
