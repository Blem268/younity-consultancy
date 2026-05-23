import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import {
  AdminCard,
  AccessDenied,
  EmptyCard,
  formatDateTime,
  InvoiceStatusBadge,
  InternalPage,
  MutedBadge,
  StatusBadge,
} from "./internal-ui";

type CardValue = string | number;

type SummaryCard = {
  title: string;
  value: CardValue;
  description: string;
};

type WorkflowErrorItem = {
  id: string;
  created_at: string | null;
  source: string;
  severity: string;
  message: string;
};

type ClientRequestItem = {
  id: string;
  service: string;
  status: string;
  invoice_status: string | null;
  created_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
  } | null;
};

type ClientDocumentItem = {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string | null;
  clients: {
    full_name: string | null;
    company: string | null;
  } | null;
};

function clientLabel(
  client: { full_name: string | null; company: string | null } | null
) {
  if (!client) {
    return "Client unavailable";
  }

  return client.company || client.full_name || "Client unavailable";
}

function logDashboardQueryError(cardTitle: string, error: unknown) {
  if (!error || typeof error !== "object") {
    console.error("Internal dashboard query failed:", { cardTitle });
    return;
  }

  const maybeError = error as { message?: unknown; code?: unknown };
  console.error("Internal dashboard query failed:", {
    cardTitle,
    message:
      typeof maybeError.message === "string" ? maybeError.message : undefined,
    code: typeof maybeError.code === "string" ? maybeError.code : undefined,
  });
}

async function getCountCard(
  title: string,
  description: string,
  query: PromiseLike<{ count: number | null; error: unknown }>
): Promise<SummaryCard> {
  const result = await query;

  if (result.error) {
    logDashboardQueryError(title, result.error);
    return {
      title,
      value: "Unavailable",
      description,
    };
  }

  return {
    title,
    value: result.count ?? 0,
    description,
  };
}

export default async function InternalDashboardPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied title="Younity Internal Dashboard" />;
  }

  const supabaseAdmin = createAdminClient();
  const nowDate = new Date();
  const sevenDaysAgoDate = new Date(nowDate);
  sevenDaysAgoDate.setUTCDate(nowDate.getUTCDate() - 7);
  const sevenDaysAgo = sevenDaysAgoDate.toISOString();
  const now = nowDate.toISOString();

  const [
    openWorkflowErrorsCard,
    recentClientRequestsCard,
    documentsUploadedCard,
    documentsNeededCard,
    documentsNeedingReviewCard,
    activeClientRequestsCard,
    readyForBillingCard,
    rateLimitRecordsCard,
    workflowErrorsResult,
    clientRequestsResult,
    clientDocumentsResult,
  ] = await Promise.all([
    getCountCard(
      "Open Workflow Errors",
      "Unresolved workflow failures that may need retry or manual resolution.",
      supabaseAdmin
        .from("workflow_errors")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false)
    ),
    getCountCard(
      "Recent Client Requests",
      "Requests submitted in the last 7 days across the client portal.",
      supabaseAdmin
        .from("client_requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo)
    ),
    getCountCard(
      "Documents Uploaded",
      "Client files uploaded in the last 7 days through secure storage.",
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .gte("uploaded_at", sevenDaysAgo)
        .neq("file_path", "pending")
    ),
    getCountCard(
      "Documents Needed",
      "Structured document requests still waiting on client upload or replacement.",
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["Requested", "Needs Replacement"])
    ),
    getCountCard(
      "Documents Needing Review",
      "Submitted or received client files waiting for internal review.",
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["Submitted", "Received"])
    ),
    getCountCard(
      "Active Client Requests",
      "Requests still moving through the operations workflow.",
      supabaseAdmin
        .from("client_requests")
        .select("id", { count: "exact", head: true })
        .not("status", "in", '("Completed","Closed")')
    ),
    getCountCard(
      "Ready for Billing",
      "Requests marked ready for manual invoice preparation.",
      supabaseAdmin
        .from("client_requests")
        .select("id", { count: "exact", head: true })
        .eq("invoice_status", "Ready for Billing")
    ),
    getCountCard(
      "Rate Limit Records",
      "Active Supabase-backed rate-limit windows protecting public actions.",
      supabaseAdmin
        .from("rate_limits")
        .select("id", { count: "exact", head: true })
        .gt("expires_at", now)
    ),
    supabaseAdmin
      .from("workflow_errors")
      .select("id, created_at, source, severity, message")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<WorkflowErrorItem[]>(),
    supabaseAdmin
      .from("client_requests")
      .select("id, service, status, invoice_status, created_at, clients(full_name, company)")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<ClientRequestItem[]>(),
    supabaseAdmin
      .from("client_documents")
      .select("id, document_type, file_name, status, uploaded_at, clients(full_name, company)")
      .order("uploaded_at", { ascending: false })
      .limit(5)
      .returns<ClientDocumentItem[]>(),
  ]);

  const summaryCards = [
    openWorkflowErrorsCard,
    recentClientRequestsCard,
    documentsUploadedCard,
    documentsNeededCard,
    documentsNeedingReviewCard,
    activeClientRequestsCard,
    readyForBillingCard,
    rateLimitRecordsCard,
  ];

  if (workflowErrorsResult.error) {
    logDashboardQueryError("Recent workflow errors", workflowErrorsResult.error);
  }

  if (clientRequestsResult.error) {
    logDashboardQueryError("Recent client requests", clientRequestsResult.error);
  }

  if (clientDocumentsResult.error) {
    logDashboardQueryError("Recent document uploads", clientDocumentsResult.error);
  }

  const workflowErrors = workflowErrorsResult.data ?? [];
  const clientRequests = clientRequestsResult.data ?? [];
  const clientDocuments = clientDocumentsResult.data ?? [];
  const quickActions = [
    { label: "Manage Clients", href: "/internal/clients" },
    { label: "Manage Requests", href: "/internal/requests" },
    { label: "Manage Documents", href: "/internal/documents" },
    { label: "Run Syncs", href: "/internal/sync" },
    { label: "Workflow Errors", href: "/internal/errors" },
    { label: "Public Website", href: "/" },
    { label: "Test Lead Form", href: "/contact" },
  ];

  return (
    <InternalPage
      active="dashboard"
      title="Younity Internal Dashboard"
      description="Operations, workflow health, billing readiness, and client portal activity."
    >
        <section className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#50A9C0]/30"
            >
              <p className="text-sm font-semibold text-slate-600">{card.title}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <AdminCard
            title="Recent Workflow Errors"
            description="Newest unresolved failures from workflow logging."
            actions={
              <Link
                href="/internal/errors"
                className="text-sm font-semibold text-[#244285] transition hover:text-[#06111f]"
              >
                View all
              </Link>
            }
          >
            {workflowErrorsResult.error ? (
              <p className="mt-5 text-sm text-slate-600">
                Workflow errors are unavailable right now.
              </p>
            ) : workflowErrors.length ? (
              <div className="divide-y divide-slate-200">
                {workflowErrors.map((workflowError) => (
                  <div key={workflowError.id} className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge>{workflowError.severity}</StatusBadge>
                      <MutedBadge>{formatDateTime(workflowError.created_at)}</MutedBadge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {workflowError.message}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-600">
                      {workflowError.source}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyCard>No unresolved workflow errors. The active workflow queue is clear.</EmptyCard>
            )}
          </AdminCard>

          <AdminCard
            title="Quick Actions"
            description="Common internal routes for daily operations."
          >
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#50A9C0]/30 hover:bg-[#50A9C0]/10 hover:text-[#06111f]"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </AdminCard>
        </section>

        <section className="grid gap-5 py-8 lg:grid-cols-2">
          <AdminCard
            title="Recent Client Requests"
            description="Latest submitted requests with status and billing readiness."
          >
            {clientRequestsResult.error ? (
              <p className="mt-5 text-sm text-slate-600">
                Client requests are unavailable right now.
              </p>
            ) : clientRequests.length ? (
              <div className="divide-y divide-slate-200">
                {clientRequests.map((request) => (
                  <div key={request.id} className="py-4">
                    <p className="text-sm font-semibold text-slate-950">
                      {request.service}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {clientLabel(request.clients)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <StatusBadge>{request.status}</StatusBadge>
                      <InvoiceStatusBadge>
                        {request.invoice_status || "Invoice status unavailable"}
                      </InvoiceStatusBadge>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Created {formatDateTime(request.created_at)}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      Request ID: {request.id}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyCard>No recent client requests in the current dashboard window.</EmptyCard>
            )}
          </AdminCard>

          <AdminCard
            title="Recent Document Uploads"
            description="Newest client uploads, kept behind admin document routes."
          >
            {clientDocumentsResult.error ? (
              <p className="mt-5 text-sm text-slate-600">
                Document uploads are unavailable right now.
              </p>
            ) : clientDocuments.length ? (
              <div className="divide-y divide-slate-200">
                {clientDocuments.map((document) => (
                  <div key={document.id} className="py-4">
                    <p className="break-words text-sm font-semibold text-slate-950">
                      {document.file_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {document.document_type}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {clientLabel(document.clients)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <StatusBadge>{document.status}</StatusBadge>
                      <MutedBadge>Uploaded {formatDateTime(document.uploaded_at)}</MutedBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyCard>No recent document uploads in the current dashboard window.</EmptyCard>
            )}
          </AdminCard>
        </section>
    </InternalPage>
  );
}
