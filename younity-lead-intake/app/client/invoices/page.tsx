import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyPortalText } from "@/lib/client/portal-text";
import {
  getInvoiceDisplayStatusForToday,
  getInvoiceSecondaryDetail,
  getInvoiceSubtitle,
  isOutstandingInvoiceStatus,
  loadClientPortalInvoices,
} from "@/lib/invoices/clientPortalInvoices";
import { PortalClientHeader } from "../portal-client-header";
import { InvoiceStatusBadge } from "@/app/components/ui/status-badges";
import { ServiceIcon } from "../service-icon";
import { brand } from "@/app/components/ui/brand";

export const dynamic = "force-dynamic";

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

type ClientProfile = {
  id: string;
  full_name: string;
};

function InvoiceList({
  invoices,
  today,
}: {
  invoices: Awaited<ReturnType<typeof loadClientPortalInvoices>>["invoices"];
  today: string;
}) {
  if (!invoices.length) {
    return null;
  }

  return (
    <div className="divide-y divide-[#06111f]/8">
      {invoices.map((invoice) => {
        const displayStatus = getInvoiceDisplayStatusForToday(invoice, today);
        const serviceName = invoice.service ?? "Other";

        return (
          <Link
            key={invoice.id}
            href={
              invoice.request_id
                ? `/client/requests/${invoice.request_id}`
                : "/client/invoices"
            }
            prefetch={false}
            className="req-row flex items-center gap-4 px-4 py-4"
          >
            <ServiceIcon service={serviceName} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-[#06111f]">
                {friendlyPortalText(serviceName)}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-slate-500">
                {getInvoiceSubtitle(invoice)}
              </span>
              <span className="mt-1 block text-[11.5px] text-slate-500">
                {getInvoiceSecondaryDetail(displayStatus, invoice.amount)}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-2">
              <InvoiceStatusBadge status={displayStatus} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function InvoiceSection({
  title,
  description,
  animationDelay,
  children,
}: {
  title: string;
  description?: string;
  animationDelay: string;
  children: ReactNode;
}) {
  const listDelay = `${Number.parseInt(animationDelay, 10) + 20}ms`;

  return (
    <section>
      <div
        className="list-fade-up mb-3"
        style={{ animationDelay }}
      >
        <h2 className="text-sm font-medium text-[#06111f]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[12px] text-slate-500">{description}</p>
        ) : null}
      </div>
      <div
        className="list-fade-up overflow-hidden rounded-xl border-[0.5px] border-[#06111f]/10 bg-white"
        style={{ animationDelay: listDelay }}
      >
        {children}
      </div>
    </section>
  );
}

export default async function ClientInvoicesPage() {
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
      <div className="invoices-page flex min-h-screen flex-col">
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

  const today = new Date().toISOString().slice(0, 10);
  const { invoices, error: invoicesError } = await loadClientPortalInvoices(
    supabase,
    clientProfile.id
  );

  if (invoicesError) {
    console.error("Client invoices lookup failed:", invoicesError);
  }

  const outstanding = invoices.filter((invoice) =>
    isOutstandingInvoiceStatus(invoice.status)
  );
  const history = invoices.filter(
    (invoice) => !isOutstandingInvoiceStatus(invoice.status)
  );

  return (
    <div className="invoices-page flex min-h-screen flex-col">
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

          <div
            className="list-fade-up"
            style={{ animationDelay: "30ms" }}
          >
            <h1 className="text-[20px] font-medium tracking-tight text-[#06111f]">
              Invoices
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Outstanding balances and payment history for your requests.
            </p>
          </div>

          {invoicesError ? (
            <section
              className={`${SECTION_CARD} list-fade-up`}
              style={{ animationDelay: "60ms" }}
            >
              <EmptyState
                title="Invoices unavailable"
                description="Please refresh the page. If this continues, contact Younity Consultancy."
              />
            </section>
          ) : invoices.length === 0 ? (
            <section
              className={`${SECTION_CARD} list-fade-up`}
              style={{ animationDelay: "60ms" }}
            >
              <EmptyState
                title="No invoices yet"
                description="Invoices will appear here when billing is ready for your completed requests."
              />
            </section>
          ) : (
            <div className="space-y-6">
              {outstanding.length > 0 ? (
                <InvoiceSection
                  title="Outstanding"
                  description="Invoices awaiting payment or still being prepared."
                  animationDelay="60"
                >
                  <InvoiceList invoices={outstanding} today={today} />
                </InvoiceSection>
              ) : null}

              {history.length > 0 ? (
                <InvoiceSection
                  title="Payment history"
                  animationDelay={outstanding.length ? "120" : "60"}
                >
                  <InvoiceList invoices={history} today={today} />
                </InvoiceSection>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
