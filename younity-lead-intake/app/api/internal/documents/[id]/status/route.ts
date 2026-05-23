import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedDocumentStatuses = new Set([
  "Submitted",
  "Received",
  "Under Review",
  "Approved",
  "Rejected",
  "Needs Replacement",
]);

type DocumentRecord = {
  id: string;
  client_id: string;
  request_id: string | null;
};

type DocumentStatusBody = {
  status?: unknown;
  note?: unknown;
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
  const documentId = typeof id === "string" ? id.trim() : "";

  if (!documentId || !isUuid(documentId)) {
    return NextResponse.json({ message: "Invalid document ID." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as DocumentStatusBody;
  const status = getString(body.status);
  const note = getString(body.note).slice(0, 2000);

  if (!allowedDocumentStatuses.has(status)) {
    return NextResponse.json(
      { message: "Selected document status is not valid." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data: existingDocument, error: lookupError } = await supabaseAdmin
    .from("client_documents")
    .select("id, client_id, request_id")
    .eq("id", documentId)
    .maybeSingle<DocumentRecord>();

  if (lookupError) {
    console.error("Internal document status lookup failed:", {
      message: lookupError.message,
      code: lookupError.code,
    });
    await logWorkflowError({
      source: "internal_document_status_update",
      message: "Document lookup failed before status update.",
      context: { error: lookupError, documentId },
      relatedDocumentId: documentId,
    });
    return NextResponse.json(
      { message: "Document status could not be updated." },
      { status: 500 }
    );
  }

  if (!existingDocument) {
    return NextResponse.json({ message: "Document not found." }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("client_documents")
    .update({ status })
    .eq("id", existingDocument.id);

  if (updateError) {
    console.error("Internal document status update failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    await logWorkflowError({
      source: "internal_document_status_update",
      message: "Document status update failed.",
      context: { error: updateError, documentId, status },
      relatedClientId: existingDocument.client_id,
      relatedRequestId: existingDocument.request_id,
      relatedDocumentId: existingDocument.id,
    });
    return NextResponse.json(
      { message: "Document status could not be updated." },
      { status: 500 }
    );
  }

  if (note && existingDocument.request_id) {
    const { error: updateInsertError } = await supabaseAdmin
      .from("client_updates")
      .insert({
        client_id: existingDocument.client_id,
        request_id: existingDocument.request_id,
        title: "Document status updated",
        message: note,
        created_by: "Younity Consultancy",
      });

    if (updateInsertError) {
      console.error("Internal document status timeline insert failed:", {
        message: updateInsertError.message,
        code: updateInsertError.code,
      });
      await logWorkflowError({
        source: "internal_document_status_update",
        severity: "warning",
        message: "Document status was updated, but client timeline update failed.",
        context: { error: updateInsertError, documentId, status },
        relatedClientId: existingDocument.client_id,
        relatedRequestId: existingDocument.request_id,
        relatedDocumentId: existingDocument.id,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Document status updated, but the client timeline note could not be saved.",
        },
        { status: 207 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: "Document status updated.",
  });
}
