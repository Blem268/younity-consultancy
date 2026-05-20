import type { LeadInput } from "@/lib/validators/leadSchema";

export async function appendLeadToSheet(params: {
  lead: LeadInput;
  zohoLeadId?: string;
  clickUpTaskId?: string;
  status: string;
}) {
  if (!process.env.GOOGLE_SHEETS_WEB_APP_URL) {
    throw new Error("Missing GOOGLE_SHEETS_WEB_APP_URL");
  }

  const response = await fetch(process.env.GOOGLE_SHEETS_WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      name: params.lead.name,
      email: params.lead.email,
      phone: params.lead.phone,
      company: params.lead.company,
      service: params.lead.service,
      message: params.lead.message,
      source: params.lead.source,
      zohoLeadId: params.zohoLeadId || "",
      clickUpTaskId: params.clickUpTaskId || "",
      status: params.status,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(`Google Sheet log failed: ${JSON.stringify(result)}`);
  }

  return result;
}