import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
  AdminCard,
  EmptyCard,
  formatDateTime,
  InternalPage,
  logInternalQueryError,
  sanitizeSearchParam,
} from "../internal-ui";

type PageProps = {
  searchParams: Promise<{
    search?: string | string[];
  }>;
};

type ClientRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferred_contact_method: string | null;
  created_at: string | null;
};

type CountRecord = {
  client_id: string | null;
};

function countByClient(records: CountRecord[]) {
  const counts = new Map<string, number>();

  for (const record of records) {
    if (record.client_id) {
      counts.set(record.client_id, (counts.get(record.client_id) ?? 0) + 1);
    }
  }

  return counts;
}

export default async function InternalClientsPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Internal Clients" />;
  }

  const params = await searchParams;
  const search = sanitizeSearchParam(params.search);
  const supabaseAdmin = createAdminClient();

  let clientsQuery = supabaseAdmin
    .from("clients")
    .select("id, full_name, email, phone, company, preferred_contact_method, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    clientsQuery = clientsQuery.or(
      `full_name.ilike.*${search}*,email.ilike.*${search}*,company.ilike.*${search}*`
    );
  }

  const { data: clientsData, error: clientsError } =
    await clientsQuery.returns<ClientRecord[]>();

  if (clientsError) {
    logInternalQueryError("Internal clients lookup", clientsError);
  }

  const clients = clientsData ?? [];
  const clientIds = clients.map((client) => client.id);
  const [requestCountsResult, documentCountsResult] = clientIds.length
    ? await Promise.all([
        supabaseAdmin
          .from("client_requests")
          .select("client_id")
          .in("client_id", clientIds)
          .returns<CountRecord[]>(),
        supabaseAdmin
          .from("client_documents")
          .select("client_id")
          .in("client_id", clientIds)
          .returns<CountRecord[]>(),
      ])
    : [
        { data: [] as CountRecord[], error: null },
        { data: [] as CountRecord[], error: null },
      ];

  if (requestCountsResult.error) {
    logInternalQueryError("Internal client request counts", requestCountsResult.error);
  }

  if (documentCountsResult.error) {
    logInternalQueryError("Internal client document counts", documentCountsResult.error);
  }

  const requestCounts = countByClient(requestCountsResult.data ?? []);
  const documentCounts = countByClient(documentCountsResult.data ?? []);

  return (
    <InternalPage
      active="clients"
      title="Internal Clients"
      description="Review client portal profiles and jump into related requests and documents."
    >
      <form className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          Search clients
          <input
            name="search"
            defaultValue={search}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            placeholder="Name, email, or company"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-[#244285] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Filter
        </button>
      </form>

      <section className="py-8">
        {clientsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              Clients are unavailable right now.
            </p>
          </div>
        ) : clients.length ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-600">
              Showing {clients.length} client{clients.length === 1 ? "" : "s"}
              {search ? ` matching "${search}"` : ""}.
            </p>
            <div className="grid gap-4 lg:hidden">
              {clients.map((client) => (
                <AdminCard key={client.id}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{client.full_name}</p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {client.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {client.company || "Company not listed"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Requests
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {requestCounts.get(client.id) ?? 0}
                        </p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Documents
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {documentCounts.get(client.id) ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Created {formatDateTime(client.created_at)}
                      </p>
                      <Link
                        href={`/internal/clients/${client.id}`}
                        className="rounded-md bg-[#244285] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                      >
                        View detail
                      </Link>
                    </div>
                  </div>
                </AdminCard>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm lg:block">
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="border-b border-[#50A9C0]/20 bg-[#50A9C0]/15 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Preferred</th>
                    <th className="px-4 py-3">Requests</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-950">{client.full_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{client.email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {client.phone || "Not available"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {client.company || "Not available"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {client.preferred_contact_method || "Not available"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {requestCounts.get(client.id) ?? 0}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {documentCounts.get(client.id) ?? 0}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDateTime(client.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/internal/clients/${client.id}`}
                          className="font-semibold text-[#244285] transition hover:text-[#06111f]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyCard>
            No clients found{search ? " for this search." : "."} Try a different name,
            email, or company.
          </EmptyCard>
        )}
      </section>
    </InternalPage>
  );
}
