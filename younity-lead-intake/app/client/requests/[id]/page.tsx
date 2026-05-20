import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BackLinks,
  Card,
  DocumentStatusBadge,
  EmptyState,
  getInvoiceStatus,
  InvoiceStatusBadge,
  PageHeader,
  PortalPage,
  PrimaryButtonLink,
  RequestStatusBadge,
} from "../../portal-ui";

type ClientProfile = {
  id: string;
};

type ClientRequest = {
  id: string;
  service: string;
  status: string;
  message: string | null;
  source: string | null;
  clickup_task_id: string | null;
  billing_type: string | null;
  estimated_fee: number | null;
  deposit_required: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  invoice_status: string | null;
  zoho_books_invoice_id: string | null;
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
  status: string;
  uploaded_at: string | null;
};

type ClientInvoice = {
  id: string;
  invoice_number: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
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

function formatMoney(value: number | null | undefined | "") {
  if (value === null || value === undefined || value === "") {
    return "To Be Reviewed";
  }

  return `XCD ${new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function getBillingNote(status: string) {
  switch (status) {
    case "Ready for Billing":
      return "Your request is ready for billing. An invoice will be prepared shortly.";
    case "Invoice Sent":
      return "Your invoice has been sent. Please check your email or contact Younity Consultancy if you need assistance.";
    case "Paid":
      return "Payment has been received. Thank you.";
    case "Partially Paid":
      return "A partial payment has been recorded. Please review the remaining balance.";
    case "Overdue":
      return "This invoice appears to be overdue. Please contact Younity Consultancy for assistance.";
    case "Not Ready":
    default:
      return "Your billing information is still being reviewed. An invoice is not available yet.";
  }
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm leading-6 text-slate-800">
        {value}
      </dd>
    </div>
  );
}

export default async function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
          title="Request Details"
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

  const { data: request, error: requestError } = await supabase
    .from("client_requests")
    .select(
      "id, service, status, message, source, clickup_task_id, billing_type, estimated_fee, deposit_required, amount_paid, balance_due, invoice_status, zoho_books_invoice_id, created_at, updated_at"
    )
    .eq("id", id)
    .eq("client_id", clientProfile.id)
    .maybeSingle<ClientRequest>();

  if (requestError) {
    console.error("Client request lookup failed:", requestError);
  }

  if (!request) {
    return (
      <PortalPage>
        <PageHeader
          eyebrow={
            <BackLinks
              links={[
                { href: "/client/dashboard", label: "Back to Dashboard" },
                { href: "/client/requests", label: "Back to Requests" },
              ]}
            />
          }
          title="Request Details"
        />

        <Card className="mt-8">
          <EmptyState title="Request not found or you do not have access to this request." />
        </Card>
      </PortalPage>
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
      .select("id, document_type, file_name, status, uploaded_at")
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
    console.error("Request updates lookup failed:", updatesResult.error);
  }

  if (documentsResult.error) {
    console.error("Request documents lookup failed:", documentsResult.error);
  }

  if (invoicesResult.error) {
    console.error("Request invoices lookup failed:", invoicesResult.error);
  }

  const updates = updatesResult.data ?? [];
  const documents = documentsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const invoiceStatus = getInvoiceStatus(request.invoice_status);

  return (
    <PortalPage>
      <PageHeader
        eyebrow={
          <BackLinks
            links={[
              { href: "/client/dashboard", label: "Back to Dashboard" },
              { href: "/client/requests", label: "Back to Requests" },
            ]}
          />
        }
        title={request.service}
        description={<RequestStatusBadge status={request.status} />}
        actions={
          <PrimaryButtonLink href={`/client/documents?requestId=${request.id}`}>
            Upload Document
          </PrimaryButtonLink>
        }
      />

      <section className="grid gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Request Details
          </h2>
          <dl className="mt-4">
            <DetailRow label="Service" value={request.service} />
            <DetailRow
              label="Status"
              value={<RequestStatusBadge status={request.status} />}
            />
            <DetailRow
              label="Message"
              value={request.message || "Not provided"}
            />
            <DetailRow label="Source" value={request.source || "Not provided"} />
            <DetailRow
              label="Created Date"
              value={formatDate(request.created_at)}
            />
            <DetailRow
              label="Last Updated"
              value={formatDate(request.updated_at)}
            />
            {request.clickup_task_id ? (
              <DetailRow label="ClickUp Task ID" value={request.clickup_task_id} />
            ) : null}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                  Billing Information
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {getBillingNote(invoiceStatus)}
                </p>
              </div>
              <InvoiceStatusBadge status={invoiceStatus} />
            </div>

            <dl className="mt-4">
              <DetailRow
                label="Billing Type"
                value={request.billing_type || "To Be Reviewed"}
              />
              <DetailRow
                label="Estimated Fee"
                value={formatMoney(request.estimated_fee)}
              />
              <DetailRow
                label="Deposit Required"
                value={formatMoney(request.deposit_required)}
              />
              <DetailRow
                label="Amount Paid"
                value={formatMoney(request.amount_paid)}
              />
              <DetailRow
                label="Balance Due"
                value={formatMoney(request.balance_due)}
              />
              <DetailRow
                label="Invoice Status"
                value={<InvoiceStatusBadge status={invoiceStatus} />}
              />
              {request.zoho_books_invoice_id ? (
                <DetailRow
                  label="Zoho Books Invoice ID"
                  value={request.zoho_books_invoice_id}
                />
              ) : null}
            </dl>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Recent Updates
            </h2>

            {updates.length ? (
              <div className="mt-5 divide-y divide-slate-200">
                {updates.map((update) => (
                  <article
                    key={update.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-sm font-semibold text-slate-950">
                        {update.title}
                      </h3>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        {formatDate(update.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {update.message}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState title="No recent updates yet." />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Related Documents
            </h2>

            {documents.length ? (
              <div className="mt-5 divide-y divide-slate-200">
                {documents.map((document) => (
                  <article
                    key={document.id}
                    className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {document.document_type}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {document.file_name}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-slate-600 sm:items-end sm:text-right">
                      <DocumentStatusBadge status={document.status} />
                      <p>{formatDate(document.uploaded_at)}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState title="No documents have been uploaded for this request yet." />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Related Invoices
            </h2>

            {invoices.length ? (
              <div className="mt-5 divide-y divide-slate-200">
                {invoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice.status);

                  return (
                    <article
                      key={invoice.id}
                      className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
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
              <div className="mt-5">
                <EmptyState title="No invoices are available yet." />
              </div>
            )}
          </Card>
        </div>
      </section>
    </PortalPage>
  );
}
