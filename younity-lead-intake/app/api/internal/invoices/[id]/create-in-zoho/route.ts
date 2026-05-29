import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isZohoBooksConfigured,
  getZohoBooksAccessToken,
  createZohoInvoice,
} from "@/lib/zoho/booksClient";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

type InvoiceRecord = {
  id: string;
  client_id: string;
  request_id: string | null;
  amount: number | string | null;
  billing_type: string | null;
  status: string | null;
  zoho_books_invoice_id: string | null;
  clients: {
    full_name: string | null;
    email: string | null;
    company: string | null;
  } | null;
  client_requests: {
    id: string;
    service: string | null;
    invoice_status: string | null;
  } | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await getInternalAdminUser();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const invoiceId = typeof id === "string" ? id.trim() : "";

  if (!invoiceId || !isUuid(invoiceId)) {
    return NextResponse.json({ message: "Invalid invoice ID." }, { status: 400 });
  }

  if (!isZohoBooksConfigured()) {
    return NextResponse.json(
      {
        message:
          "Zoho Books is not yet configured. Add ZOHO_BOOKS_CLIENT_ID, ZOHO_BOOKS_CLIENT_SECRET, ZOHO_BOOKS_REFRESH_TOKEN, and ZOHO_BOOKS_ORG_ID to your environment variables.",
      },
      { status: 503 }
    );
  }

  const supabaseAdmin = createAdminClient();

  const { data: invoice, error: lookupError } = await supabaseAdmin
    .from("client_invoices")
    .select(
      "id, client_id, request_id, amount, billing_type, status, zoho_books_invoice_id, clients(full_name, email, company), client_requests(id, service, invoice_status)"
    )
    .eq("id", invoiceId)
    .maybeSingle<InvoiceRecord>();

  if (lookupError) {
    console.error("create-in-zoho invoice lookup failed:", {
      message: lookupError.message,
      code: lookupError.code,
    });
    return NextResponse.json(
      { message: "Invoice could not be retrieved." },
      { status: 500 }
    );
  }

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
  }

  if (invoice.zoho_books_invoice_id) {
    return NextResponse.json(
      {
        message: "This invoice has already been created in Zoho Books.",
        zohoInvoiceId: invoice.zoho_books_invoice_id,
      },
      { status: 409 }
    );
  }

  const clientName =
    invoice.clients?.full_name ??
    invoice.clients?.company ??
    "Unknown Client";
  const clientEmail = invoice.clients?.email ?? "";
  const serviceName =
    invoice.client_requests?.service ?? "Younity Consultancy Service";
  const amount =
    typeof invoice.amount === "number"
      ? invoice.amount
      : invoice.amount
        ? Number(invoice.amount)
        : 0;

  let accessToken: string;

  try {
    accessToken = await getZohoBooksAccessToken();
  } catch (err) {
    console.error("Zoho token refresh failed:", err);
    await logWorkflowError({
      source: "zoho_books_create_invoice",
      message: "Zoho Books token refresh failed.",
      context: { invoiceId, error: String(err) },
      relatedClientId: invoice.client_id,
    });
    return NextResponse.json(
      { message: "Could not connect to Zoho Books. Please try again." },
      { status: 502 }
    );
  }

  let zohoInvoiceId: string;
  let zohoInvoiceNumber: string;

  try {
    const result = await createZohoInvoice(accessToken, {
      customerName: clientName,
      customerEmail: clientEmail,
      lineItems: [
        {
          name: serviceName,
          rate: amount,
          quantity: 1,
          description: invoice.billing_type ?? "",
        },
      ],
      referenceNumber: invoiceId,
      notes: `Younity Consultancy – ${serviceName}`,
    });
    zohoInvoiceId = result.invoiceId;
    zohoInvoiceNumber = result.invoiceNumber;
  } catch (err) {
    console.error("Zoho Books create invoice failed:", err);
    await logWorkflowError({
      source: "zoho_books_create_invoice",
      message: "Zoho Books invoice creation failed.",
      context: { invoiceId, clientId: invoice.client_id, error: String(err) },
      relatedClientId: invoice.client_id,
    });
    return NextResponse.json(
      { message: "Zoho Books invoice could not be created. Please try again." },
      { status: 502 }
    );
  }

  const { error: updateInvoiceError } = await supabaseAdmin
    .from("client_invoices")
    .update({
      zoho_books_invoice_id: zohoInvoiceId,
      invoice_number: zohoInvoiceNumber,
      status: "Sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (updateInvoiceError) {
    console.error("client_invoices post-zoho update failed:", {
      message: updateInvoiceError.message,
      code: updateInvoiceError.code,
    });
    await logWorkflowError({
      source: "zoho_books_create_invoice",
      severity: "warning",
      message: "Zoho invoice created but local invoice record could not be updated.",
      context: { invoiceId, zohoInvoiceId, error: updateInvoiceError },
      relatedClientId: invoice.client_id,
    });
  }

  if (invoice.request_id) {
    const { error: updateRequestError } = await supabaseAdmin
      .from("client_requests")
      .update({
        invoice_status: "Invoice Sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.request_id);

    if (updateRequestError) {
      console.error("client_requests invoice_status post-zoho update failed:", {
        message: updateRequestError.message,
        code: updateRequestError.code,
      });
      await logWorkflowError({
        source: "zoho_books_create_invoice",
        severity: "warning",
        message:
          "Zoho invoice created but request invoice_status could not be updated to Invoice Sent.",
        context: {
          invoiceId,
          requestId: invoice.request_id,
          error: updateRequestError,
        },
        relatedClientId: invoice.client_id,
        relatedRequestId: invoice.request_id,
      });
    }
  }

  return NextResponse.json({
    success: true,
    zohoInvoiceId,
    zohoInvoiceNumber,
    message: `Invoice ${zohoInvoiceNumber} created in Zoho Books.`,
  });
}
