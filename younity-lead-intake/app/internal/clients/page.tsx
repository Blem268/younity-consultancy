import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccessDenied,
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
          className="self-end rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
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
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="border-b border-teal-900/10 bg-teal-50/70 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
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
                        className="font-semibold text-teal-700 transition hover:text-teal-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyCard>No clients found.</EmptyCard>
        )}
      </section>
    </InternalPage>
  );
}
