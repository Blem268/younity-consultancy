import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateClientForm } from "./create-client-form";
import { LinkAuthUserForm } from "./link-auth-user-form";
import {
  AccessDenied,
  AdminCard,
  EmptyCard,
  formatDateTime,
  InternalPage,
  logInternalQueryError,
} from "../internal-ui";

type ClientRecord = {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  created_at: string | null;
};

function ClientTable({
  clients,
  emptyMessage,
}: {
  clients: ClientRecord[];
  emptyMessage: string;
}) {
  if (!clients.length) {
    return <EmptyCard>{emptyMessage}</EmptyCard>;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="border-b border-[#50A9C0]/20 bg-[#06111f] text-xs font-black uppercase tracking-[0.12em] text-white">
          <tr>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {clients.map((client) => (
            <tr key={client.id}>
              <td className="px-4 py-4 font-semibold text-slate-950">
                {client.full_name}
              </td>
              <td className="px-4 py-4 text-slate-600">{client.email}</td>
              <td className="px-4 py-4 text-slate-600">
                {client.company || "Not available"}
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
  );
}

export default async function InternalOnboardingPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Client Onboarding" />;
  }

  const supabaseAdmin = createAdminClient();
  const [unlinkedClientsResult, onboardedClientsResult] = await Promise.all([
    supabaseAdmin
      .from("clients")
      .select("id, full_name, email, company, created_at")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ClientRecord[]>(),
    supabaseAdmin
      .from("clients")
      .select("id, full_name, email, company, created_at")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ClientRecord[]>(),
  ]);

  if (unlinkedClientsResult.error) {
    logInternalQueryError("Recent unlinked clients", unlinkedClientsResult.error);
  }

  if (onboardedClientsResult.error) {
    logInternalQueryError("Recent onboarded clients", onboardedClientsResult.error);
  }

  const unlinkedClients = unlinkedClientsResult.data ?? [];
  const onboardedClients = onboardedClientsResult.data ?? [];

  return (
    <InternalPage
      active="onboarding"
      title="Client Onboarding"
      description="Create or link a client portal profile, then manually provide the client with login instructions."
    >
      <section className="grid gap-5 py-8 lg:grid-cols-2">
        <AdminCard
          title="Create Client Profile"
          description="Create the portal profile record only. Supabase Auth users are not created automatically in this phase."
        >
          <CreateClientForm />
        </AdminCard>

        <AdminCard
          title="Link Existing Client Profile to Auth User"
          description="Connect an existing client profile to a manually created Supabase Auth user."
        >
          <LinkAuthUserForm unlinkedClients={unlinkedClients} />
        </AdminCard>
      </section>

      <section className="grid gap-5 pb-8">
        <AdminCard
          title="Recent Unlinked Clients"
          description="Client profiles that do not yet have a Supabase Auth user linked."
        >
          {unlinkedClientsResult.error ? (
            <p className="text-sm text-slate-600">
              Unlinked clients are unavailable right now.
            </p>
          ) : (
            <ClientTable
              clients={unlinkedClients}
              emptyMessage="No unlinked clients found."
            />
          )}
        </AdminCard>

        <AdminCard
          title="Recent Onboarded Clients"
          description="Client profiles already linked to Supabase Auth users."
        >
          {onboardedClientsResult.error ? (
            <p className="text-sm text-slate-600">
              Onboarded clients are unavailable right now.
            </p>
          ) : (
            <ClientTable
              clients={onboardedClients}
              emptyMessage="No onboarded clients found."
            />
          )}
        </AdminCard>
      </section>
    </InternalPage>
  );
}
