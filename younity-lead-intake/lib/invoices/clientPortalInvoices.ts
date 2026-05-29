import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPortalDate } from "@/lib/client/portal-text";
import {
  getInvoiceDisplayStatus,
  OUTSTANDING_INVOICE_STATUS_NOT_IN,
} from "@/lib/invoices/outstanding";

export type ClientPortalInvoice = {
  id: string;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  due_date: string | null;
  created_at: string | null;
  request_id: string | null;
  service: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  due_date: string | null;
  created_at: string | null;
  request_id: string | null;
};

async function enrichInvoicesWithServices(
  supabase: SupabaseClient,
  rows: InvoiceRow[]
): Promise<ClientPortalInvoice[]> {
  const requestIds = [
    ...new Set(
      rows
        .map((row) => row.request_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];

  const serviceByRequestId = new Map<string, string>();

  if (requestIds.length > 0) {
    const { data: requests } = await supabase
      .from("client_requests")
      .select("id, service")
      .in("id", requestIds);

    for (const request of requests ?? []) {
      serviceByRequestId.set(request.id, request.service);
    }
  }

  return rows.map((row) => ({
    ...row,
    service: row.request_id
      ? (serviceByRequestId.get(row.request_id) ?? null)
      : null,
  }));
}

export async function loadClientPortalInvoices(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ invoices: ClientPortalInvoice[]; error: string | null }> {
  const { data: invoices, error } = await supabase
    .from("client_invoices")
    .select("id, invoice_number, amount, status, due_date, created_at, request_id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return { invoices: [], error: error.message };
  }

  return {
    invoices: await enrichInvoicesWithServices(supabase, invoices ?? []),
    error: null,
  };
}

export async function loadOutstandingClientPortalInvoices(
  supabase: SupabaseClient,
  clientId: string,
  limit = 8
): Promise<{ invoices: ClientPortalInvoice[]; error: string | null }> {
  const { data: invoices, error } = await supabase
    .from("client_invoices")
    .select("id, invoice_number, amount, status, due_date, created_at, request_id")
    .eq("client_id", clientId)
    .not("status", "in", OUTSTANDING_INVOICE_STATUS_NOT_IN)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { invoices: [], error: error.message };
  }

  return {
    invoices: await enrichInvoicesWithServices(supabase, invoices ?? []),
    error: null,
  };
}

export function formatInvoiceMoney(value: number | string | null | undefined) {
  const amount =
    typeof value === "number"
      ? value
      : value !== null && value !== ""
        ? Number(value)
        : NaN;

  if (!Number.isFinite(amount) || amount <= 0) {
    return "XCD 0.00";
  }

  return `XCD ${new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function getInvoiceSubtitle(invoice: ClientPortalInvoice) {
  if (invoice.invoice_number) {
    return `Invoice ${invoice.invoice_number}`;
  }

  if (invoice.due_date) {
    return `Due ${formatPortalDate(invoice.due_date)}`;
  }

  if (invoice.created_at) {
    return `Issued ${formatPortalDate(invoice.created_at)}`;
  }

  return "Invoice from Younity";
}

export function getInvoiceSecondaryDetail(
  displayStatus: string,
  amount: number | string | null
) {
  if (displayStatus === "Overdue") {
    return "Payment overdue — please arrange payment soon";
  }

  const money = formatInvoiceMoney(amount);

  if (displayStatus === "Draft") {
    return `${money} · invoice being prepared`;
  }

  if (displayStatus === "Sent") {
    return `${money} · payment due`;
  }

  if (displayStatus === "Paid") {
    return `${money} · paid`;
  }

  if (displayStatus === "Cancelled") {
    return `${money} · cancelled`;
  }

  return `${money} · payment pending`;
}

export function getInvoiceDisplayStatusForToday(
  invoice: Pick<ClientPortalInvoice, "status" | "due_date">,
  today: string
) {
  return getInvoiceDisplayStatus(invoice.status, invoice.due_date, today);
}

export function isOutstandingInvoiceStatus(status: string | null) {
  return status !== "Paid" && status !== "Cancelled";
}
