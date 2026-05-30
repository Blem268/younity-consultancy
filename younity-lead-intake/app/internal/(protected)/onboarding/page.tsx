import Link from "next/link";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateClientForm } from "./create-client-form";
import {
  AccessDenied,
  EmptyCard,
  formatDateTime,
  InternalPage,
  logInternalQueryError,
  MutedBadge,
} from "../internal-ui";

type ClientRecord = {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  user_id: string | null;
  created_at: string | null;
};

export default async function InternalOnboardingPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Client Onboarding" />;
  }

  const supabaseAdmin = createAdminClient();

  const { data: recentClients, error: recentClientsError } = await supabaseAdmin
    .from("clients")
    .select("id, full_name, email, company, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ClientRecord[]>();

  if (recentClientsError) {
    logInternalQueryError("Onboarding recent clients", recentClientsError);
  }

  const clients = recentClients ?? [];
  const pendingCount = clients.filter((c) => !c.user_id).length;

  return (
    <InternalPage
      active="clients"
      title="Add client"
      description="Create a client portal profile and send them a portal invite in one step."
      actions={
        <Link
          href="/internal/clients"
          prefetch={false}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to clients
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Form */}
        <div className="rounded-[10px] border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#06111f]">
            New client profile
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the client details below. A portal invite will be sent to
            their email address as soon as you submit.
          </p>
          <div className="mt-5">
            <CreateClientForm />
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-4">
          <div className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#06111f]">
              How onboarding works
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                {
                  step: "1",
                  title: "You fill in this form",
                  detail:
                    "Name, email, phone, company, and preferred contact method. Zoho IDs are optional at this stage.",
                },
                {
                  step: "2",
                  title: "Portal invite sent automatically",
                  detail:
                    "The client receives an email with a secure link to set their password and access their portal.",
                },
                {
                  step: "3",
                  title: "Client sets their password",
                  detail:
                    "They click the link, choose a password, and land on their portal dashboard.",
                },
                {
                  step: "4",
                  title: "Submit their first request",
                  detail:
                    "You can create their first service request straight away from the Board or Requests pages.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#244285]/10 text-xs font-black text-[#244285]">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {pendingCount > 0 ? (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                {pendingCount} client{pendingCount === 1 ? "" : "s"} pending portal access
              </p>
              <p className="mt-1 text-xs text-amber-700">
                These clients have a profile but no linked portal account. They
                may have been created before the invite system was set up.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Recent clients */}
      <div className="mt-6 rounded-[10px] border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#06111f]">
            Recently added clients
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Last 20 client profiles, newest first.
          </p>
        </div>

        {recentClientsError ? (
          <p className="px-5 py-4 text-sm text-red-600">
            Client list is unavailable right now.
          </p>
        ) : clients.length === 0 ? (
          <div className="p-5">
            <EmptyCard>No clients yet. Create the first one above.</EmptyCard>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ minWidth: "600px" }}>
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Portal access</th>
                  <th className="px-5 py-3">Added</th>
                  <th className="px-5 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#06111f]">
                        {client.full_name}
                      </p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {client.company || (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {client.user_id ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <MutedBadge>Invite pending</MutedBadge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {formatDateTime(client.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/internal/clients/${client.id}`}
                        prefetch={false}
                        className="text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InternalPage>
  );
}
