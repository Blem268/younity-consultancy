export function friendlyPortalText(value: string) {
  return value
    .replaceAll("client_requests", "requests")
    .replaceAll("Client Requests", "Requests")
    .replaceAll("client requests", "requests")
    .replaceAll("sync", "update")
    .replaceAll("Sync", "Update")
    .replaceAll("billing fields", "profile details")
    .replaceAll("Billing fields", "Profile details");
}

export function formatPortalDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
