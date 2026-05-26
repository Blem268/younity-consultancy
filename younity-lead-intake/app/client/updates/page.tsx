import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatPortalDate,
  friendlyPortalText,
} from "@/lib/client/portal-text";
import {
  BackLinks,
  Card,
  EmptyState,
  PageHeader,
  PortalPage,
  PrimaryButtonLink,
} from "../portal-ui";

type ClientProfile = {
  id: string;
};

type ClientUpdate = {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
  request_id: string | null;
  client_requests: {
    service: string;
  } | null;
};

export default async function ClientUpdatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/client/login");
  }

  const { data: clientProfile, error: clientProfileError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <PortalPage>
        <PageHeader
          eyebrow={
            <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
          }
          title="Updates"
          description={`Signed in as ${user.email}`}
        />

        <Card className="mt-8 border-amber-200 bg-amber-50">
          <p className="text-sm leading-6 text-slate-700">
            Your portal profile has not been set up yet. Please contact Younity
            Consultancy.
          </p>
        </Card>
      </PortalPage>
    );
  }

  const { data: updates, error: updatesError } = await supabase
    .from("client_updates")
    .select(
      "id, title, message, created_at, request_id, client_requests(service)"
    )
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ClientUpdate[]>();

  if (updatesError) {
    console.error("Client updates lookup failed:", updatesError);
  }

  const clientUpdates = updates ?? [];

  return (
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks links={[{ href: "/client/dashboard", label: "Back to Dashboard" }]} />
        }
        title="Updates"
        description="Messages and progress notes shared by the Younity team."
        actions={
          <PrimaryButtonLink href="/client/support">Get Support</PrimaryButtonLink>
        }
      />

      <section className="py-8">
        {clientUpdates.length ? (
          <div className="space-y-4">
            {clientUpdates.map((update) => (
              <Card key={update.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      {friendlyPortalText(update.title)}
                    </h2>
                    {update.client_requests?.service ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Related request: {update.client_requests.service}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    {formatPortalDate(update.created_at)}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {friendlyPortalText(update.message)}
                </p>
                {update.request_id ? (
                  <div className="mt-4">
                    <Link
                      href={`/client/requests/${update.request_id}`}
                      prefetch={false}
                      className="text-sm font-black text-[#244285] transition hover:text-[#06111f]"
                    >
                      View related request →
                    </Link>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="No updates yet."
              description="When Younity posts an update about your requests or documents, it will appear here."
              action={
                <PrimaryButtonLink href="/client/requests/new">
                  Submit Request
                </PrimaryButtonLink>
              }
            />
          </Card>
        )}
      </section>
    </PortalPage>
  );
}
