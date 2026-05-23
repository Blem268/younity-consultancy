import { NextResponse } from "next/server";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { logWorkflowError } from "@/lib/internal/workflowErrors";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedStatuses = new Set([
  "Submitted",
  "Under Review",
  "Waiting on Documents",
  "In Progress",
  "Internal Review",
  "Waiting on Client",
  "Completed",
  "Closed",
]);

type RequestRecord = {
  id: string;
  client_id: string;
};

type StatusBody = {
  status?: unknown;
  note?: unknown;
  visibleToClient?: unknown;
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

  const body = (await request.json().catch(() => ({}))) as StatusBody;
  const status = getString(body.status);
  const note = getString(body.note).slice(0, 2000);
  const visibleToClient = body.visibleToClient === true;

  if (!allowedStatuses.has(status)) {
    return NextResponse.json(
      { message: "Selected request status is not valid." },
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
    console.error("Internal request status lookup failed:", {
      message: lookupError.message,
      code: lookupError.code,
    });
    await logWorkflowError({
      source: "internal_request_status_update",
      message: "Request lookup failed before status update.",
      context: { error: lookupError, requestId },
      relatedRequestId: requestId,
    });
    return NextResponse.json(
      { message: "Request status could not be updated." },
      { status: 500 }
    );
  }

  if (!existingRequest) {
    return NextResponse.json({ message: "Request not found." }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("client_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingRequest.id);

  if (updateError) {
    console.error("Internal request status update failed:", {
      message: updateError.message,
      code: updateError.code,
    });
    await logWorkflowError({
      source: "internal_request_status_update",
      message: "Request status update failed.",
      context: { error: updateError, requestId, status },
      relatedClientId: existingRequest.client_id,
      relatedRequestId: existingRequest.id,
    });
    return NextResponse.json(
      { message: "Request status could not be updated." },
      { status: 500 }
    );
  }

  if (note || visibleToClient) {
    const { error: updateInsertError } = await supabaseAdmin
      .from("client_updates")
      .insert({
        client_id: existingRequest.client_id,
        request_id: existingRequest.id,
        title: "Request status updated",
        message: note || `Your request status was updated to ${status}.`,
        created_by: "Younity Consultancy",
      });

    if (updateInsertError) {
      console.error("Internal request status timeline insert failed:", {
        message: updateInsertError.message,
        code: updateInsertError.code,
      });
      await logWorkflowError({
        source: "internal_request_status_update",
        severity: "warning",
        message: "Request status was updated, but client timeline update failed.",
        context: { error: updateInsertError, requestId, status },
        relatedClientId: existingRequest.client_id,
        relatedRequestId: existingRequest.id,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Status updated, but the client timeline note could not be saved.",
        },
        { status: 207 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: "Request status updated.",
  });
}
