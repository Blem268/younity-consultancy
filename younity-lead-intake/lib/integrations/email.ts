import { Resend } from "resend";

type Lead = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  source: string;
};

type LeadEmailInput = {
  lead: Lead;
  zohoLeadId?: string;
  clickUpTaskId?: string;
  clickUpTaskUrl?: string;
};

type DocumentUploadNotificationInput = {
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

type PortalRequestNotificationInput = {
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  company?: string | null;
  service: string;
  urgency: string;
  preferredContactMethod: string;
  message: string;
  portalRequestId: string;
  clickUpTaskId?: string;
};

function getResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  return new Resend(resendApiKey);
}

function getResendFromEmail() {
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendFromEmail) {
    throw new Error("Missing RESEND_FROM_EMAIL.");
  }

  return resendFromEmail;
}

export async function sendLeadNotificationEmail({
  lead,
  zohoLeadId,
  clickUpTaskId,
  clickUpTaskUrl,
}: LeadEmailInput) {
  const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL;

  if (!notificationEmail) {
    throw new Error("Missing LEAD_NOTIFICATION_EMAIL.");
  }

  const resend = getResendClient();
  const fromEmail = getResendFromEmail();

  const result = await resend.emails.send({
    from: fromEmail,
    to: notificationEmail,
    subject: `New Website Lead: ${lead.service}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>New Website Lead Received</h2>

        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Company:</strong> ${lead.company}</p>
        <p><strong>Service:</strong> ${lead.service}</p>
        <p><strong>Source:</strong> ${lead.source}</p>

        <h3>Message</h3>
        <p>${lead.message}</p>

        <h3>Integration Details</h3>
        <p><strong>Zoho Lead ID:</strong> ${zohoLeadId || "Not available"}</p>
        <p><strong>ClickUp Task ID:</strong> ${clickUpTaskId || "Not available"}</p>
        <p><strong>ClickUp Task URL:</strong> ${
          clickUpTaskUrl
            ? `<a href="${clickUpTaskUrl}">${clickUpTaskUrl}</a>`
            : "Not available"
        }</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

export async function sendClientConfirmationEmail({ lead }: { lead: Lead }) {
  if (!lead.email) {
    throw new Error("Missing client email address.");
  }

  const resend = getResendClient();
  const fromEmail = getResendFromEmail();

  const result = await resend.emails.send({
    from: fromEmail,
    to: lead.email,
    subject: "We received your request — Younity Consultancy",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>We received your request</h2>

        <p>Hi ${lead.name},</p>

        <p>
          Thank you for contacting <strong>Younity Consultancy</strong>.
          We have received your request for:
        </p>

        <p><strong>Service:</strong> ${lead.service}</p>

        <p>
          Our team will review your details and contact you shortly.
        </p>

        <h3>Your submitted details</h3>

        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Company:</strong> ${lead.company}</p>
        <p><strong>Message:</strong> ${lead.message}</p>

        <p>
          Regards,<br />
          <strong>Younity Consultancy</strong>
        </p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

export async function sendDocumentUploadNotificationEmail({
  clientName,
  clientEmail,
  clientPhone,
  company,
  documentType,
  fileName,
  notes,
  requestId,
  requestService,
  requestStatus,
}: DocumentUploadNotificationInput) {
  const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL;

  if (!notificationEmail) {
    throw new Error("Missing LEAD_NOTIFICATION_EMAIL.");
  }

  const resend = getResendClient();
  const fromEmail = getResendFromEmail();

  const result = await resend.emails.send({
    from: fromEmail,
    to: notificationEmail,
    subject: `New Client Document Upload: ${documentType}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>New Client Document Upload</h2>

        <h3>Client Details</h3>
        <p><strong>Client name:</strong> ${clientName}</p>
        <p><strong>Client email:</strong> ${clientEmail}</p>
        <p><strong>Client phone:</strong> ${clientPhone || "Not provided"}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>

        <h3>Document Details</h3>
        <p><strong>Document type:</strong> ${documentType}</p>
        <p><strong>File name:</strong> ${fileName}</p>
        <p><strong>Related request service:</strong> ${
          requestService || "General / Not linked"
        }</p>
        <p><strong>Related request status:</strong> ${
          requestStatus || "Not available"
        }</p>
        <p><strong>Request ID:</strong> ${requestId || "Not linked"}</p>

        <h3>Notes</h3>
        <p>${notes || "None"}</p>

        <p>
          The file is stored securely in the Younity client portal storage.
        </p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

export async function sendPortalRequestNotificationEmail({
  clientName,
  clientEmail,
  clientPhone,
  company,
  service,
  urgency,
  preferredContactMethod,
  message,
  portalRequestId,
  clickUpTaskId,
}: PortalRequestNotificationInput) {
  const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL;

  if (!notificationEmail) {
    throw new Error("Missing LEAD_NOTIFICATION_EMAIL.");
  }

  const resend = getResendClient();
  const fromEmail = getResendFromEmail();

  const result = await resend.emails.send({
    from: fromEmail,
    to: notificationEmail,
    subject: `New Client Portal Request: ${service}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>New Client Portal Request</h2>

        <h3>Client Details</h3>
        <p><strong>Client name:</strong> ${clientName}</p>
        <p><strong>Client email:</strong> ${clientEmail}</p>
        <p><strong>Client phone:</strong> ${clientPhone || "Not provided"}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>

        <h3>Request Details</h3>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Urgency:</strong> ${urgency}</p>
        <p><strong>Preferred contact method:</strong> ${preferredContactMethod}</p>
        <p><strong>Message:</strong> ${message}</p>

        <h3>Integration Details</h3>
        <p><strong>Portal Request ID:</strong> ${portalRequestId}</p>
        <p><strong>ClickUp Task ID:</strong> ${clickUpTaskId || "Not available"}</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}
