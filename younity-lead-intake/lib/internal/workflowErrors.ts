import { createAdminClient } from "@/lib/supabase/admin";

type WorkflowErrorSeverity = "info" | "warning" | "error" | "critical";

type LogWorkflowErrorInput = {
  source: string;
  severity?: WorkflowErrorSeverity;
  message: string;
  context?: unknown;
  relatedClientId?: string | null;
  relatedRequestId?: string | null;
  relatedDocumentId?: string | null;
  retryable?: boolean;
  retryStatus?: string | null;
};

const sensitiveKeyPattern =
  /token|secret|api[_-]?key|authorization|cookie|password|refresh|bearer|session/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return "[Max depth reached]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 2000 ? `${value.slice(0, 2000)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 30)
        .map(([key, entryValue]) => [
          key,
          sensitiveKeyPattern.test(key)
            ? "[Redacted]"
            : sanitizeValue(entryValue, depth + 1),
        ])
    );
  }

  return String(value);
}

function sanitizeContext(context: unknown) {
  if (context === undefined) {
    return null;
  }

  return sanitizeValue(context);
}

export async function logWorkflowError({
  source,
  severity = "error",
  message,
  context,
  relatedClientId,
  relatedRequestId,
  relatedDocumentId,
  retryable = false,
  retryStatus,
}: LogWorkflowErrorInput) {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("workflow_errors").insert({
      source,
      severity,
      message,
      context: sanitizeContext(context),
      related_client_id: relatedClientId || null,
      related_request_id: relatedRequestId || null,
      related_document_id: relatedDocumentId || null,
      retryable,
      retry_status: retryStatus || null,
    });

    if (error) {
      console.error("Workflow error logging failed:", {
        message: error.message,
        code: error.code,
      });
    }
  } catch (error) {
    console.error("Workflow error logging unavailable:", {
      message:
        error instanceof Error ? error.message : "Unknown workflow log error.",
    });
  }
}
