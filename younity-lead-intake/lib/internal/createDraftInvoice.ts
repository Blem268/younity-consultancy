import type { SupabaseClient } from "@supabase/supabase-js";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { BILLING_PHASE_REQUEST_STATUSES } from "@/lib/requestWorkflow";

type DraftInvoiceInput = {
  clientId: string;
  requestId: string;
  amount: number | null;
  billingType?: string | null;
  notes?: string;
};

function isMissingColumnError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    message.includes("does not exist") ||
    message.includes("billing_type") ||
    message.includes("notes")
  );
}

export async function createDraftInvoiceForRequest(
  supabaseAdmin: SupabaseClient,
  input: DraftInvoiceInput
): Promise<{ created: boolean; invoiceId: string | null; error: string | null }> {
  const { data: existingRows, error: existingLookupError } = await supabaseAdmin
    .from("client_invoices")
    .select("id")
    .eq("request_id", input.requestId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingLookupError) {
    return { created: false, invoiceId: null, error: existingLookupError.message };
  }

  const existingId = existingRows?.[0]?.id;

  if (existingId) {
    return { created: false, invoiceId: existingId, error: null };
  }

  const fullPayload = {
    client_id: input.clientId,
    request_id: input.requestId,
    amount: input.amount,
    billing_type: input.billingType ?? null,
    status: "Draft",
    notes: input.notes ?? "Auto-created for billing.",
  };

  let insertResult = await supabaseAdmin
    .from("client_invoices")
    .insert(fullPayload)
    .select("id")
    .single<{ id: string }>();

  if (insertResult.error && isMissingColumnError(insertResult.error)) {
    insertResult = await supabaseAdmin
      .from("client_invoices")
      .insert({
        client_id: input.clientId,
        request_id: input.requestId,
        amount: input.amount,
        status: "Draft",
      })
      .select("id")
      .single<{ id: string }>();
  }

  if (insertResult.error) {
    return {
      created: false,
      invoiceId: null,
      error: insertResult.error.message,
    };
  }

  return {
    created: true,
    invoiceId: insertResult.data?.id ?? null,
    error: null,
  };
}

type BillingRequestRow = {
  id: string;
  client_id: string;
  billing_type: string | null;
  estimated_fee: number | string | null;
  status: string;
  invoice_status: string | null;
};

function resolveFee(value: number | string | null) {
  if (typeof value === "number") {
    return value;
  }
  if (value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Create missing draft invoices for requests already in the billing phase. */
export async function ensureDraftInvoicesForBillingRequests(
  supabaseAdmin: SupabaseClient
) {
  const [byStatusResult, byInvoiceStatusResult] = await Promise.all([
    supabaseAdmin
      .from("client_requests")
      .select("id, client_id, billing_type, estimated_fee, status, invoice_status")
      .in("status", [...BILLING_PHASE_REQUEST_STATUSES])
      .returns<BillingRequestRow[]>(),
    supabaseAdmin
      .from("client_requests")
      .select("id, client_id, billing_type, estimated_fee, status, invoice_status")
      .eq("invoice_status", "Ready for Billing")
      .returns<BillingRequestRow[]>(),
  ]);

  if (byStatusResult.error) {
    console.error("ensureDraftInvoices status lookup failed:", byStatusResult.error);
  }

  if (byInvoiceStatusResult.error) {
    console.error(
      "ensureDraftInvoices invoice_status lookup failed:",
      byInvoiceStatusResult.error
    );
  }

  const seen = new Set<string>();
  const requests: BillingRequestRow[] = [];

  for (const row of [
    ...(byStatusResult.data ?? []),
    ...(byInvoiceStatusResult.data ?? []),
  ]) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    requests.push(row);
  }

  for (const request of requests) {
    const result = await createDraftInvoiceForRequest(supabaseAdmin, {
      clientId: request.client_id,
      requestId: request.id,
      amount: resolveFee(request.estimated_fee),
      billingType: request.billing_type,
      notes: `Auto-created for request in billing (${request.status}).`,
    });

    if (result.error) {
      await logWorkflowError({
        source: "billing_ensure_draft_invoice",
        severity: "warning",
        message: "Could not create draft invoice for billing-phase request.",
        context: { error: result.error, requestId: request.id },
        relatedClientId: request.client_id,
        relatedRequestId: request.id,
      });
    }
  }
}
