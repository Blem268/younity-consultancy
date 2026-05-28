import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatPortalDate,
  friendlyPortalText,
} from "@/lib/client/portal-text";
import { PortalClientHeader } from "../portal-client-header";
import { brand } from "@/app/components/ui/brand";
import { RequestStatusBadge } from "@/app/components/ui/status-badges";
import { getGreeting, splitName } from "@/lib/client/portal-profile";
import { ServiceIcon } from "../service-icon";

type ClientProfile = {
  id: string;
  full_name: string;
};

type ClientRequestRow = {
  id: string;
  service: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  balance_due: number | string | null;
  invoice_status: string | null;
};

type RequestedDocument = {
  id: string;
  document_type: string;
  request_id: string | null;
  client_requests: { service: string } | null;
};

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return "XCD 0.00";
  }

  return `XCD ${new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function sumBalanceDue(
  requests: Array<{ balance_due: number | string | null }>
) {
  return requests.reduce((total, request) => {
    const amount =
      typeof request.balance_due === "number"
        ? request.balance_due
        : Number(request.balance_due);

    if (!Number.isFinite(amount) || amount <= 0) {
      return total;
    }

    return total + amount;
  }, 0);
}

function getRequestSecondaryDetail(
  request: ClientRequestRow,
  pendingDocuments: number
) {
  const status = request.status.toLowerCase();

  if (status.includes("completed") || status.includes("closed")) {
    return "No further steps";
  }

  if (pendingDocuments > 0) {
    return pendingDocuments === 1
      ? "1 step remaining — document needed"
      : `${pendingDocuments} steps remaining — documents needed`;
  }

  if (status.includes("waiting") || status.includes("client")) {
    return "Your action may be needed";
  }

  const createdAt = request.created_at ? new Date(request.created_at) : null;

  if (createdAt && !Number.isNaN(createdAt.getTime())) {
    const daysOpen = Math.max(
      1,
      Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );
    return `Est. ${daysOpen}–${daysOpen + 2} business days`;
  }

  return "In progress with Younity";
}

const SECTION_CARD =
  "rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4 sm:p-5";

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#50A9C0]/30 bg-[#50A9C0]/10 p-6">
      <p className="text-sm font-medium text-slate-950">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function StatIcon({
  tone,
  children,
}: {
  tone: "blue" | "amber" | "teal";
  children: ReactNode;
}) {
  const toneClasses = {
    blue: "bg-[#244285]/12 text-[#244285]",
    amber: "bg-amber-100 text-amber-800",
    teal: "bg-[#50A9C0]/15 text-[#244285]",
  };

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export default async function ClientDashboardPage() {
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
      <div className="client-dashboard min-h-screen">
        <PortalClientHeader />
        <div className={`${brand.pageBackground} p-6`}>
          <section className={`${SECTION_CARD} mt-6 border-amber-200 bg-amber-50`}>
            <EmptyState
              title="Portal profile pending"
              description={`Signed in as ${user.email}. Please contact Younity Consultancy to finish setting up your portal access.`}
            />
          </section>
        </div>
      </div>
    );
  }

  const { firstName } = splitName(clientProfile.full_name);
  const greeting = getGreeting(new Date().getHours());

  const [
    activeRequestsResult,
    documentsRequestedResult,
    requestedDocumentsResult,
    recentRequestsResult,
    billingRequestsResult,
  ] = await Promise.all([
    supabase
      .from("client_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .neq("status", "Completed")
      .neq("status", "Closed"),
    supabase
      .from("client_documents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientProfile.id)
      .eq("status", "Requested"),
    supabase
      .from("client_documents")
      .select("id, document_type, request_id, client_requests(service)")
      .eq("client_id", clientProfile.id)
      .eq("status", "Requested")
      .order("requested_at", { ascending: false })
      .limit(1)
      .returns<RequestedDocument[]>(),
    supabase
      .from("client_requests")
      .select(
        "id, service, status, created_at, updated_at, balance_due, invoice_status"
      )
      .eq("client_id", clientProfile.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<ClientRequestRow[]>(),
    supabase
      .from("client_requests")
      .select("balance_due")
      .eq("client_id", clientProfile.id)
      .returns<Pick<ClientRequestRow, "balance_due">[]>(),
  ]);

  if (activeRequestsResult.error) {
    console.error("Active requests count failed:", activeRequestsResult.error);
  }

  if (documentsRequestedResult.error) {
    console.error("Documents requested count failed:", documentsRequestedResult.error);
  }

  if (requestedDocumentsResult.error) {
    console.error(
      "Requested documents lookup failed:",
      requestedDocumentsResult.error
    );
  }

  if (recentRequestsResult.error) {
    console.error("Recent requests lookup failed:", recentRequestsResult.error);
  }

  if (billingRequestsResult.error) {
    console.error("Billing requests lookup failed:", billingRequestsResult.error);
  }

  const activeRequestCount = activeRequestsResult.count ?? 0;
  const documentsNeededCount = documentsRequestedResult.count ?? 0;
  const balanceDueTotal = sumBalanceDue(billingRequestsResult.data ?? []);
  const recentRequests = recentRequestsResult.data ?? [];
  const priorityDocument = requestedDocumentsResult.data?.[0];
  const recentRequestIds = recentRequests.map((request) => request.id);

  const pendingDocumentsByRequest = new Map<string, number>();

  if (recentRequestIds.length > 0) {
    const { data: pendingDocs, error: pendingDocsError } = await supabase
      .from("client_documents")
      .select("request_id")
      .eq("client_id", clientProfile.id)
      .eq("status", "Requested")
      .in("request_id", recentRequestIds);

    if (pendingDocsError) {
      console.error("Pending documents lookup failed:", pendingDocsError);
    } else {
      for (const document of pendingDocs ?? []) {
        if (!document.request_id) {
          continue;
        }

        pendingDocumentsByRequest.set(
          document.request_id,
          (pendingDocumentsByRequest.get(document.request_id) ?? 0) + 1
        );
      }
    }
  }

  const documentAlertHref = priorityDocument?.request_id
    ? `/client/requests/${priorityDocument.request_id}`
    : "/client/documents";
  const documentAlertTitle =
    priorityDocument?.client_requests?.service ||
    priorityDocument?.document_type ||
    "your request";

  return (
    <div className="client-dashboard flex min-h-screen flex-col">
      <PortalClientHeader fullName={clientProfile.full_name} />

      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="dash-fade-up">
            <h1 className="text-[20px] font-medium tracking-tight text-[#06111f]">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Here&apos;s a summary of your account with Younity Consultancy.
            </p>
          </div>

          <section className="grid gap-4 sm:grid-cols-3">
            <article
              className="stat-card dash-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4"
              style={{ animationDelay: "40ms" }}
            >
              <div className="flex items-start gap-3">
                <StatIcon tone="blue">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M6 7h12v10H6zM9 10h6M9 13h4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </StatIcon>
                <div>
                  <p className="text-xs text-slate-500">Active Requests</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight text-[#06111f]">
                    {activeRequestCount}
                  </p>
                </div>
              </div>
            </article>

            <article
              className="stat-card dash-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4"
              style={{ animationDelay: "90ms" }}
            >
              <div className="flex items-start gap-3">
                <StatIcon tone="amber">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M8 6h8l-1 12H9L8 6zM11 10h2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </StatIcon>
                <div>
                  <p className="text-xs text-slate-500">Documents needed</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight text-[#06111f]">
                    {documentsNeededCount}
                  </p>
                </div>
              </div>
            </article>

            <article
              className="stat-card dash-fade-up rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4"
              style={{ animationDelay: "140ms" }}
            >
              <div className="flex items-start gap-3">
                <StatIcon tone="teal">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M6 8h12v8H6zM9 11h6M9 14h4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </StatIcon>
                <div>
                  <p className="text-xs text-slate-500">Balance due</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight text-[#06111f]">
                    {formatMoney(balanceDueTotal)}
                  </p>
                </div>
              </div>
            </article>
          </section>

          {documentsNeededCount > 0 && priorityDocument ? (
            <Link
              href={documentAlertHref}
              prefetch={false}
              className="dash-fade-up flex items-center gap-4 rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4 transition hover:border-amber-200"
              style={{ animationDelay: "160ms" }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M8 6h8l-1 12H9L8 6zM11 10h2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#06111f]">
                  document required — {friendlyPortalText(documentAlertTitle)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Requested by Younity · Tap to upload
                </p>
              </span>
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                Action needed
              </span>
            </Link>
          ) : null}

          <section>
            <div
              className="dash-fade-up mb-3 flex items-center justify-between"
              style={{ animationDelay: "180ms" }}
            >
              <h2 className="text-sm font-medium text-[#06111f]">Recent requests</h2>
              <Link
                href="/client/requests"
                prefetch={false}
                className="text-xs font-medium text-[#244285] transition hover:text-[#06111f]"
              >
                View all →
              </Link>
            </div>

            <div
              className="dash-fade-up overflow-hidden rounded-xl border-[0.5px] border-[#06111f]/10 bg-white"
              style={{ animationDelay: "200ms" }}
            >
              {recentRequests.length ? (
                <div className="divide-y divide-[#06111f]/8">
                  {recentRequests.map((request) => {
                    const pendingDocs =
                      pendingDocumentsByRequest.get(request.id) ?? 0;

                    return (
                      <Link
                        key={request.id}
                        href={`/client/requests/${request.id}`}
                        prefetch={false}
                        className="req-row flex items-center gap-4 px-4 py-4"
                      >
                        <ServiceIcon service={request.service} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[#06111f]">
                            {friendlyPortalText(request.service)}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            Submitted {formatPortalDate(request.created_at)}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {getRequestSecondaryDetail(request, pendingDocs)}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-2">
                          <RequestStatusBadge status={request.status} />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="No requests yet"
                    description="Start a new request when you're ready and it will appear here."
                  />
                </div>
              )}
            </div>
          </section>

          <section
            className="dash-fade-up grid gap-3 sm:grid-cols-2"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/client/requests/new"
              prefetch={false}
              className="btn btn-primary inline-flex min-h-11 items-center justify-center rounded-xl bg-[#244285] px-4 py-3 text-sm font-medium text-white"
            >
              + New request
            </Link>
            <Link
              href="/client/documents"
              prefetch={false}
              className="btn btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl border border-[#06111f]/15 bg-white px-4 py-3 text-sm font-medium text-[#06111f]"
            >
              ↑ Upload document
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
