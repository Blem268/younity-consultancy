import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BackLinks,
  Card,
  EmptyState,
  getInvoiceStatus,
  InvoiceStatusBadge,
  PageHeader,
  PortalPage,
  PrimaryButtonLink,
  RequestStatusBadge,
} from "../portal-ui";

type ClientProfile = {
  id: string;
};

type ClientRequest = {
  id: string;
  service: string;
  status: string;
  invoice_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ClientRequestsPage() {
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
          title="Client Requests"
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

  const { data: requests, error: requestsError } = await supabase
    .from("client_requests")
    .select("id, service, status, invoice_status, created_at, updated_at")
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false })
    .returns<ClientRequest[]>();

  if (requestsError) {
    console.error("Client requests lookup failed:", requestsError);
  }

  const clientRequests = requests ?? [];

  return (
    <PortalPage>
      <PageHeader
        title="Client Requests"
        description="Review requests already shared with Younity Consultancy."
        actions={
          <PrimaryButtonLink href="/client/requests/new">
            Submit New Request
          </PrimaryButtonLink>
        }
      />

      <section className="py-8">
        {clientRequests.length ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.9fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-slate-200 bg-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 lg:grid">
              <span>Service</span>
              <span>Status</span>
              <span>Invoice Status</span>
              <span>Created Date</span>
              <span>Last Updated</span>
              <span className="text-right">Details</span>
            </div>

            <div className="divide-y divide-slate-200">
              {clientRequests.map((request) => {
                const invoiceStatus = getInvoiceStatus(request.invoice_status);

                return (
                  <article
                    key={request.id}
                    className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_0.8fr_0.9fr_0.8fr_0.8fr_0.7fr] lg:items-center"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                        Service
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-950 lg:mt-0">
                        {request.service}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                        Status
                      </p>
                      <div className="mt-1 lg:mt-0">
                        <RequestStatusBadge status={request.status} />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                        Invoice Status
                      </p>
                      <div className="mt-1 lg:mt-0">
                        <InvoiceStatusBadge status={invoiceStatus} />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                        Created Date
                      </p>
                      <p className="mt-1 text-sm text-slate-700 lg:mt-0">
                        {formatDate(request.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                        Last Updated
                      </p>
                      <p className="mt-1 text-sm text-slate-700 lg:mt-0">
                        {formatDate(request.updated_at)}
                      </p>
                    </div>

                    <div className="lg:text-right">
                      <Link
                        href={`/client/requests/${request.id}`}
                        className="inline-flex min-h-10 items-center text-sm font-semibold text-teal-700 transition hover:text-teal-900"
                      >
                        View Details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <Card>
            <EmptyState
              title="No requests have been submitted yet."
              action={
                <PrimaryButtonLink href="/client/requests/new">
                  Submit New Request
                </PrimaryButtonLink>
              }
            />
          </Card>
        )}
      </section>
    </PortalPage>
  );
}
