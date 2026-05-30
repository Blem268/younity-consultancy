/** Shared select fragments for client_requests (priority column may not exist until migration runs). */

export const clientRequestDetailSelectWithPriority =
  "id, client_id, service, status, message, priority, created_at, updated_at, clients(id, full_name, email, company)";

export const clientRequestDetailSelectWithoutPriority =
  "id, client_id, service, status, message, created_at, updated_at, clients(id, full_name, email, company)";

export function isMissingPriorityColumnError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    message.includes("priority") ||
    message.includes("column") && message.includes("does not exist")
  );
}
