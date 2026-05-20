import twilio from "twilio";

type InternalWhatsAppLeadInput = {
  lead: {
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    message: string;
    source: string;
  };
  zohoLeadId?: string;
  clickUpTaskId?: string;
};

type InternalWhatsAppDocumentUploadInput = {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  company?: string | null;
  documentType: string;
  fileName: string;
  notes?: string | null;
  requestId?: string;
  requestService?: string | null;
  requestStatus?: string | null;
};

type InternalWhatsAppPortalRequestInput = {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  company?: string | null;
  service: string;
  urgency: string;
  preferredContactMethod: string;
  message: string;
  billingNotes?: string | null;
  portalRequestId: string;
  clickUpTaskId?: string;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export async function sendInternalWhatsAppLeadNotification({
  lead,
  zohoLeadId,
  clickUpTaskId,
}: InternalWhatsAppLeadInput) {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const from = requireEnv("TWILIO_WHATSAPP_FROM");
  const to = requireEnv("WHATSAPP_INTERNAL_TO");

  const client = twilio(accountSid, authToken);

  const body = [
    "New Younity website lead received.",
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone}`,
    `Company: ${lead.company}`,
    `Service: ${lead.service}`,
    `Source: ${lead.source}`,
    "",
    `Message: ${lead.message}`,
    "",
    `Zoho Lead ID: ${zohoLeadId || "Not available"}`,
    `ClickUp Task ID: ${clickUpTaskId || "Not available"}`,
  ].join("\n");

  const message = await client.messages.create({
    from,
    to,
    body,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}

export async function sendInternalWhatsAppDocumentUploadNotification({
  clientName,
  clientEmail,
  clientPhone,
  company,
  documentType,
  fileName,
  notes,
  requestService,
  requestStatus,
}: InternalWhatsAppDocumentUploadInput) {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const from = requireEnv("TWILIO_WHATSAPP_FROM");
  const to = requireEnv("WHATSAPP_INTERNAL_TO");

  const client = twilio(accountSid, authToken);

  const body = [
    "New Younity client document uploaded.",
    "",
    `Client: ${clientName}`,
    `Email: ${clientEmail}`,
    `Phone: ${clientPhone || "Not provided"}`,
    `Company: ${company || "Not provided"}`,
    "",
    `Document Type: ${documentType}`,
    `File Name: ${fileName}`,
    "",
    `Related Request: ${requestService || "General / Not linked"}`,
    `Request Status: ${requestStatus || "Not available"}`,
    "",
    `Notes: ${notes || "None"}`,
  ].join("\n");

  const message = await client.messages.create({
    from,
    to,
    body,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}

export async function sendInternalWhatsAppPortalRequestNotification({
  clientName,
  clientEmail,
  clientPhone,
  company,
  service,
  urgency,
  preferredContactMethod,
  message,
  billingNotes,
  portalRequestId,
  clickUpTaskId,
}: InternalWhatsAppPortalRequestInput) {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const from = requireEnv("TWILIO_WHATSAPP_FROM");
  const to = requireEnv("WHATSAPP_INTERNAL_TO");

  const client = twilio(accountSid, authToken);

  const body = [
    "New Younity client portal request submitted.",
    "",
    `Client: ${clientName}`,
    `Email: ${clientEmail}`,
    `Phone: ${clientPhone || "Not provided"}`,
    `Company: ${company || "Not provided"}`,
    "",
    `Service: ${service}`,
    `Urgency: ${urgency}`,
    `Preferred Contact Method: ${preferredContactMethod}`,
    "",
    `Message: ${message}`,
    "",
    `Billing Notes: ${billingNotes || "None"}`,
    "",
    `Portal Request ID: ${portalRequestId}`,
    `ClickUp Task ID: ${clickUpTaskId || "Not available"}`,
  ].join("\n");

  const twilioMessage = await client.messages.create({
    from,
    to,
    body,
  });

  return {
    sid: twilioMessage.sid,
    status: twilioMessage.status,
  };
}
