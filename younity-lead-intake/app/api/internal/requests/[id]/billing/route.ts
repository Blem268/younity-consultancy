import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedInvoiceStatuses = new Set([
  "Not Ready",
  "Ready for Billing",
  "Invoice Drafted",
  "Invoice Sent",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
]);

type RequestRecord = {
  id: string;
  client_id: string;
};

type BillingBody = {
  billingType?: unknown;
  estimatedFee?: unknown;
  depositRequired?: unknown;
  amountPaid?: unknown;
  balanceDue?: unknown;
  invoiceStatus?: unknown;
  invoiceId?: unknown;
  note?: unknown;
  visibleToClient?: unknown;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "string" ? value.trim() || null : null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalMoney(value: unknown) {
  if (value === undefined) {
    return { provided: false as const, value: null };
  }

  if (value === null || value === "") {
    return { provided: true as const, value: null };
  }

  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return { provided: true as const, value: undefined };
  }

  return { provided: true as const, value: amount };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const { id } = await params;
  const requestId = typeof id === "string" ? id.trim() : "";

  if (!requestId || !isUuid(requestId)) {
    return NextResponse.json({ message: "Invalid request ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as BillingBody;
  const invoiceStatus = getOptionalString(body.invoiceStatus);
  const note = getString(body.note).slice(0, 2000);
  const visibleToClient = body.visibleToClient === true;

  if (invoiceStatus && !allowedInvoiceStatuses.has(invoiceStatus)) {
    return NextResponse.json(
      { message: "Selected invoice status is not valid." },
      { status: 400 }
    );
  }

  const moneyFields = [
    ["estimated_fee", getOptionalMoney(body.estimatedFee)],
    ["deposit_required", getOptionalMoney(body.depositRequired)],
    ["amount_paid", getOptionalMoney(body.amountPaid)],
    ["balance_due", getOptionalMoney(body.balanceDue)],
  ] as const;

  if (moneyFields.some(([, field]) => field.provided && field.value === undefined)) {
    return NextResponse.json(
      { message: "Billing amounts must be valid numbers." },
      { status: 400 }
    );
  }

  const updates: Record<string, string | number | null> = {
    updated_at: new Date().toISOString(),
  };
  const billingType = getOptionalString(body.billingType);
  const invoiceId = getOptionalString(body.invoiceId);

  if (billingType !== undefined) {
    updates.billing_type = billingType;
  }
  for (const [field, fieldValue] of moneyFields) {
    if (fieldValue.provided) {
      updates[field] = fieldValue.value ?? null;
    }
  }
  if (invoiceStatus !== undefined) {
    updates.invoice_status = invoiceStatus;
  }
  if (invoiceId !== undefined) {
    updates.zoho_books_invoice_id = invoiceId;
  }

  const supabaseAdmin = createAdminClient();
  const { data: existingRequest, error: lookupError } = await supabaseAdmin
    .from("client_requests")
    .select("id, client_id")
    .eq("id", requestId)
    .maybeSingle<RequestRecord>();

  if (lookupError) {
    console.error("Internal request billing lookup failed:", {
      message: lookupError.message,
      code: lookupError.code,
    });
    await logWorkflowError({
      source: "internal_request_billing_update",
      message: "Request lookup failed before billing update.",
      context: { error: lookupError, requestId },
      relatedRequestId: requestId,
    });
    return NextResponse.json(
      { message: "Billing information could not be updated." },
      { status: 500 }
    );
  }

  if (!existingRequest) {
    return NextResponse.json({ message: "Request not found." }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("client_requests")
    .update(updates)
    .eq("id", existingRequest.id);

  if (updateError) {
    console.error("Internal request billing update failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    await logWorkflowError({
      source: "internal_request_billing_update",
      message: "Request billing update failed.",
      context: {
        error: updateError,
        requestId,
        invoiceStatus,
      },
      relatedClientId: existingRequest.client_id,
      relatedRequestId: existingRequest.id,
    });
    return NextResponse.json(
      { message: "Billing information could not be updated." },
      { status: 500 }
    );
  }

  if (note || visibleToClient) {
    const { error: updateInsertError } = await supabaseAdmin
      .from("client_updates")
      .insert({
        client_id: existingRequest.client_id,
        request_id: existingRequest.id,
        title: "Billing information updated",
        message: note || "Billing information for your request was updated.",
        created_by: "Younity Consultancy",
      });

    if (updateInsertError) {
      console.error("Internal request billing timeline insert failed:", {
        message: updateInsertError.message,
        code: updateInsertError.code,
      });
      await logWorkflowError({
        source: "internal_request_billing_update",
        severity: "warning",
        message: "Billing information was updated, but client timeline update failed.",
        context: { error: updateInsertError, requestId, invoiceStatus },
        relatedClientId: existingRequest.client_id,
        relatedRequestId: existingRequest.id,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Billing updated, but the client timeline note could not be saved.",
        },
        { status: 207 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: "Billing information updated.",
  });
}
