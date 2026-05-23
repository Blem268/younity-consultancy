import { Resend } from "resend";
import twilio from "twilio";
import { NextResponse } from "next/server";
import { appendLeadToSheet } from "@/lib/integrations/googleSheets";
import {
  addClickUpDocumentUploadComment,
  addClickUpTaskItemClientUpdateComment,
  attachFileToClickUpTask,
} from "@/lib/integrations/clickup";
import {
  sendClientConfirmationEmail,
  sendDocumentUploadNotificationEmail,
  sendLeadNotificationEmail,
  sendPortalRequestNotificationEmail,
} from "@/lib/integrations/email";
import {
  sendInternalWhatsAppDocumentUploadNotification,
  sendInternalWhatsAppLeadNotification,
  sendInternalWhatsAppPortalRequestNotification,
} from "@/lib/integrations/whatsapp";
import { getInternalAdminUser } from "@/lib/internal/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type RetryType =
  | "resend_email"
  | "twilio_whatsapp"
  | "google_sheets_log"
  | "clickup_comment"
  | "clickup_attachment";

type WorkflowErrorRecord = {
  id: string;
  source: string;
  context: unknown;
  retryable: boolean;
  retry_attempts: number | null;
};

const insufficientContextMessage =
  "This error is marked retryable, but does not contain enough safe context to retry automatically.";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function getRetryType(workflowError: WorkflowErrorRecord): RetryType | null {
  const contextRetryType = isRecord(workflowError.context)
    ? getString(workflowError.context.retryType)
    : "";

  if (
    contextRetryType === "resend_email" ||
    contextRetryType === "twilio_whatsapp" ||
    contextRetryType === "google_sheets_log" ||
    contextRetryType === "clickup_comment" ||
    contextRetryType === "clickup_attachment"
  ) {
    return contextRetryType;
  }

  const source = workflowError.source.toLowerCase();

  if (source.includes("google-sheets")) {
    return "google_sheets_log";
  }

  if (source.includes("whatsapp")) {
    return "twilio_whatsapp";
  }

  if (source.includes("email")) {
    return "resend_email";
  }

  if (source.includes("clickup") && source.includes("attachment")) {
    return "clickup_attachment";
  }

  if (source.includes("clickup") && source.includes("comment")) {
    return "clickup_comment";
  }

  return null;
}

function getRetryPayload(context: unknown) {
  if (!isRecord(context) || !isRecord(context.retryPayload)) {
    return null;
  }

  return context.retryPayload;
}

async function retryResendEmail(payload: Record<string, unknown>) {
  const emailKind = getString(payload.emailKind);

  if (emailKind === "lead_notification" && isRecord(payload.input)) {
    await sendLeadNotificationEmail({
      lead: getLeadPayload(payload.input.lead),
      zohoLeadId: getString(payload.input.zohoLeadId),
      clickUpTaskId: getString(payload.input.clickUpTaskId),
      clickUpTaskUrl: getString(payload.input.clickUpTaskUrl),
    });
    return;
  }

  if (emailKind === "client_confirmation" && isRecord(payload.input)) {
    await sendClientConfirmationEmail({
      lead: getLeadPayload(payload.input.lead),
    });
    return;
  }

  if (emailKind === "document_upload_notification" && isRecord(payload.input)) {
    await sendDocumentUploadNotificationEmail(getDocumentUploadPayload(payload.input));
    return;
  }

  if (emailKind === "portal_request_notification" && isRecord(payload.input)) {
    await sendPortalRequestNotificationEmail(getPortalRequestPayload(payload.input));
    return;
  }

  const to = getString(payload.to);
  const subject = getString(payload.subject);
  const html = getString(payload.html);
  const text = getString(payload.text);

  if (!to || !subject || (!html && !text)) {
    throw new Error("Missing safe retry payload.");
  }

  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const result = await resend.emails.send({
    from: requireEnv("RESEND_FROM_EMAIL"),
    to,
    subject,
    ...(html ? { html } : { text }),
  });

  if (result.error) {
    throw new Error("Resend retry failed.");
  }
}

async function retryTwilioWhatsApp(payload: Record<string, unknown>) {
  const whatsappKind = getString(payload.whatsappKind);

  if (whatsappKind === "lead_notification" && isRecord(payload.input)) {
    await sendInternalWhatsAppLeadNotification({
      lead: getLeadPayload(payload.input.lead),
      zohoLeadId: getString(payload.input.zohoLeadId),
      clickUpTaskId: getString(payload.input.clickUpTaskId),
    });
    return;
  }

  if (whatsappKind === "document_upload_notification" && isRecord(payload.input)) {
    await sendInternalWhatsAppDocumentUploadNotification(
      getDocumentUploadPayload(payload.input)
    );
    return;
  }

  if (whatsappKind === "portal_request_notification" && isRecord(payload.input)) {
    await sendInternalWhatsAppPortalRequestNotification(
      getPortalRequestPayload(payload.input)
    );
    return;
  }

  const body = getString(payload.body);

  if (!body) {
    throw new Error("Missing safe retry payload.");
  }

  const client = twilio(
    requireEnv("TWILIO_ACCOUNT_SID"),
    requireEnv("TWILIO_AUTH_TOKEN")
  );

  await client.messages.create({
    from: requireEnv("TWILIO_WHATSAPP_FROM"),
    to: requireEnv("WHATSAPP_INTERNAL_TO"),
    body,
  });
}

async function retryGoogleSheetsLog(payload: Record<string, unknown>) {
  await appendLeadToSheet({
    lead: getLeadPayload(payload.lead),
    zohoLeadId: getString(payload.zohoLeadId),
    clickUpTaskId: getString(payload.clickUpTaskId),
    status: getString(payload.status) || "Retry",
  });
}

async function retryClickUpComment(payload: Record<string, unknown>) {
  const commentKind = getString(payload.commentKind);

  if (commentKind === "document_upload" && isRecord(payload.input)) {
    await addClickUpDocumentUploadComment(getDocumentCommentPayload(payload.input));
    return;
  }

  if (commentKind === "task_item_update" && isRecord(payload.input)) {
    await addClickUpTaskItemClientUpdateComment(
      getTaskItemCommentPayload(payload.input)
    );
    return;
  }

  const taskId = getString(payload.taskId);
  const commentText = getString(payload.commentText);

  if (!taskId || !commentText) {
    throw new Error("Missing safe retry payload.");
  }

  const response = await fetch(
    `https://api.clickup.com/api/v2/task/${taskId}/comment`,
    {
      method: "POST",
      headers: {
        Authorization: requireEnv("CLICKUP_API_TOKEN"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment_text: commentText,
        notify_all: false,
      }),
    }
  );
  await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error("ClickUp comment retry failed.");
  }
}

async function retryClickUpAttachment(payload: Record<string, unknown>) {
  const taskId = getString(payload.taskId);
  const bucket = getString(payload.bucket);
  const storagePath = getString(payload.storagePath);
  const fileName = getString(payload.fileName) || "attachment";
  const contentType = getString(payload.contentType);

  if (!taskId || !bucket || !storagePath) {
    throw new Error("Missing safe retry payload.");
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .download(storagePath);

  if (error || !data) {
    throw new Error("Stored attachment could not be loaded.");
  }

  await attachFileToClickUpTask({
    taskId,
    file: new File([data], fileName, {
      type: contentType || data.type || undefined,
    }),
  });
}

async function runRetryAction(type: RetryType, payload: Record<string, unknown>) {
  if (type === "resend_email") {
    await retryResendEmail(payload);
    return;
  }

  if (type === "twilio_whatsapp") {
    await retryTwilioWhatsApp(payload);
    return;
  }

  if (type === "google_sheets_log") {
    await retryGoogleSheetsLog(payload);
    return;
  }

  if (type === "clickup_comment") {
    await retryClickUpComment(payload);
    return;
  }

  await retryClickUpAttachment(payload);
}

function getLeadPayload(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Missing safe retry payload.");
  }

  return {
    name: getString(value.name),
    email: getString(value.email),
    phone: getString(value.phone),
    company: getString(value.company),
    service: getString(value.service),
    message: getString(value.message),
    source: getString(value.source) || "Website Contact Form",
  };
}

function getDocumentUploadPayload(value: Record<string, unknown>) {
  return {
    clientName: getString(value.clientName),
    clientEmail: getString(value.clientEmail),
    clientPhone: getString(value.clientPhone) || null,
    company: getString(value.company) || null,
    documentType: getString(value.documentType),
    fileName: getString(value.fileName),
    notes: getString(value.notes) || null,
    requestId: getString(value.requestId),
    requestService: getString(value.requestService) || null,
    requestStatus: getString(value.requestStatus) || null,
  };
}

function getPortalRequestPayload(value: Record<string, unknown>) {
  return {
    clientName: getString(value.clientName),
    clientEmail: getString(value.clientEmail),
    clientPhone: getString(value.clientPhone) || null,
    company: getString(value.company) || null,
    service: getString(value.service),
    urgency: getString(value.urgency),
    preferredContactMethod: getString(value.preferredContactMethod),
    message: getString(value.message),
    billingNotes: getString(value.billingNotes) || null,
    portalRequestId: getString(value.portalRequestId),
    clickUpTaskId: getString(value.clickUpTaskId),
  };
}

function getDocumentCommentPayload(value: Record<string, unknown>) {
  return {
    ...getDocumentUploadPayload(value),
    clickUpTaskId: getString(value.clickUpTaskId),
    documentId: getString(value.documentId),
    clickUpAttachmentSucceeded: Boolean(value.clickUpAttachmentSucceeded),
  };
}

function getTaskItemCommentPayload(value: Record<string, unknown>) {
  const typeValue = getString(value.type);

  if (typeValue !== "subtask" && typeValue !== "checklist") {
    throw new Error("Missing safe retry payload.");
  }

  const type: "subtask" | "checklist" = typeValue;

  return {
    parentTaskId: getString(value.parentTaskId),
    taskItemId: getString(value.taskItemId),
    type,
    requestService: getString(value.requestService),
    taskItemName: getString(value.taskItemName) || null,
    clientName: getString(value.clientName),
    clientEmail: getString(value.clientEmail),
    notes: getString(value.notes) || null,
    fileName: getString(value.fileName) || null,
    documentId: getString(value.documentId) || null,
    markedComplete: Boolean(value.markedComplete),
    clickUpAttachmentSucceeded:
      typeof value.clickUpAttachmentSucceeded === "boolean"
        ? value.clickUpAttachmentSucceeded
        : null,
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const errorId = typeof id === "string" ? id.trim() : "";

  if (!errorId || !isUuid(errorId)) {
    return NextResponse.json({ message: "Invalid error ID." }, { status: 400 });
  }

  const { user, errorResponse } = await getInternalAdminUser();

  if (errorResponse) {
    return errorResponse;
  }

  const adminEmail = user.email?.toLowerCase() || user.id;

  const supabaseAdmin = createAdminClient();
  const { data: workflowError, error: lookupError } = await supabaseAdmin
    .from("workflow_errors")
    .select("id, source, context, retryable, retry_attempts")
    .eq("id", errorId)
    .maybeSingle<WorkflowErrorRecord>();

  if (lookupError) {
    console.error("Workflow error retry lookup failed:", {
      message: lookupError.message,
      code: lookupError.code,
    });
    return NextResponse.json(
      { message: "Error could not be loaded for retry." },
      { status: 500 }
    );
  }

  if (!workflowError) {
    return NextResponse.json({ message: "Error not found." }, { status: 404 });
  }

  if (!workflowError.retryable) {
    return NextResponse.json(
      { message: "This error is not marked as retryable." },
      { status: 400 }
    );
  }

  const nextRetryAttempts = (workflowError.retry_attempts ?? 0) + 1;
  const retryStartedAt = new Date().toISOString();
  const retryType = getRetryType(workflowError);
  const retryPayload = getRetryPayload(workflowError.context);

  async function updateRetry(fields: Record<string, unknown>) {
    const { error: updateError } = await supabaseAdmin
      .from("workflow_errors")
      .update({
        retry_attempts: nextRetryAttempts,
        last_retry_at: retryStartedAt,
        last_retry_by: adminEmail,
        ...fields,
      })
      .eq("id", errorId);

    if (updateError) {
      console.error("Workflow error retry update failed:", {
        message: updateError.message,
        code: updateError.code,
      });
      throw new Error("Retry status could not be updated.");
    }
  }

  if (!retryType || !retryPayload) {
    await updateRetry({
      retry_status: "blocked",
      last_retry_message: insufficientContextMessage,
    });

    return NextResponse.json({
      success: false,
      message: insufficientContextMessage,
    });
  }

  try {
    await runRetryAction(retryType, retryPayload);
    await updateRetry({
      retry_status: "success",
      last_retry_message: "Retry completed successfully.",
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: adminEmail,
      resolution_note: "Resolved by successful retry.",
    });

    return NextResponse.json({
      success: true,
      message: "Retry completed successfully.",
    });
  } catch (retryError) {
    console.error("Workflow error retry failed:", {
      message:
        retryError instanceof Error ? retryError.message : "Unknown retry error.",
    });
    await updateRetry({
      retry_status: "failed",
      last_retry_message: "Retry failed. Please review the error details.",
      resolved: false,
    });

    return NextResponse.json({
      success: false,
      message: "Retry failed. Please review the error details.",
    });
  }
}
