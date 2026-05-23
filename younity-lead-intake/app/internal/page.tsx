import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireInternalAdmin } from "@/lib/internal/adminAuth";
import { InternalNav } from "./internal-ui";

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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

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

function AccessDenied() {
  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-teal-900/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Younity Consultancy
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Younity Internal Dashboard
          </h1>
        </header>
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-slate-600">
            You do not have access to this internal page.
          </p>
        </section>
      </div>
    </main>
  );
}

export default async function InternalDashboardPage() {
  const admin = await requireInternalAdmin();

  if (!admin.isAdmin) {
    return <AccessDenied />;
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
    activeClientRequestsCard,
    readyForBillingCard,
    rateLimitRecordsCard,
    workflowErrorsResult,
    clientRequestsResult,
    clientDocumentsResult,
  ] = await Promise.all([
    getCountCard(
      "Open Workflow Errors",
      "Unresolved workflow failures.",
      supabaseAdmin
        .from("workflow_errors")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false)
    ),
    getCountCard(
      "Recent Client Requests",
      "Created in the last 7 days.",
      supabaseAdmin
        .from("client_requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo)
    ),
    getCountCard(
      "Documents Uploaded",
      "Uploaded in the last 7 days.",
      supabaseAdmin
        .from("client_documents")
        .select("id", { count: "exact", head: true })
        .gte("uploaded_at", sevenDaysAgo)
    ),
    getCountCard(
      "Active Client Requests",
      "Not completed or closed.",
      supabaseAdmin
        .from("client_requests")
        .select("id", { count: "exact", head: true })
        .not("status", "in", '("Completed","Closed")')
    ),
    getCountCard(
      "Ready for Billing",
      "Requests awaiting invoice preparation.",
      supabaseAdmin
        .from("client_requests")
        .select("id", { count: "exact", head: true })
        .eq("invoice_status", "Ready for Billing")
    ),
    getCountCard(
      "Rate Limit Records",
      "Active rate-limit windows.",
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
    { label: "View Workflow Errors", href: "/internal/errors" },
    { label: "Client Portal", href: "/client/dashboard" },
    { label: "Public Website", href: "/" },
    { label: "Test Lead Form", href: "/contact" },
  ];

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="border-b border-teal-900/10 pb-8">
          <InternalNav active="dashboard" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Younity Consultancy
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Younity Internal Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Operations, workflow health, and client portal activity.
          </p>
        </header>

        <section className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
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
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Recent Workflow Errors
              </h2>
              <Link
                href="/internal/errors"
                className="text-sm font-semibold text-teal-700 transition hover:text-teal-900"
              >
                View all
              </Link>
            </div>
            {workflowErrorsResult.error ? (
              <p className="mt-5 text-sm text-slate-600">
                Workflow errors are unavailable right now.
              </p>
            ) : workflowErrors.length ? (
              <div className="divide-y divide-slate-200">
                {workflowErrors.map((workflowError) => (
                  <div key={workflowError.id} className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        {workflowError.severity}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {formatDateTime(workflowError.created_at)}
                      </span>
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
              <p className="mt-5 text-sm text-slate-600">
                No unresolved workflow errors.
              </p>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-200 pb-4 text-lg font-semibold tracking-tight">
              Quick Actions
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-5 py-8 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-200 pb-4 text-lg font-semibold tracking-tight">
              Recent Client Requests
            </h2>
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
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                        {request.status}
                      </span>
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-teal-800">
                        {request.invoice_status || "Invoice status unavailable"}
                      </span>
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
              <p className="mt-5 text-sm text-slate-600">
                No recent client requests.
              </p>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-200 pb-4 text-lg font-semibold tracking-tight">
              Recent Document Uploads
            </h2>
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
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                        {document.status}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        Uploaded {formatDateTime(document.uploaded_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-600">
                No recent document uploads.
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
