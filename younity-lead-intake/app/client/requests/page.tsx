import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyPortalText } from "@/lib/client/portal-text";
import { PortalClientHeader } from "../portal-client-header";
import { InvoiceStatusBadge, RequestStatusBadge } from "@/app/components/ui/status-badges";
import { ServiceIcon } from "../service-icon";
import { brand } from "@/app/components/ui/brand";

const SECTION_CARD =
  "rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4 sm:p-5";

function getInvoiceStatus(value: string | null | undefined) {
  return value || "Not Ready";
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#50A9C0]/30 bg-[#50A9C0]/10 p-6">
      <p className="text-sm font-medium text-slate-950">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

type ClientProfile = {
  id: string;
  full_name: string;
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

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px] shrink-0 text-[#244285]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle<ClientProfile>();

  if (clientProfileError) {
    console.error("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <div className="req-list flex min-h-screen flex-col">
        <PortalClientHeader />
        <div className={`${brand.pageBackground} flex-1 p-6`}>
          <div className="mx-auto w-full max-w-6xl">
            <section className={`${SECTION_CARD} mt-6 border-amber-200 bg-amber-50`}>
              <EmptyState
                title="Portal profile pending"
                description={`Signed in as ${user.email}. Please contact Younity Consultancy.`}
              />
            </section>
          </div>
        </div>
      </div>
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
    <div className="req-list flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <nav
            className="list-fade-up text-[12px] text-slate-500"
            style={{ animationDelay: "0ms" }}
            aria-label="Breadcrumb"
          >
            <Link
              href="/client/dashboard"
              prefetch={false}
              className="text-[#244285] hover:text-[#06111f]"
              style={{ transition: "color 150ms ease" }}
            >
              ← Dashboard
            </Link>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[20px] font-medium tracking-tight text-[#06111f]">
                Requests
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Review requests already shared with Younity Consultancy.
              </p>
            </div>
            <Link
              href="/client/requests/new"
              prefetch={false}
              className="btn-primary inline-flex w-full items-center justify-center rounded-xl bg-[#244285] px-4 py-2.5 text-sm font-medium text-white sm:w-auto"
            >
              + New request
            </Link>
          </div>

          {clientRequests.length ? (
            <div
              className="list-fade-up overflow-hidden rounded-xl border-[0.5px] border-[#06111f]/10 bg-white"
              style={{ animationDelay: "60ms" }}
            >
              <div className="divide-y divide-[#06111f]/8">
                {clientRequests.map((request) => {
                  const invoiceStatus = getInvoiceStatus(request.invoice_status);

                  return (
                    <Link
                      key={request.id}
                      href={`/client/requests/${request.id}`}
                      prefetch={false}
                      className="req-row flex items-center gap-4 px-4 py-4"
                    >
                      <ServiceIcon service={request.service} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-[#06111f]">
                          {friendlyPortalText(request.service)}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] text-slate-500">
                          Submitted {formatDate(request.created_at)}
                        </span>
                      </span>
                      <span className="hidden shrink-0 flex-wrap items-center gap-2 sm:flex">
                        <RequestStatusBadge status={request.status} />
                        <InvoiceStatusBadge status={invoiceStatus} />
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-2 sm:min-w-[7.5rem]">
                        <span className="flex flex-wrap items-center justify-end gap-2 sm:hidden">
                          <RequestStatusBadge status={request.status} />
                          <InvoiceStatusBadge status={invoiceStatus} />
                        </span>
                        <span className="text-[11.5px] text-slate-500">
                          Updated {formatDate(request.updated_at)}
                        </span>
                        <ChevronIcon />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <section
              className={`${SECTION_CARD} list-fade-up`}
              style={{ animationDelay: "60ms" }}
            >
              <EmptyState
                title="No requests have been submitted yet."
                action={
                  <Link
                    href="/client/requests/new"
                    prefetch={false}
                    className="btn-primary mt-4 inline-flex items-center justify-center rounded-xl bg-[#244285] px-4 py-2.5 text-sm font-medium text-white"
                  >
                    + New request
                  </Link>
                }
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
