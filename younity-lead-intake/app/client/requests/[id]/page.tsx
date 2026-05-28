import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { friendlyPortalText } from "@/lib/client/portal-text";
import { PortalClientHeader } from "../../portal-client-header";
import {
  DocumentStatusBadge,
  InvoiceStatusBadge,
  RequestStatusBadge,
} from "@/app/components/ui/status-badges";
import { UploadForm } from "../../documents/upload-form";
import { brand } from "@/app/components/ui/brand";

const STATUS_STEPS = [
  "Submitted",
  "Under Review",
  "In Progress",
  "Internal Review",
  "Completed",
] as const;

const SECTION_CARD =
  "rounded-xl border-[0.5px] border-[#06111f]/10 bg-white p-4 sm:p-5";
const SECTION_HEADING = "text-[14px] font-medium text-[#06111f]";

function getInvoiceStatus(value: string | null | undefined) {
  return value || "Not Ready";
}

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

type ClientProfile = {
  id: string;
  full_name: string;
};

type ClientRequest = {
  id: string;
  service: string;
  status: string;
  message: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ClientUpdate = {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
};

type ClientDocument = {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  notes: string | null;
  uploaded_at: string | null;
  requested_at: string | null;
};

type ClientInvoice = {
  id: string;
  invoice_number: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
};

type SupabaseLogError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function logSupabaseError(label: string, error: SupabaseLogError | null) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

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

function formatMoney(value: number | null | undefined | "") {
  if (value === null || value === undefined || value === "") {
    return "To Be Reviewed";
  }

  return `XCD ${new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function isDocumentNeeded(document: ClientDocument) {
  return (
    document.status === "Requested" ||
    document.status === "Needs Replacement" ||
    document.file_path === "pending" ||
    document.file_name === "Pending upload"
  );
}

function isRealUploadedDocument(document: ClientDocument) {
  return document.file_path !== "pending" && document.file_name !== "Pending upload";
}

function getStepperIndex(status: string) {
  if (status === "Closed") {
    return { currentIndex: 4, showClientInputCallout: false };
  }

  if (status === "Ready for Billing") {
    return { currentIndex: 3, showClientInputCallout: false };
  }

  if (status === "Waiting on Documents" || status === "Waiting on Client") {
    return { currentIndex: 2, showClientInputCallout: true };
  }

  const exactIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);

  if (exactIndex >= 0) {
    return { currentIndex: exactIndex, showClientInputCallout: false };
  }

  return { currentIndex: 0, showClientInputCallout: false };
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-[#06111f]/8 py-3.5 last:border-b-0">
      <dt className="text-[11.5px] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-[#06111f]">{value}</dd>
    </div>
  );
}

function StatusStepper({ status }: { status: string }) {
  const { currentIndex, showClientInputCallout } = getStepperIndex(status);

  return (
    <section className={SECTION_CARD}>
      <h2 className={SECTION_HEADING}>Request progress</h2>
      <ol className="mt-4 space-y-0">
        {STATUS_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-[#50A9C0] text-white"
                      : isCurrent
                        ? "bg-[#244285] text-white"
                        : "border border-[#06111f]/15 bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M20 6 9 17 4 12"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  ) : null}
                </span>
                {index < STATUS_STEPS.length - 1 ? (
                  <span
                    className={`my-1 w-px flex-1 min-h-6 ${
                      isDone ? "bg-[#50A9C0]" : "bg-[#06111f]/10"
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <div className={`pb-5 ${index === STATUS_STEPS.length - 1 ? "pb-0" : ""}`}>
                <p
                  className={`text-sm ${
                    isCurrent
                      ? "font-medium text-[#06111f]"
                      : isFuture
                        ? "text-slate-400"
                        : "text-slate-600"
                  }`}
                >
                  {step}
                </p>
                {isCurrent && showClientInputCallout ? (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Your input is needed — see the Documents section below.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RequestDetailShell({
  fullName,
  breadcrumb,
  children,
}: {
  fullName?: string;
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="req-detail flex min-h-screen flex-col">
      <PortalClientHeader fullName={fullName} />
      <div className={`${brand.pageBackground} flex-1 p-6`}>
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {breadcrumb}
          {children}
        </div>
      </div>
    </div>
  );
}

function RequestNotFoundState({ title }: { title: string }) {
  return (
    <RequestDetailShell
      breadcrumb={
        <nav
          className="detail-fade-up text-[12px] text-slate-500"
          style={{ animationDelay: "0ms" }}
          aria-label="Breadcrumb"
        >
          <Link
            href="/client/dashboard"
            prefetch={false}
            className="action-link text-[#244285] hover:text-[#06111f]"
          >
            ← Dashboard
          </Link>
          <span className="text-slate-400"> / </span>
          <span>Request unavailable</span>
        </nav>
      }
    >
      <section className={`${SECTION_CARD} detail-fade-up`} style={{ animationDelay: "40ms" }}>
        <EmptyState title={title} />
      </section>
    </RequestDetailShell>
  );
}

export default async function ClientRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = typeof id === "string" ? id.trim() : "";

  if (!requestId || !isUuid(requestId)) {
    return (
      <RequestNotFoundState title="Request not found or you do not have access to this request." />
    );
  }

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
    logSupabaseError("Client profile lookup failed:", clientProfileError);
  }

  if (!clientProfile) {
    return (
      <RequestDetailShell>
        <section className={SECTION_CARD}>
          <EmptyState
            title="Portal profile pending"
            description={`Signed in as ${user.email}. Please contact Younity Consultancy to finish setting up your portal access.`}
          />
        </section>
      </RequestDetailShell>
    );
  }

  const { data: request, error: requestError } = await supabase
    .from("client_requests")
    .select("id, service, status, message, created_at, updated_at")
    .eq("id", requestId)
    .eq("client_id", clientProfile.id)
    .maybeSingle<ClientRequest>();

  if (requestError) {
    logSupabaseError("Client request lookup failed:", requestError);
    return (
      <RequestNotFoundState title="We could not load this request right now. Please try again or contact Younity Consultancy." />
    );
  }

  if (!request) {
    return (
      <RequestNotFoundState title="Request not found or you do not have access to this request." />
    );
  }

  const [updatesResult, documentsResult, invoicesResult] = await Promise.all([
    supabase
      .from("client_updates")
      .select("id, title, message, created_at")
      .eq("client_id", clientProfile.id)
      .eq("request_id", request.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ClientUpdate[]>(),
    supabase
      .from("client_documents")
      .select(
        "id, document_type, file_name, file_path, status, notes, uploaded_at, requested_at"
      )
      .eq("client_id", clientProfile.id)
      .eq("request_id", request.id)
      .order("uploaded_at", { ascending: false })
      .returns<ClientDocument[]>(),
    supabase
      .from("client_invoices")
      .select("id, invoice_number, amount, status, due_date")
      .eq("client_id", clientProfile.id)
      .eq("request_id", request.id)
      .order("created_at", { ascending: false })
      .returns<ClientInvoice[]>(),
  ]);

  if (updatesResult.error) {
    logSupabaseError("Request updates lookup failed:", updatesResult.error);
  }

  if (documentsResult.error) {
    logSupabaseError("Request documents lookup failed:", documentsResult.error);
  }

  if (invoicesResult.error) {
    logSupabaseError("Request invoices lookup failed:", invoicesResult.error);
  }

  const updates = updatesResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const documentsNeeded = documents.filter(isDocumentNeeded);
  const uploadedDocuments = documents.filter(
    (document) => document.status !== "Requested" || isRealUploadedDocument(document)
  );
  const serviceLabel = friendlyPortalText(request.service);

  return (
    <RequestDetailShell
      fullName={clientProfile.full_name}
      breadcrumb={
        <nav
          className="detail-fade-up text-[12px] text-slate-500"
          style={{ animationDelay: "0ms" }}
          aria-label="Breadcrumb"
        >
          <Link
            href="/client/dashboard"
            prefetch={false}
            className="action-link text-[#244285] hover:text-[#06111f]"
          >
            ← Dashboard
          </Link>
          <span className="text-slate-400"> / </span>
          <span className="text-[#06111f]">{serviceLabel}</span>
        </nav>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          className="detail-fade-up space-y-6"
          style={{ animationDelay: "40ms" }}
        >
          <section className={SECTION_CARD}>
            <h2 className={SECTION_HEADING}>Request Details</h2>
            <dl className="mt-3">
              <DetailRow
                label="Service"
                value={serviceLabel}
              />
              <DetailRow
                label="Status"
                value={<RequestStatusBadge status={request.status} />}
              />
              <DetailRow
                label="Message"
                value={request.message || "Not provided"}
              />
              <DetailRow
                label="Created date"
                value={formatDate(request.created_at)}
              />
              <DetailRow
                label="Last updated"
                value={formatDate(request.updated_at)}
              />
            </dl>
          </section>

          <StatusStepper status={request.status} />
        </div>

        <div className="space-y-6">
          <section
            className={`${SECTION_CARD} detail-fade-up`}
            style={{ animationDelay: "100ms" }}
          >
            <h2 className={SECTION_HEADING}>Recent Updates</h2>

            {updates.length ? (
              <div className="mt-4 divide-y divide-[#06111f]/8">
                {updates.map((update) => (
                  <article
                    key={update.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-sm font-medium text-[#06111f]">
                        {friendlyPortalText(update.title)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {formatDate(update.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {friendlyPortalText(update.message)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="No recent updates yet." />
              </div>
            )}
          </section>

          <section
            className={`${SECTION_CARD} detail-fade-up`}
            style={{ animationDelay: "160ms" }}
          >
            <h2 className={SECTION_HEADING}>Documents Needed</h2>

            {documentsNeeded.length ? (
              <div className="mt-4 divide-y divide-[#06111f]/8">
                {documentsNeeded.map((document) => (
                  <article key={document.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[#06111f]">
                        {friendlyPortalText(document.document_type)}
                      </p>
                      <DocumentStatusBadge status={document.status} />
                    </div>
                    {document.notes ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {document.notes}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      Requested {formatDate(document.requested_at)}
                    </p>
                    <div className="mt-4 rounded-xl border border-[#06111f]/10 bg-[#f6f9fc] p-4">
                      <UploadForm
                        requests={[
                          {
                            id: request.id,
                            service: request.service,
                            status: request.status,
                          },
                        ]}
                        fixedRequestId={request.id}
                        documentRequestId={document.id}
                        initialDocumentType={document.document_type}
                        lockDocumentType
                        compact
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="No requested documents are outstanding for this request." />
              </div>
            )}
          </section>

          <section
            className={`${SECTION_CARD} detail-fade-up`}
            style={{ animationDelay: "220ms" }}
          >
            <h2 className={SECTION_HEADING}>Upload Additional Document</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Supporting files are stored securely and linked directly to this
              request.
            </p>
            <UploadForm
              requests={[
                { id: request.id, service: request.service, status: request.status },
              ]}
              fixedRequestId={request.id}
              compact
            />
          </section>

          <section
            className={`${SECTION_CARD} detail-fade-up`}
            style={{ animationDelay: "280ms" }}
          >
            <h2 className={SECTION_HEADING}>Uploaded Documents</h2>

            {uploadedDocuments.length ? (
              <div className="mt-4 divide-y divide-[#06111f]/8">
                {uploadedDocuments.map((document) => (
                  <article
                    key={document.id}
                    className="doc-row grid gap-2 rounded-lg px-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#06111f]">
                        {friendlyPortalText(document.document_type)}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {document.file_name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-slate-600 sm:items-end sm:text-right">
                      <DocumentStatusBadge status={document.status} />
                      <p>{formatDate(document.uploaded_at)}</p>
                      {isRealUploadedDocument(document) ? (
                        <Link
                          href={`/api/client/documents/${document.id}/open`}
                          prefetch={false}
                          target="_blank"
                          rel="noreferrer"
                          className="action-link font-medium text-[#244285] hover:text-[#06111f]"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="No documents have been uploaded for this request yet." />
              </div>
            )}
          </section>

          <section
            className={`${SECTION_CARD} detail-fade-up`}
            style={{ animationDelay: "340ms" }}
          >
            <h2 className={SECTION_HEADING}>Related Invoices</h2>

            {invoices.length ? (
              <div className="mt-4 divide-y divide-[#06111f]/8">
                {invoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice.status);

                  return (
                    <article
                      key={invoice.id}
                      className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#06111f]">
                          {invoice.invoice_number || "Invoice number pending"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Due: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-slate-600 sm:items-end sm:text-right">
                        <p>{formatMoney(invoice.amount)}</p>
                        <InvoiceStatusBadge status={status} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState title="No invoices are available for this request yet." />
              </div>
            )}
          </section>
        </div>
      </section>
    </RequestDetailShell>
  );
}
