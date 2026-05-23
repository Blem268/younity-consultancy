import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedDocumentTypes = new Set([
  "Bank Statement",
  "Payroll Document",
  "Tax Document",
  "Company Registration",
  "Invoice/Receipt",
  "ID Document",
  "Employee List",
  "Financial Report",
  "Other",
]);

type RequestRecord = {
  id: string;
  client_id: string;
};

type DocumentRequestBody = {
  documentType?: unknown;
  message?: unknown;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

  const body = (await request.json().catch(() => ({}))) as DocumentRequestBody;
  const documentType = getString(body.documentType);
  const message = getString(body.message).slice(0, 2000);

  if (!allowedDocumentTypes.has(documentType)) {
    return NextResponse.json(
      { message: "Selected document type is not valid." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data: existingRequest, error: lookupError } = await supabaseAdmin
    .from("client_requests")
    .select("id, client_id")
    .eq("id", requestId)
    .maybeSingle<RequestRecord>();

  if (lookupError) {
    console.error("Internal document request lookup failed:", {
      message: lookupError.message,
      code: lookupError.code,
    });
    await logWorkflowError({
      source: "internal_document_request",
      message: "Request lookup failed before document request.",
      context: { error: lookupError, requestId, documentType },
      relatedRequestId: requestId,
    });
    return NextResponse.json(
      { message: "Document request could not be added." },
      { status: 500 }
    );
  }

  if (!existingRequest) {
    return NextResponse.json({ message: "Request not found." }, { status: 404 });
  }

  const { error: insertError } = await supabaseAdmin.from("client_updates").insert({
    client_id: existingRequest.client_id,
    request_id: existingRequest.id,
    title: "Document requested",
    message: message || `Please upload: ${documentType}.`,
    created_by: "Younity Consultancy",
  });

  if (insertError) {
    console.error("Internal document request insert failed:", {
      message: insertError.message,
      code: insertError.code,
    });
    await logWorkflowError({
      source: "internal_document_request",
      message: "Document request timeline update failed.",
      context: { error: insertError, requestId, documentType },
      relatedClientId: existingRequest.client_id,
      relatedRequestId: existingRequest.id,
    });
    return NextResponse.json(
      { message: "Document request could not be added." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Document request added to the client timeline.",
  });
}
